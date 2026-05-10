#!/usr/bin/env python3
"""
Build a CoralScapes-style dataset tree for 6-class training:

  <output>/
    leftImg8bit/train|val|test/<site>/*_leftImg8bit.png   (copied from coralscapes)
    gtFine/train|val|test/<site>/*_gtFine.png             (copied from 6-class masks)

Same relative paths as coralscapes so pairing stays trivial.

Usage:
  python build_6class_coralscapes_layout.py
  python build_6class_coralscapes_layout.py --output my_coral_6class
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT / "lib"))
from project_paths import CORALSCAPES, CORALSCAPES_6CLASS

try:
    from tqdm import tqdm
except ImportError:
    tqdm = None  # type: ignore[misc, assignment]

SPLITS = ("train", "val", "test")

CLASSES_6 = {
    "Water / Background": 0,
    "Live Coral": 1,
    "Bleached Coral": 2,
    "Dead Coral": 3,
    "Algae": 4,
    "Benthic Substrate": 5,
}

# RGB triples (same convention as coralscapes/colors.json). Matches visualize_random_6class.py BGR palette.
COLORS_6 = {
    "Water / Background": [40, 100, 180],
    "Live Coral": [255, 80, 200],
    "Bleached Coral": [255, 255, 220],
    "Dead Coral": [140, 50, 50],
    "Algae": [60, 200, 80],
    "Benthic Substrate": [200, 180, 160],
}


def copy_files(
    src_root: Path,
    dst_root: Path,
    desc: str,
    glob_pattern: str = "*.png",
) -> int:
    paths = sorted(p for p in src_root.rglob(glob_pattern) if p.is_file())
    it = paths
    if tqdm is not None:
        it = tqdm(paths, desc=desc, unit="file")
    n = 0
    for src in it:
        rel = src.relative_to(src_root)
        dst = dst_root / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        n += 1
    return n


def main() -> None:
    p = argparse.ArgumentParser(description="CoralScapes-style folder for 6-class masks + RGB.")
    p.add_argument("--images", type=Path, default=CORALSCAPES / "leftImg8bit")
    p.add_argument(
        "--masks-6",
        type=Path,
        default=CORALSCAPES_6CLASS / "gtFine",
        help="6-class gtFine tree (default: data/coralscapes_6class_dataset/gtFine)",
    )
    p.add_argument("--output", type=Path, default=CORALSCAPES_6CLASS)
    p.add_argument(
        "--overwrite",
        action="store_true",
        help="If output exists, still copy (replaces files).",
    )
    args = p.parse_args()

    img_src = args.images.resolve()
    mask_src = args.masks_6.resolve()
    out = args.output.resolve()

    if not img_src.is_dir():
        raise FileNotFoundError(f"Missing images root: {img_src}")
    if not mask_src.is_dir():
        raise FileNotFoundError(f"Missing 6-class masks root: {mask_src}")

    if out.exists() and any(out.iterdir()) and not args.overwrite:
        raise FileExistsError(
            f"Output not empty: {out}\n"
            "Use --overwrite to replace, or pick a different --output."
        )

    out.mkdir(parents=True, exist_ok=True)

    img_dst = out / "leftImg8bit"
    mask_dst = out / "gtFine"

    # Avoid duplicating onto itself when masks already live under output.
    if mask_src.resolve() == mask_dst.resolve():
        if not mask_dst.is_dir() or not any(mask_dst.rglob("*.png")):
            raise FileNotFoundError(
                f"No 6-class masks at {mask_dst}. Run first:\n"
                f"  python scripts/remap_masks_to_6_classes.py --input data/coralscapes/gtFine --output {mask_dst}"
            )
        n_m = sum(1 for _ in mask_dst.rglob("*.png") if _.is_file())
        print(f"gtFine: using existing masks at {mask_dst} ({n_m} PNGs, skip copy)")
    else:
        n_m = copy_files(mask_src, mask_dst, desc="gtFine (6-class)")

    # Skip image copy if leftImg8bit is already linked to the same tree (junction).
    if img_dst.exists() and img_dst.resolve() == img_src.resolve():
        n_img = sum(1 for _ in img_dst.rglob("*.png") if _.is_file())
        print(f"leftImg8bit: already points at {img_src} ({n_img} PNGs, skip copy)")
    else:
        n_img = copy_files(img_src, img_dst, desc="leftImg8bit")

    meta = out / "classes_6.json"
    with meta.open("w", encoding="utf-8") as f:
        json.dump(CLASSES_6, f, indent=2)

    colors_path = out / "colors_6.json"
    with colors_path.open("w", encoding="utf-8") as f:
        json.dump(COLORS_6, f, indent=2)

    print(f"\nOutput:  {out}")
    print(f"Images:  {n_img} files -> leftImg8bit/")
    print(f"Masks:   {n_m} files -> gtFine/")
    print(f"Meta:    {meta}")
    print(f"Colors:  {colors_path}  (6-class RGB; original coralscapes/colors.json is 39-class)")
    print("\nLayout matches coralscapes: leftImg8bit/<split>/... and gtFine/<split>/...")


if __name__ == "__main__":
    main()
