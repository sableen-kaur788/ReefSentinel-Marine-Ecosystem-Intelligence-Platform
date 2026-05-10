#!/usr/bin/env python3
"""
Zip coralscapes_6class_dataset for Kaggle.

Walks the tree with pathlib (follows Windows directory junctions) so leftImg8bit
files are stored as real PNG bytes inside the zip, not empty stubs.

Usage:
  python zip_6class_dataset_for_kaggle.py
  python zip_6class_dataset_for_kaggle.py --output D:\\upload\\coral_6class.zip
"""

from __future__ import annotations

import argparse
import sys
import zipfile
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT / "lib"))
from project_paths import CORALSCAPES_6CLASS


def main() -> None:
    p = argparse.ArgumentParser(description="Zip 6-class CoralScapes dataset for Kaggle.")
    p.add_argument(
        "--dataset",
        type=Path,
        default=CORALSCAPES_6CLASS,
        help="Dataset folder to zip",
    )
    p.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output .zip path (default: sibling of dataset folder, same basename + .zip)",
    )
    args = p.parse_args()

    root = args.dataset.resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"Not a directory: {root}")

    out = args.output
    if out is None:
        out = root.parent / f"{root.name}.zip"
    else:
        out = out.resolve()
    if out.suffix.lower() != ".zip":
        out = out.with_suffix(".zip")

    files = sorted(f for f in root.rglob("*") if f.is_file())
    if not files:
        raise FileNotFoundError(f"No files under: {root}")

    try:
        from tqdm import tqdm

        file_iter = tqdm(files, desc="Zipping", unit="file")
    except ImportError:
        file_iter = files

    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for path in file_iter:
            arc = path.relative_to(root).as_posix()
            zf.write(path, arcname=arc)

    size_mb = out.stat().st_size / (1024 * 1024)
    print(f"Wrote: {out}")
    print(f"Files: {len(files)}  Size: {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
