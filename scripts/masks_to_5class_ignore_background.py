#!/usr/bin/env python3
"""
Convert 6-class masks (0=background ... 5=benthic) into training masks where
background is "empty" for the loss: class 0 -> 255 (ignore), 1..5 -> 0..4.

Use with PyTorch:
  nn.CrossEntropyLoss(ignore_index=255)
  model with num_classes=5

Input/output: same Cityscapes-style tree (train/val/test/.../*.png).

Usage:
  python masks_to_5class_ignore_background.py
  python masks_to_5class_ignore_background.py --output coralscapes_6class_dataset/gtFine_train5
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2

_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT / "lib"))
from project_paths import CORALSCAPES_6CLASS
import numpy as np

try:
    from tqdm import tqdm
except ImportError:
    tqdm = None  # type: ignore[misc, assignment]

IGNORE = 255


def remap(mask: np.ndarray) -> np.ndarray:
    out = np.full(mask.shape, IGNORE, dtype=np.uint8)
    fg = mask > 0
    out[fg] = (mask[fg] - 1).astype(np.uint8)
    return out


def main() -> None:
    p = argparse.ArgumentParser(
        description="6-class masks -> 5-class + 255 ignore for background pixels."
    )
    p.add_argument(
        "--input",
        type=Path,
        default=CORALSCAPES_6CLASS / "gtFine",
        help="Folder with 6-class PNG masks (values 0-5)",
    )
    p.add_argument(
        "--output",
        type=Path,
        default=CORALSCAPES_6CLASS / "gtFine_5class_ignore255",
        help="Output folder (same layout as input)",
    )
    args = p.parse_args()

    src = args.input.resolve()
    dst = args.output.resolve()
    if not src.is_dir():
        raise FileNotFoundError(src)

    paths = sorted(src.rglob("*.png"))
    if not paths:
        raise FileNotFoundError(f"No PNG under {src}")

    it = paths
    if tqdm is not None:
        it = tqdm(paths, desc="Remapping", unit="mask")

    for path in it:
        rel = path.relative_to(src)
        out_path = dst / rel
        out_path.parent.mkdir(parents=True, exist_ok=True)

        m = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
        if m is None:
            raise RuntimeError(f"Cannot read {path}")
        if m.ndim == 3:
            m = m[:, :, 0]
        new_m = remap(m)
        if not cv2.imwrite(str(out_path), new_m):
            raise RuntimeError(f"Cannot write {out_path}")

    print(f"Input : {src}")
    print(f"Output: {dst}")
    print(f"Wrote : {len(paths)} masks")
    print("Mapping: label 0 (bg) -> 255 (ignore); 1..5 -> 0..4")
    print("Training: num_classes=5, CrossEntropyLoss(ignore_index=255)")


if __name__ == "__main__":
    main()
