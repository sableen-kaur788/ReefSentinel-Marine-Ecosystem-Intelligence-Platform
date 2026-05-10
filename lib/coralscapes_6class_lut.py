"""
Numpy-only lookup: Coralscapes fine IDs (0–39) -> 6 merged classes.

Same grouping as remap_masks_to_6_classes.py; use this module from notebooks
without pulling in OpenCV.
"""

from __future__ import annotations

import numpy as np

# 0 Background/Water, 1 Live, 2 Bleached, 3 Dead, 4 Algae, 5 Benthic substrate
LIVE_CORAL_IDS = {22, 34, 31, 25, 28, 21, 27, 6, 17, 36}
BLEACHED_CORAL_IDS = {19, 16, 33, 4}
DEAD_CORAL_IDS = {20, 32, 23, 37, 3, 39}
ALGAE_IDS = {10, 1}
BENTHIC_SUBSTRATE_IDS = {5, 18, 12, 14}


def build_lut(max_class_id: int = 255) -> np.ndarray:
    lut = np.zeros(max_class_id + 1, dtype=np.uint8)
    for cls_id in LIVE_CORAL_IDS:
        if cls_id <= max_class_id:
            lut[cls_id] = 1
    for cls_id in BLEACHED_CORAL_IDS:
        if cls_id <= max_class_id:
            lut[cls_id] = 2
    for cls_id in DEAD_CORAL_IDS:
        if cls_id <= max_class_id:
            lut[cls_id] = 3
    for cls_id in ALGAE_IDS:
        if cls_id <= max_class_id:
            lut[cls_id] = 4
    for cls_id in BENTHIC_SUBSTRATE_IDS:
        if cls_id <= max_class_id:
            lut[cls_id] = 5
    return lut


def remap_mask(mask: np.ndarray, lut: np.ndarray) -> np.ndarray:
    max_id_in_mask = int(mask.max()) if mask.size else 0
    if max_id_in_mask >= lut.shape[0]:
        expanded = np.zeros(max_id_in_mask + 1, dtype=np.uint8)
        expanded[: lut.shape[0]] = lut
        lut = expanded
    return lut[mask]
