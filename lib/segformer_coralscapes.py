"""
SegFormer B5 Coralscapes inference (1024×1024 sliding window).

Mirrors notebooks/b5_copy.ipynb: same checkpoint, preprocessor fix, and 6-class LUT.
"""

from __future__ import annotations

import json
import shutil
import tempfile
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from huggingface_hub import hf_hub_download
from PIL import Image
from transformers import SegformerConfig, SegformerForSemanticSegmentation, SegformerImageProcessor

from lib.coralscapes_6class_lut import build_lut, remap_mask
from lib.project_paths import CORALSCAPES

MODEL_ID = "EPFL-ECEO/segformer-b5-finetuned-coralscapes-1024-1024"
MODEL_NUM_LABELS = 40

SIX_CLASS_SNAKE_KEYS = (
    "water_background",
    "live_coral",
    "bleached_coral",
    "dead_coral",
    "algae",
    "benthic_substrate",
)

# Five merged benthic classes only (water / background excluded).
FIVE_CLASS_KEYS = SIX_CLASS_SNAKE_KEYS[1:]


def load_coralscapes_label_maps(coral_dir: Path) -> tuple[dict[int, str], dict[int, list[int]]]:
    id2label: dict[int, str] = {0: "unlabeled"}
    id2color: dict[int, list[int]] = {0: [255, 255, 255]}

    classes_path = coral_dir / "classes.json"
    colors_path = coral_dir / "colors.json"
    if classes_path.is_file():
        name_to_id: dict[str, int] = json.loads(classes_path.read_text(encoding="utf-8"))
        for name, cid in name_to_id.items():
            id2label[int(cid)] = name
    if colors_path.is_file():
        name_to_color: dict[str, list[int]] = json.loads(colors_path.read_text(encoding="utf-8"))
        for cid, name in list(id2label.items()):
            if cid == 0:
                continue
            if name in name_to_color:
                id2color[cid] = name_to_color[name]
    for cid in range(MODEL_NUM_LABELS):
        if cid not in id2color:
            rng = np.random.default_rng(cid + 42)
            id2color[cid] = [int(x) for x in rng.integers(30, 255, size=3)]
    return id2label, id2color


def _download_processor_and_config(
    model_id: str,
) -> tuple[SegformerImageProcessor, SegformerConfig, dict[int, str]]:
    id2label, _ = load_coralscapes_label_maps(CORALSCAPES)

    pp_path = hf_hub_download(repo_id=model_id, filename="preprocessor_config.json")
    tmp_pp = Path(tempfile.mkdtemp())
    shutil.copy(pp_path, tmp_pp / "preprocessor_config.json")
    processor = SegformerImageProcessor.from_pretrained(tmp_pp.as_posix())

    cfg_path = hf_hub_download(repo_id=model_id, filename="config.json")
    with open(cfg_path, encoding="utf-8") as f:
        raw = json.load(f)
    raw.pop("id2label", None)
    raw.pop("label2id", None)
    # Keep the decode head aligned with checkpoint weights (40 classes).
    # classes.json may be absent on some deployments, which would otherwise
    # leave only id 0 in id2label and incorrectly create a 1-class head.
    n = MODEL_NUM_LABELS
    raw["num_labels"] = n
    config = SegformerConfig.from_dict(raw)
    config.id2label = {i: id2label.get(i, f"class_{i}") for i in range(n)}
    config.label2id = {name: i for i, name in config.id2label.items()}
    return processor, config, id2label


