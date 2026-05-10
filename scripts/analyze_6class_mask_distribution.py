#!/usr/bin/env python3
"""
Compute pixel-level class distribution for remapped 6-class segmentation masks.

Expects mask PNGs with class IDs 0–5 (as produced by remap_masks_to_6_classes.py).

If --root contains train/, val/, and/or test/ subdirectories, reports per-split
counts plus a global total. Otherwise treats --root as a single mask directory.

Usage:
  python analyze_6class_mask_distribution.py --root coralscapes_6class_dataset/gtFine
  python analyze_6class_mask_distribution.py --root coralscapes_6class_dataset/gtFine --csv stats.csv
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path
from typing import Iterable

import cv2

_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT / "lib"))
from project_paths import CORALSCAPES, CORALSCAPES_6CLASS
import numpy as np

NUM_CLASSES = 6
SPLITS = ("train", "val", "test")

CLASS_NAMES = (
    "Water / Background",
    "Live Coral",
    "Bleached Coral",
    "Dead Coral",
    "Algae",
    "Benthic Substrate",
)


def list_png_files(root: Path) -> list[Path]:
    return sorted(p for p in root.rglob("*.png") if p.is_file())


def iter_with_progress(paths: list[Path], desc: str, disable_tqdm: bool) -> Iterable[Path]:
    if disable_tqdm:
        for p in paths:
            yield p
        return
    try:
        from tqdm import tqdm

        yield from tqdm(paths, desc=desc, unit="mask")
    except Exception:
        total = len(paths)
        for i, p in enumerate(paths, start=1):
            print(f"[{i}/{total}] {p.name}")
            yield p


def load_mask_2d(path: Path) -> np.ndarray:
    mask = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if mask is None:
        raise ValueError(f"Failed to read mask: {path}")
    if mask.ndim == 3:
        mask = mask[:, :, 0]
    if mask.ndim != 2:
        raise ValueError(f"Expected 2D mask, got shape={mask.shape} at {path}")
    return mask


def accumulate_bincount(mask: np.ndarray, counts: np.ndarray) -> None:
    flat = mask.ravel().astype(np.int64, copy=False)
    if flat.size == 0:
        return
    valid = flat < NUM_CLASSES
    if not np.any(valid):
        return
    bc = np.bincount(flat[valid], minlength=NUM_CLASSES)
    counts[: bc.shape[0]] += bc


def format_table(
    split_label: str,
    counts: np.ndarray,
    file_count: int,
) -> None:
    total = int(counts.sum())
    print(f"\n{'=' * 72}")
    print(f"{split_label}  (masks: {file_count}, pixels: {total:,})")
    print(f"{'=' * 72}")
    if total == 0:
        print("  (no pixels)")
        return
    for c in range(NUM_CLASSES):
        n = int(counts[c])
        pct = 100.0 * n / total
        print(f"  class {c}  {CLASS_NAMES[c]:<28}  {n:>14,}  {pct:>7.2f}%")


def write_csv(path: Path, rows: list[tuple[str, int, str, int, float]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["split", "class_id", "class_name", "pixels", "percent_of_split"])
        for split, cid, name, pixels, pct in rows:
            w.writerow([split, cid, name, pixels, f"{pct:.4f}"])


def discover_splits(root: Path) -> list[tuple[str, Path]]:
    """Return (split_name, directory) for each split that exists and has PNGs."""
    found: list[tuple[str, Path]] = []
    for name in SPLITS:
        d = root / name
        if d.is_dir() and any(d.rglob("*.png")):
            found.append((name, d))
    return found


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Pixel distribution for 6-class remapped segmentation masks."
    )
    p.add_argument(
        "--root",
        type=Path,
        default=CORALSCAPES_6CLASS / "gtFine",
        help="Root folder: either contains train/val/test or is flat mask tree",
    )
    p.add_argument(
        "--csv",
        type=Path,
        default=None,
        help="Optional path to write CSV (split, class_id, pixels, percent)",
    )
    p.add_argument(
        "--no-tqdm",
        action="store_true",
        help="Disable tqdm progress bar",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        hint = (
            "\n  That path does not exist yet. Example:\n"
            "    python scripts/remap_masks_to_6_classes.py --input data/coralscapes/gtFine --output data/coralscapes_6class_dataset/gtFine\n"
        )
        raise FileNotFoundError(f"Not a directory: {root}{hint}")

    splits_dirs = discover_splits(root)
    if splits_dirs:
        jobs = splits_dirs
    else:
        jobs = [("all", root)]

    global_counts = np.zeros(NUM_CLASSES, dtype=np.int64)
    global_files = 0
    csv_rows: list[tuple[str, int, str, int, float]] = []

    print(f"Root: {root}")
    print(f"Mode: {'per-split (train/val/test)' if len(jobs) > 1 or jobs[0][0] != 'all' else 'single tree'}")

    unexpected_pixels_total = 0

    for split_name, split_dir in jobs:
        paths = list_png_files(split_dir)
        if not paths:
            format_table(f"[{split_name}]", np.zeros(NUM_CLASSES, dtype=np.int64), 0)
            continue

        counts = np.zeros(NUM_CLASSES, dtype=np.int64)
        split_unexpected = 0

        for path in iter_with_progress(
            paths,
            desc=f"Scanning {split_name}",
            disable_tqdm=args.no_tqdm,
        ):
            mask = load_mask_2d(path)
            bad = int(np.sum(mask >= NUM_CLASSES))
            split_unexpected += bad
            accumulate_bincount(mask, counts)

        if split_unexpected:
            unexpected_pixels_total += split_unexpected
            print(
                f"  Warning [{split_name}]: {split_unexpected:,} pixels had id >= {NUM_CLASSES} "
                f"(excluded from class histogram below)"
            )

        total_px = int(counts.sum())
        format_table(f"[{split_name}]", counts, len(paths))

        if args.csv and total_px > 0:
            for c in range(NUM_CLASSES):
                pct = 100.0 * int(counts[c]) / total_px
                csv_rows.append((split_name, c, CLASS_NAMES[c], int(counts[c]), pct))

        global_counts += counts
        global_files += len(paths)

    total_all = int(global_counts.sum())
    if len(jobs) > 1:
        format_table("[ALL SPLITS COMBINED]", global_counts, global_files)

    if args.csv:
        if csv_rows:
            if len(jobs) > 1 and total_all > 0:
                for c in range(NUM_CLASSES):
                    pct = 100.0 * int(global_counts[c]) / total_all
                    csv_rows.append(("all", c, CLASS_NAMES[c], int(global_counts[c]), pct))
            write_csv(args.csv.resolve(), csv_rows)
            print(f"\nWrote CSV: {args.csv.resolve()}")
        else:
            print("\nNo CSV rows written (no masks found).")

    if unexpected_pixels_total:
        print(
            f"\nTotal pixels with id >= {NUM_CLASSES} (excluded from histogram): "
            f"{unexpected_pixels_total:,}"
        )


if __name__ == "__main__":
    main()
