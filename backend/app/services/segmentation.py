from __future__ import annotations

import io
import os
import tempfile
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Literal

import cv2
import numpy as np
from PIL import Image

from backend.app.config import settings
from lib.segformer_coralscapes import (
    SIX_CLASS_SNAKE_KEYS,
    benthic_percentages_from_full_frame,
    benthic_percentages_from_seg6,
    segformer_service,
    six_class_mask_from_raw,
    six_class_percentages_from_mask,
)

MediaKind = Literal["image", "video"]


@dataclass
class ImagePredictionResult:
    percentages_full_frame: dict[str, float]
    benthic_percentages: dict[str, float]
    seg6: np.ndarray
    rgb_image: Image.Image
    meta: dict


@contextmanager
def _model_ready() -> Iterator[None]:
    segformer_service.load()
    yield


def _load_image_pil(data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(data)).convert("RGB")


def run_image_prediction(data: bytes) -> ImagePredictionResult:
    image = _load_image_pil(data)
    with _model_ready():
        mask = segformer_service.segment_image_sliding_window(image)
    percentages_full_frame = six_class_percentages_from_mask(mask)
    seg6 = six_class_mask_from_raw(mask)
    benthic_percentages = benthic_percentages_from_seg6(seg6)
    meta = {"width": image.size[0], "height": image.size[1], "frames_averaged": 1}
    return ImagePredictionResult(
        percentages_full_frame=percentages_full_frame,
        benthic_percentages=benthic_percentages,
        seg6=seg6,
        rgb_image=image,
        meta=meta,
    )


def predict_video_bytes(
    data: bytes, max_frames: int | None = None
) -> tuple[dict[str, float], dict[str, float], dict, Image.Image | None, np.ndarray | None]:
    """
    Returns averaged full-frame percentages, benthic % (from averaged full-frame),
    meta, and last sampled frame + seg6 for overlay (if any frame processed).
    """
    max_f = max_frames if max_frames is not None else settings.video_max_frames
    accum = {k: 0.0 for k in SIX_CLASS_SNAKE_KEYS}
    width = height = n_frames = 0
    fps = 0.0
    count = 0
    last_image: Image.Image | None = None
    last_seg6: np.ndarray | None = None

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(data)
        path = tmp.name

    try:
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            cap.release()
            r = run_image_prediction(data)
            return (
                r.percentages_full_frame,
                r.benthic_percentages,
                r.meta,
                r.rgb_image,
                r.seg6,
            )

        n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)

        step = max(1, n_frames // max_f) if n_frames > 0 else 1

        with _model_ready():
            frame_i = 0
            while True:
                ok, bgr = cap.read()
                if not ok:
                    break
                if n_frames > 0 and frame_i % step != 0:
                    frame_i += 1
                    continue
                rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                image = Image.fromarray(rgb)
                mask = segformer_service.segment_image_sliding_window(image)
                pct = six_class_percentages_from_mask(mask)
                for k in accum:
                    accum[k] += pct[k]
                last_image = image
                last_seg6 = six_class_mask_from_raw(mask)
                count += 1
                frame_i += 1
                if count >= max_f:
                    break

        cap.release()
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass

    if count == 0:
        r = run_image_prediction(data)
        return (
            r.percentages_full_frame,
            r.benthic_percentages,
            r.meta,
            r.rgb_image,
            r.seg6,
        )

    averaged = {k: round(accum[k] / count, 2) for k in accum}
    benthic = benthic_percentages_from_full_frame(averaged)
    meta = {
        "width": width,
        "height": height,
        "frames_averaged": count,
        "video_frame_count_estimate": n_frames,
        "video_fps_estimate": round(fps, 3) if fps else None,
    }
    return averaged, benthic, meta, last_image, last_seg6


def detect_media_kind(filename: str | None, content_type: str | None) -> MediaKind:
    name = (filename or "").lower()
    ct = (content_type or "").lower()
    video_ext = (".mp4", ".mov", ".avi", ".mkv", ".webm")
    if any(name.endswith(ext) for ext in video_ext):
        return "video"
    if "video" in ct:
        return "video"
    return "image"