class SegformerCoralscapesService:
    """Lazy-loadable SegFormer + sliding-window segmentation."""

    def __init__(self) -> None:
        self._model: SegformerForSemanticSegmentation | None = None
        self._processor: SegformerImageProcessor | None = None
        self._device: torch.device | None = None

    def load(self) -> None:
        if self._model is not None:
            return
        self._device = torch.device("cpu")
        processor, config, _ = _download_processor_and_config(MODEL_ID)
        self._processor = processor
        self._model = SegformerForSemanticSegmentation.from_pretrained(
            MODEL_ID, 
            config=config,
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True
        ).to(self._device)
        self._model.eval()

    @property
    def device(self) -> torch.device:
        if self._device is None:
            self.load()
        assert self._device is not None
        return self._device

    @property
    def model(self) -> SegformerForSemanticSegmentation:
        if self._model is None:
            self.load()
        assert self._model is not None
        return self._model

    @property
    def processor(self) -> SegformerImageProcessor:
        if self._processor is None:
            self.load()
        assert self._processor is not None
        return self._processor

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def resize_image_keep_aspect(self, image: Image.Image, target_small_side: int = 1024) -> Image.Image:
        w, h = image.size
        if min(w, h) == target_small_side:
            return image
        if w < h:
            new_w, new_h = target_small_side, int(round(h * target_small_side / w))
        else:
            new_w, new_h = int(round(w * target_small_side / h)), target_small_side
        return image.resize((new_w, new_h), Image.BILINEAR)

    def segment_image_sliding_window(
        self,
        image: Image.Image,
        crop_size: tuple[int, int] = (1024, 1024),
        num_classes: int | None = None,
    ) -> np.ndarray:
        model = self.model
        preprocessor = self.processor
        device = self.device
        if num_classes is None:
            num_classes = model.config.num_labels

        resized = self.resize_image_keep_aspect(image, 1024)
        w_res, h_res = resized.size
        img = torch.from_numpy(np.array(resized).transpose(2, 0, 1)).float().unsqueeze(0)
        _, _, h_img, w_img = img.shape
        h_crop, w_crop = crop_size

        h_grids = max(1, int(np.round(1.5 * h_img / h_crop)))
        w_grids = max(1, int(np.round(1.5 * w_img / w_crop)))
        h_stride = max(1, (h_img - h_crop + h_grids - 1) // (h_grids - 1)) if h_grids > 1 else h_crop
        w_stride = max(1, (w_img - w_crop + w_grids - 1) // (w_grids - 1)) if w_grids > 1 else w_crop

        preds = img.new_zeros((1, num_classes, h_img, w_img))
        count_mat = img.new_zeros((1, 1, h_img, w_img))

        for hi in range(h_grids):
            for wi in range(w_grids):
                y1 = hi * h_stride
                x1 = wi * w_stride
                y2 = min(y1 + h_crop, h_img)
                x2 = min(x1 + w_crop, w_img)
                y1 = max(y2 - h_crop, 0)
                x1 = max(x2 - w_crop, 0)
                crop = img[:, :, y1:y2, x1:x2]
                crop_pil = Image.fromarray(
                    crop.squeeze(0).permute(1, 2, 0).byte().cpu().numpy(), mode="RGB"
                )
                with torch.no_grad():
                    inputs = preprocessor(crop_pil, return_tensors="pt")
                    inputs = {k: v.to(device) for k, v in inputs.items()}
                    outputs = model(**inputs)
                logits = F.interpolate(
                    outputs.logits,
                    size=crop.shape[-2:],
                    mode="bilinear",
                    align_corners=False,
                )
                pad = (
                    int(x1),
                    int(preds.shape[3] - x2),
                    int(y1),
                    int(preds.shape[2] - y2),
                )
                preds += F.pad(logits.cpu(), pad)
                count_mat[:, :, y1:y2, x1:x2] += 1

        assert (count_mat == 0).sum() == 0
        preds = preds / count_mat
        pred_cls = preds.argmax(dim=1).to(torch.uint8)
        pred_up = F.interpolate(
            pred_cls.unsqueeze(0).float(),
            size=(h_res, w_res),
            mode="nearest",
        ).squeeze(0)
        mask = pred_up.squeeze(0).cpu().numpy().astype(np.int32)
        orig_w, orig_h = image.size
        if mask.shape != (orig_h, orig_w):
            mask_img = Image.fromarray(mask.astype(np.uint8), mode="L")
            mask_img = mask_img.resize((orig_w, orig_h), Image.NEAREST)
            mask = np.array(mask_img, dtype=np.int32)
        return mask


def six_class_mask_from_raw(seg40: np.ndarray) -> np.ndarray:
    """40-way logits argmax mask → 6-class merged mask (values 0–5)."""
    lut = build_lut(255)
    return remap_mask(seg40.astype(np.uint8), lut).astype(np.int32)


def six_class_percentages_from_mask(seg40: np.ndarray) -> dict[str, float]:
    """Pixel fractions × 100 for the merged 6 classes (same LUT as the notebook)."""
    seg6 = six_class_mask_from_raw(seg40)
    unique, counts = np.unique(seg6, return_counts=True)
    total = float(seg6.size)
    out = {k: 0.0 for k in SIX_CLASS_SNAKE_KEYS}
    for u, c in zip(unique, counts):
        idx = int(u)
        if 0 <= idx < len(SIX_CLASS_SNAKE_KEYS):
            out[SIX_CLASS_SNAKE_KEYS[idx]] = round(100.0 * float(c) / total, 2)
    return out


def benthic_percentages_from_seg6(seg6: np.ndarray) -> dict[str, float]:
    """Percent of non-water pixels only (5 classes; ~100% sum). Water is ignored."""
    fg = seg6 != 0
    n_fg = int(fg.sum())
    if n_fg == 0:
        return {k: 0.0 for k in FIVE_CLASS_KEYS}
    out: dict[str, float] = {}
    for cid in range(1, 6):
        key = SIX_CLASS_SNAKE_KEYS[cid]
        cnt = int((seg6 == cid).sum())
        out[key] = round(100.0 * cnt / n_fg, 2)
    return out


def benthic_percentages_from_full_frame(full_pct: dict[str, float]) -> dict[str, float]:
    """Approximate benthic-only % from full-frame 6-way percentages (e.g. averaged video)."""
    water = float(full_pct.get("water_background", 0.0))
    denom = 100.0 - water
    if denom < 1e-3:
        return {k: 0.0 for k in FIVE_CLASS_KEYS}
    return {k: round(float(full_pct.get(k, 0.0)) * 100.0 / denom, 2) for k in FIVE_CLASS_KEYS}


# Singleton used by the API
segformer_service = SegformerCoralscapesService()
