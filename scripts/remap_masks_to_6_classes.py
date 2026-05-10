#!/usr/bin/env python3
"""
Remap coral segmentation masks from original class IDs to 6 classes.

Input folder structure example:
  input_masks/
    site1/
      xxx_gtFine.png

Output folder structure:
  output_masks/
    site1/
      xxx_gtFine.png

Usage:
  python remap_masks_to_6_classes.py --input input_masks --output output_masks
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np

_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT / "lib"))
from coralscapes_6class_lut import build_lut, remap_mask
from project_paths import CORALSCAPES_6CLASS


def list_png_files(root: Path) -> list[Path]:
    return sorted([p for p in root.rglob("*.png") if p.is_file()])


def iter_with_progress(paths: list[Path], disable_tqdm: bool = False) -> Iterable[Path]:
    if disable_tqdm:
        for p in paths:
            yield p
        return

    try:
        from tqdm import tqdm

        yield from tqdm(paths, desc="Remapping masks", unit="mask")
    except Exception:
        # Fallback progress if tqdm is not installed.
        total = len(paths)
        for i, p in enumerate(paths, start=1):
            print(f"[{i}/{total}] {p.name}")
            yield p


def load_mask_grayscale(path: Path) -> np.ndarray:
    """
    Load a segmentation mask as single-channel integer image.
    Handles grayscale masks and safely reduces RGB masks to one channel.
    """
    mask = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if mask is None:
        raise ValueError(f"Failed to read mask: {path}")

    if mask.ndim == 3:
        # If stored as RGB, class IDs are usually duplicated across channels.
        # Use first channel.
        mask = mask[:, :, 0]

    if mask.ndim != 2:
        raise ValueError(f"Expected 2D mask, got shape={mask.shape} at {path}")

    return mask


def save_mask(path: Path, mask: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    ok = cv2.imwrite(str(path), mask)
    if not ok:
        raise ValueError(f"Failed to save mask: {path}")


def process_all(input_dir: Path, output_dir: Path, disable_tqdm: bool = False) -> None:
    mask_paths = list_png_files(input_dir)
    if not mask_paths:
        raise FileNotFoundError(f"No PNG masks found under: {input_dir}")

    lut = build_lut(max_class_id=255)
    processed = 0

    for src_path in iter_with_progress(mask_paths, disable_tqdm=disable_tqdm):
        rel = src_path.relative_to(input_dir)
        dst_path = output_dir / rel

        mask = load_mask_grayscale(src_path)
        new_mask = remap_mask(mask, lut)
        save_mask(dst_path, new_mask)
        processed += 1

    print("\nDone.")
    print(f"Input dir : {input_dir}")
    print(f"Output dir: {output_dir}")
    print(f"Processed : {processed} masks")
    print("New classes: 0=Background, 1=Live, 2=Bleached, 3=Dead, 4=Algae, 5=Benthic")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remap segmentation masks from original IDs to 6 classes."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("input_masks"),
        help="Input mask directory (default: input_masks)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=CORALSCAPES_6CLASS / "gtFine",
        help="Output mask directory (default: data/coralscapes_6class_dataset/gtFine)",
    )
    parser.add_argument(
        "--no-tqdm",
        action="store_true",
        help="Disable tqdm progress bar (uses simple fallback prints).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_dir = args.input.resolve()
    output_dir = args.output.resolve()

    if not input_dir.exists() or not input_dir.is_dir():
        raise FileNotFoundError(f"Input directory does not exist or is not a directory: {input_dir}")

    process_all(input_dir=input_dir, output_dir=output_dir, disable_tqdm=args.no_tqdm)


if __name__ == "__main__":
    main()
