#!/usr/bin/env python3
"""
Summarize a CoralScapes/Cityscapes-style dataset.

Expected structure:
  data/coralscapes/
    classes.json
    colors.json
    leftImg8bit/{train,val,test}/<site>/*_leftImg8bit.png
    gtFine/{train,val,test}/<site>/*_gtFine.png
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT / "lib"))
from project_paths import CORALSCAPES


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}
SPLITS = ("train", "val", "test")


def load_json(path: Path) -> Dict:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def list_files(root: Path, split: str) -> List[Path]:
    split_dir = root / split
    if not split_dir.exists():
        return []
    return sorted(
        p for p in split_dir.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    )


def count_by_site(paths: Iterable[Path], split_dir: Path) -> Counter:
    counts: Counter = Counter()
    for p in paths:
        rel = p.relative_to(split_dir)
        site = rel.parts[0] if len(rel.parts) > 1 else "unknown_site"
        counts[site] += 1
    return counts


def map_image_to_mask_name(image_name: str) -> str:
    return image_name.replace("_leftImg8bit", "_gtFine")


def check_pairing(image_root: Path, mask_root: Path) -> Tuple[int, int, List[Tuple[Path, Path]]]:
    total_images = 0
    total_masks = 0
    missing_masks: List[Tuple[Path, Path]] = []

    for split in SPLITS:
        image_files = list_files(image_root, split)
        mask_files = list_files(mask_root, split)
        total_images += len(image_files)
        total_masks += len(mask_files)

        for image_file in image_files:
            rel = image_file.relative_to(image_root / split)
            expected_mask = mask_root / split / rel.parent / map_image_to_mask_name(rel.name)
            if not expected_mask.exists():
                missing_masks.append((image_file, expected_mask))

    return total_images, total_masks, missing_masks


def try_mask_pixel_stats(mask_root: Path, max_files: int | None = None) -> Dict[int, int] | None:
    """
    Optional deeper analysis:
    Count pixel occurrences of each class id from gtFine masks.
    Requires Pillow and numpy.
    """
    try:
        import numpy as np
        from PIL import Image
    except Exception:
        return None

    class_pixels: defaultdict[int, int] = defaultdict(int)
    scanned = 0

    for split in SPLITS:
        for mask in list_files(mask_root, split):
            arr = np.array(Image.open(mask))
            unique, counts = np.unique(arr, return_counts=True)
            for class_id, count in zip(unique.tolist(), counts.tolist()):
                class_pixels[int(class_id)] += int(count)

            scanned += 1
            if max_files is not None and scanned >= max_files:
                return dict(sorted(class_pixels.items()))

    return dict(sorted(class_pixels.items()))


def print_header(title: str) -> None:
    print("\n" + "=" * 72)
    print(title)
    print("=" * 72)


def main() -> None:
    parser = argparse.ArgumentParser(description="Summarize CoralScapes dataset contents.")
    parser.add_argument(
        "dataset_dir",
        nargs="?",
        default=str(CORALSCAPES),
        help="Path to dataset root (default: data/coralscapes)",
    )
    parser.add_argument(
        "--pixel-stats",
        action="store_true",
        help="Also compute per-class pixel counts from mask PNGs (slower, needs pillow+numpy).",
    )
    parser.add_argument(
        "--max-mask-files",
        type=int,
        default=None,
        help="Limit number of mask files for --pixel-stats quick scan.",
    )
    args = parser.parse_args()

    root = Path(args.dataset_dir).resolve()
    image_root = root / "leftImg8bit"
    mask_root = root / "gtFine"

    classes = load_json(root / "classes.json")
    colors = load_json(root / "colors.json")

    print_header("DATASET PATH")
    print(root)
    print(f"Exists: {root.exists()}")

    print_header("LABEL METADATA")
    print(f"Number of labels in classes.json: {len(classes)}")
    if classes:
        for name, class_id in sorted(classes.items(), key=lambda kv: kv[1]):
            color = colors.get(name, "N/A")
            print(f"  id={class_id:>2}  label='{name}'  color={color}")

    print_header("SPLIT + SITE BREAKDOWN")
    total_images = 0
    total_masks = 0
    for split in SPLITS:
        imgs = list_files(image_root, split)
        masks = list_files(mask_root, split)
        total_images += len(imgs)
        total_masks += len(masks)

        print(f"\n[{split}] images={len(imgs)} masks={len(masks)}")
        site_counts = count_by_site(imgs, image_root / split)
        if not site_counts:
            print("  No files found.")
            continue
        for site, count in sorted(site_counts.items()):
            print(f"  - {site}: {count}")

    print_header("PAIRING CHECK")
    p_images, p_masks, missing = check_pairing(image_root, mask_root)
    print(f"Total images found: {p_images}")
    print(f"Total masks found:  {p_masks}")
    print(f"Image/mask totals match: {p_images == p_masks}")
    print(f"Missing mask files for images: {len(missing)}")
    for image_path, expected_mask in missing[:10]:
        print(f"  MISSING: image={image_path} expected_mask={expected_mask}")
    if len(missing) > 10:
        print(f"  ... plus {len(missing) - 10} more")

    if args.pixel_stats:
        print_header("PIXEL-LEVEL CLASS DISTRIBUTION")
        pixel_stats = try_mask_pixel_stats(mask_root, max_files=args.max_mask_files)
        if pixel_stats is None:
            print("Install dependencies first: pip install pillow numpy")
        elif not pixel_stats:
            print("No pixel statistics produced (no readable masks found).")
        else:
            id_to_name = {v: k for k, v in classes.items()}
            for class_id, pixels in pixel_stats.items():
                label_name = id_to_name.get(class_id, "<unknown_id>")
                print(f"  id={class_id:>2} label='{label_name}' pixels={pixels}")


if __name__ == "__main__":
    main()
