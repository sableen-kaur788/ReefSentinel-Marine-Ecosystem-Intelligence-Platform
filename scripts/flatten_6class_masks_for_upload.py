#!/usr/bin/env python3
"""
Copy all 6-class mask PNGs into one flat folder for upload (e.g. Kaggle).

Output names: {split}_{site}_{original_filename}
  e.g. train_site15_site15_000023_002292_gtFine.png

Usage:
  python flatten_6class_masks_for_upload.py
  python flatten_6class_masks_for_upload.py --output my_masks_flat
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT / "lib"))
from project_paths import CORALSCAPES_6CLASS, OUTPUTS

try:
    from tqdm import tqdm
except ImportError:
    tqdm = None  # type: ignore[misc, assignment]


SPLITS = ("train", "val", "test")


def main() -> None:
    p = argparse.ArgumentParser(description="Flatten 6-class masks into one folder.")
    p.add_argument(
        "--input",
        type=Path,
        default=CORALSCAPES_6CLASS / "gtFine",
        help="Root with train/val/test subfolders",
    )
    p.add_argument(
        "--output",
        type=Path,
        default=OUTPUTS / "six_class_masks_upload",
        help="Single output directory (created)",
    )
    args = p.parse_args()

    src_root = args.input.resolve()
    dst_root = args.output.resolve()
    if not src_root.is_dir():
        raise FileNotFoundError(f"Missing input folder: {src_root}")

    dst_root.mkdir(parents=True, exist_ok=True)

    jobs: list[tuple[Path, Path]] = []
    for split in SPLITS:
        d = src_root / split
        if not d.is_dir():
            continue
        for png in sorted(d.rglob("*.png")):
            rel = png.relative_to(d)
            if len(rel.parts) < 2:
                flat_name = f"{split}_{rel.name}"
            else:
                site = rel.parts[0]
                flat_name = f"{split}_{site}_{rel.name}"
            jobs.append((png, dst_root / flat_name))

    if not jobs:
        raise FileNotFoundError(f"No PNG masks under {src_root}")

    iterator = jobs
    if tqdm is not None:
        iterator = tqdm(jobs, desc="Copying masks", unit="file")

    for src, dst in iterator:
        shutil.copy2(src, dst)

    print(f"Source:      {src_root}")
    print(f"Destination: {dst_root}")
    print(f"Copied:      {len(jobs)} PNG files")


if __name__ == "__main__":
    main()
