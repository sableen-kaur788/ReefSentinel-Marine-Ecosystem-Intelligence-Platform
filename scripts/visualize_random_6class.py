#!/usr/bin/env python3
"""
Pick a random RGB image and its 6-class remapped mask; save a composite figure:

  Original RGB | Segmentation | Overlay | Legend

  By default, class 0 (water/background) is not painted with the background color
  (which is easy to misread). Segmentation shows a dimmed photo under class 0;
  overlay leaves class 0 pixels as the original image. Use --keep-background
  to color class 0 like before.

Default dataset root (CoralScapes layout):
  <dataset>/leftImg8bit/<split>/...
  <dataset>/gtFine/<split>/...

  Default: data/coralscapes_6class_dataset (repo layout).
"""

from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

import cv2
import numpy as np

_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT / "lib"))
from project_paths import CORALSCAPES_6CLASS, OUTPUTS

# CoralScapes-style 6-class bundle: leftImg8bit + gtFine under one root.
_DEFAULT_DATASET = CORALSCAPES_6CLASS

NUM_CLASSES = 6

CLASS_NAMES = (
    "Water / Background",
    "Live Coral",
    "Bleached Coral",
    "Dead Coral",
    "Algae",
    "Benthic Substrate",
)

# Distinct BGR colors for overlay (OpenCV order).
CAPTION_BAR_H = 40

COLORS_BGR = np.array(
    [
        [180, 100, 40],  # 0 water — deep blue
        [200, 80, 255],  # 1 live — magenta/pink
        [220, 255, 255],  # 2 bleached — light cream
        [50, 50, 140],  # 3 dead — dark red-blue
        [80, 200, 60],  # 4 algae — green
        [160, 180, 200],  # 5 benthic — gray-tan
    ],
    dtype=np.uint8,
)


def load_mask_2d(path: Path) -> np.ndarray:
    mask = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if mask is None:
        raise RuntimeError(f"Failed to read mask: {path}")
    if mask.ndim == 3:
        mask = mask[:, :, 0]
    if mask.ndim != 2:
        raise ValueError(f"Expected 2D mask, got {mask.shape}")
    return mask


def colorize_6class(mask: np.ndarray) -> np.ndarray:
    m = np.clip(mask.astype(np.int64, copy=False), 0, NUM_CLASSES - 1)
    return COLORS_BGR[m]


def segmentation_view(
    bgr: np.ndarray,
    mask: np.ndarray,
    color_mask: np.ndarray,
    *,
    hide_background: bool,
    background_dim: float,
) -> np.ndarray:
    """
    Pure class colors on foreground; background either colored (class 0) or
    dimmed RGB so non-background classes are easier to see.
    """
    if not hide_background:
        return color_mask.copy()
    dim = float(np.clip(background_dim, 0.05, 1.0))
    base = (bgr.astype(np.float32) * dim).clip(0, 255).astype(np.uint8)
    out = base.copy()
    fg = mask > 0
    out[fg] = color_mask[fg]
    return out


def overlay_view(
    bgr: np.ndarray,
    mask: np.ndarray,
    color_mask: np.ndarray,
    alpha: float,
    *,
    hide_background: bool,
) -> np.ndarray:
    blended = cv2.addWeighted(bgr, 1.0 - alpha, color_mask, alpha, 0)
    if not hide_background:
        return blended
    out = bgr.copy()
    fg = mask > 0
    out[fg] = blended[fg]
    return out


def caption_bar(width: int, title: str) -> np.ndarray:
    bar = np.full((CAPTION_BAR_H, width, 3), 24, dtype=np.uint8)
    cv2.putText(
        bar,
        title,
        (10, 27),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.62,
        (245, 245, 245),
        1,
        cv2.LINE_AA,
    )
    return bar


def panel_with_caption(img: np.ndarray, title: str) -> np.ndarray:
    w = img.shape[1]
    return np.vstack([caption_bar(w, title), img])


def draw_legend_all_classes(height: int) -> np.ndarray:
    line_h = 28
    pad = 12
    box_w = 460
    box_h = pad * 2 + 36 + NUM_CLASSES * line_h
    legend = np.full((box_h, box_w, 3), 28, dtype=np.uint8)
    cv2.putText(
        legend,
        "6-class labels",
        (12, 28),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (240, 240, 240),
        1,
        cv2.LINE_AA,
    )
    y = 52
    for cid in range(NUM_CLASSES):
        color = tuple(int(c) for c in COLORS_BGR[cid])
        cv2.rectangle(legend, (12, y - 14), (36, y + 10), color, -1)
        cv2.putText(
            legend,
            f"{cid} — {CLASS_NAMES[cid]}",
            (46, y + 6),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.48,
            (235, 235, 235),
            1,
            cv2.LINE_AA,
        )
        y += line_h
    if legend.shape[0] != height:
        legend = cv2.resize(legend, (legend.shape[1], height), interpolation=cv2.INTER_AREA)
    return legend


