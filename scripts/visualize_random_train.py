#!/usr/bin/env python3
"""
Pick one random train image from coralscapes and visualize:
- original RGB image
- color mask using colors.json
- blended overlay
- label legend (classes present in this mask)

Default behavior saves output to disk.
Use --show to open an OpenCV window.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

import cv2

_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_ROOT / "lib"))
from project_paths import CORALSCAPES, OUTPUTS
import numpy as np


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_id_maps(classes_map: dict, colors_map: dict) -> tuple[dict[int, str], dict[int, list[int]]]:
    id_to_label = {}
    id_to_color = {}
    for label, class_id in classes_map.items():
        id_to_label[int(class_id)] = label
        id_to_color[int(class_id)] = colors_map.get(label, [255, 255, 255])
    return id_to_label, id_to_color


def colorize_mask(mask: np.ndarray, id_to_color: dict[int, list[int]]) -> np.ndarray:
    color_mask = np.zeros((mask.shape[0], mask.shape[1], 3), dtype=np.uint8)
    for class_id, color in id_to_color.items():
        color_mask[mask == class_id] = color
    return color_mask


def draw_legend(
    base_img: np.ndarray,
    present_ids: list[int],
    id_to_label: dict[int, str],
    id_to_color: dict[int, list[int]],
) -> np.ndarray:
    line_h = 26
    pad = 10
    box_w = 420
    box_h = max(80, pad * 2 + len(present_ids) * line_h)

    legend = np.full((box_h, box_w, 3), 30, dtype=np.uint8)
    cv2.putText(legend, "Labels in this mask", (10, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (240, 240, 240), 1)

    y = 42
    for cid in present_ids:
        color = tuple(int(c) for c in id_to_color.get(cid, [255, 255, 255]))
        label = id_to_label.get(cid, f"unknown_{cid}")
        cv2.rectangle(legend, (12, y - 12), (32, y + 8), color, -1)
        cv2.putText(
            legend,
            f"{cid:>2} - {label}",
            (42, y + 4),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (240, 240, 240),
            1,
            cv2.LINE_AA,
        )
        y += line_h

    # Fit legend to image height if needed
    h, w = base_img.shape[:2]
    if legend.shape[0] > h:
        scale = h / legend.shape[0]
        legend = cv2.resize(legend, (int(legend.shape[1] * scale), h), interpolation=cv2.INTER_AREA)
    return legend


def main() -> None:
    parser = argparse.ArgumentParser(description="Visualize random train image with mask overlay.")
    parser.add_argument("--dataset", default=str(CORALSCAPES), help="Path to dataset root")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    parser.add_argument(
        "--output",
        default=str(OUTPUTS / "random_train_overlay.png"),
        help="Output image path for saved visualization",
    )
    parser.add_argument("--alpha", type=float, default=0.45, help="Overlay alpha (0-1)")
    parser.add_argument("--show", action="store_true", help="Open visualization in OpenCV window")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    root = Path(args.dataset).resolve()
    train_img_root = root / "leftImg8bit" / "train"
    train_mask_root = root / "gtFine" / "train"

    classes_map = load_json(root / "classes.json")
    colors_map = load_json(root / "colors.json")
    id_to_label, id_to_color = build_id_maps(classes_map, colors_map)

    image_paths = sorted(train_img_root.rglob("*_leftImg8bit.png"))
    if not image_paths:
        raise FileNotFoundError(f"No train images found in: {train_img_root}")

    image_path = random.choice(image_paths)
    rel = image_path.relative_to(train_img_root)
    mask_name = rel.name.replace("_leftImg8bit.png", "_gtFine.png")
    mask_path = train_mask_root / rel.parent / mask_name
    if not mask_path.exists():
        raise FileNotFoundError(f"Matching mask not found: {mask_path}")

    bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    mask = cv2.imread(str(mask_path), cv2.IMREAD_UNCHANGED)
    if bgr is None or mask is None:
        raise RuntimeError("Failed to read image/mask with OpenCV.")

    if mask.ndim == 3:
        # If mask is accidentally RGB, take first channel
        mask = mask[:, :, 0]

    color_mask = colorize_mask(mask, id_to_color)
    overlay = cv2.addWeighted(bgr, 1.0 - args.alpha, color_mask, args.alpha, 0)

    present_ids = sorted(int(x) for x in np.unique(mask).tolist())
    legend = draw_legend(overlay, present_ids, id_to_label, id_to_color)

    # Combine overlay + legend side by side
    if legend.shape[0] != overlay.shape[0]:
        legend = cv2.resize(legend, (legend.shape[1], overlay.shape[0]), interpolation=cv2.INTER_AREA)
    combined = np.hstack([overlay, legend])

    out_path = Path(args.output).resolve()
    cv2.imwrite(str(out_path), combined)

    print(f"Random image: {image_path}")
    print(f"Matching mask: {mask_path}")
    print(f"Saved visualization: {out_path}")
    print(f"Unique class IDs in mask: {present_ids}")

    if args.show:
        cv2.imshow("Coralscapes random train overlay", combined)
        print("Press any key in the image window to close.")
        cv2.waitKey(0)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
