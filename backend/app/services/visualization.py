"""Five-class overlay: colored labels 1–5 only; class 0 keeps original pixels (notebook style)."""

from __future__ import annotations

import base64
import io

import numpy as np
from PIL import Image

# Distinct RGB for classes 1–5 (matches notebook 6-class palette; 0 = not painted).
ID2COLOR_5: dict[int, list[int]] = {
    1: [170, 255, 195],
    2: [255, 220, 100],
    3: [160, 60, 80],
    4: [12, 85, 35],
    5: [180, 140, 100],
}

CLASS_KEY_BY_ID: dict[int, str] = {
    1: "live_coral",
    2: "bleached_coral",
    3: "dead_coral",
    4: "algae",
    5: "benthic_substrate",
}

CLASS_LABEL_BY_KEY: dict[str, str] = {
    "live_coral": "Live Coral",
    "bleached_coral": "Bleached Coral",
    "dead_coral": "Dead Coral",
    "algae": "Algae",
    "benthic_substrate": "Benthic Substrate",
}


def overlay_five_class_png_bytes(image: Image.Image, seg6: np.ndarray, alpha: float = 0.5) -> bytes:
    base = np.array(image.convert("RGB"), dtype=np.float32)
    out = base.copy()
    for cid in range(1, 6):
        m = seg6 == cid
        col = np.array(ID2COLOR_5[cid], dtype=np.float32)
        out[m] = (1 - alpha) * out[m] + alpha * col
    out = np.clip(out, 0, 255).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(out).save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def overlay_five_class_base64(image: Image.Image, seg6: np.ndarray, alpha: float = 0.5) -> str:
    return base64.standard_b64encode(overlay_five_class_png_bytes(image, seg6, alpha)).decode("ascii")


def build_color_legend_with_percentages(benthic_percentages: dict[str, float]) -> list[dict]:
    legend: list[dict] = []
    for cid in range(1, 6):
        key = CLASS_KEY_BY_ID[cid]
        rgb = ID2COLOR_5[cid]
        legend.append(
            {
                "class_key": key,
                "label": CLASS_LABEL_BY_KEY[key],
                "rgb": rgb,
                "hex": "#{:02X}{:02X}{:02X}".format(*rgb),
                "percentage": float(benthic_percentages.get(key, 0.0)),
            }
        )
    return legend