def legend_panel(image_height: int, legend_width: int = 460) -> np.ndarray:
    """Legend image region matching RGB height (caption added separately)."""
    legend = draw_legend_all_classes(image_height)
    if legend.shape[1] != legend_width:
        legend = cv2.resize(legend, (legend_width, image_height), interpolation=cv2.INTER_AREA)
    return legend


def main() -> None:
    p = argparse.ArgumentParser(description="Visualize random image with 6-class mask overlay.")
    p.add_argument(
        "--dataset",
        type=Path,
        default=_DEFAULT_DATASET,
        help="Root folder with leftImg8bit/ and gtFine/ (default: coralscapes_6class_dataset)",
    )
    p.add_argument("--split", choices=("train", "val", "test"), default="train")
    p.add_argument("--seed", type=int, default=None)
    p.add_argument("--output", type=Path, default=OUTPUTS / "random_6class_overlay.png")
    p.add_argument("--alpha", type=float, default=0.5)
    p.add_argument(
        "--keep-background",
        action="store_true",
        help="Paint class 0 with the background color in seg/overlay (default: hide class 0 coloring).",
    )
    p.add_argument(
        "--background-dim",
        type=float,
        default=0.28,
        help="When hiding background, scale RGB under class 0 in segmentation panel (0–1).",
    )
    p.add_argument("--show", action="store_true")
    args = p.parse_args()
    hide_background = not args.keep_background

    if args.seed is not None:
        random.seed(args.seed)

    dataset_root = args.dataset.resolve()
    if not dataset_root.is_dir():
        raise FileNotFoundError(f"Dataset root not found: {dataset_root}")
    img_dir = dataset_root / "leftImg8bit" / args.split
    mask_dir = dataset_root / "gtFine" / args.split
    if not img_dir.is_dir():
        raise FileNotFoundError(f"Image split folder not found: {img_dir}")
    if not mask_dir.is_dir():
        raise FileNotFoundError(f"Mask split folder not found: {mask_dir}")

    image_paths = sorted(img_dir.rglob("*_leftImg8bit.png"))
    if not image_paths:
        raise FileNotFoundError(f"No *_leftImg8bit.png under {img_dir}")

    image_path = random.choice(image_paths)
    rel = image_path.relative_to(img_dir)
    mask_path = mask_dir / rel.parent / rel.name.replace("_leftImg8bit.png", "_gtFine.png")
    if not mask_path.exists():
        raise FileNotFoundError(f"6-class mask not found: {mask_path}")

    bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if bgr is None:
        raise RuntimeError(f"Failed to read image: {image_path}")

    mask = load_mask_2d(mask_path)
    bad = int(np.sum((mask < 0) | (mask >= NUM_CLASSES)))
    if bad:
        print(f"Warning: {bad} pixels outside [0, {NUM_CLASSES - 1}] (clipped for visualization).")

    color_mask = colorize_6class(mask)
    seg_img = segmentation_view(
        bgr,
        mask,
        color_mask,
        hide_background=hide_background,
        background_dim=args.background_dim,
    )
    overlay = overlay_view(
        bgr,
        mask,
        color_mask,
        args.alpha,
        hide_background=hide_background,
    )

    h, w = bgr.shape[:2]
    leg_w = 460
    legend_img = legend_panel(h, leg_w)
    legend_col = panel_with_caption(legend_img, "Legend (6 classes)")

    orig_col = panel_with_caption(bgr, "Original")
    seg_title = (
        "Segmentation (classes 1–5; class 0 = dimmed photo)"
        if hide_background
        else "Segmentation (6 classes)"
    )
    ovl_title = (
        "Overlay (blend only on classes 1–5)"
        if hide_background
        else "Overlay"
    )
    seg_col = panel_with_caption(seg_img, seg_title)
    ovl_col = panel_with_caption(overlay, ovl_title)

    combined = np.hstack([orig_col, seg_col, ovl_col, legend_col])

    out = args.output.resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out), combined)

    present = sorted(int(x) for x in np.unique(mask).tolist())
    print(f"Dataset: {dataset_root}")
    print(f"Split: {args.split}")
    print(f"Image: {image_path}")
    print(f"Mask:  {mask_path}")
    print(f"Saved: {out}")
    print(f"Class IDs present in this mask: {present}")

    if args.show:
        cv2.imshow("6-class: original | segmentation | overlay", combined)
        print("Press any key in the window to close.")
        cv2.waitKey(0)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
