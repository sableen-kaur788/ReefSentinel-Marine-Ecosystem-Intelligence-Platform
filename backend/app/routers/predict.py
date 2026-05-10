from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from backend.app.services.kpi import compute_reef_kpis_benthic
from backend.app.services.segmentation import (
    detect_media_kind,
    predict_video_bytes,
    run_image_prediction,
)
from backend.app.services.visualization import build_color_legend_with_percentages, overlay_five_class_base64

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("")
async def predict(
    file: UploadFile = File(...),
    include_overlay: bool = Query(True),
) -> dict:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    kind = detect_media_kind(file.filename, file.content_type)
    overlay_b64: str | None = None

    if kind == "video":
        full_pct, benthic, meta, img, seg6 = predict_video_bytes(raw)
        if include_overlay and img is not None and seg6 is not None:
            overlay_b64 = overlay_five_class_base64(img, seg6)
    else:
        try:
            r = run_image_prediction(raw)
        except Exception as e:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Could not read image: {e}") from e
        full_pct = r.percentages_full_frame
        benthic = r.benthic_percentages
        meta = r.meta
        if include_overlay:
            overlay_b64 = overlay_five_class_base64(r.rgb_image, r.seg6)

    water = full_pct.get("water_background")
    kpis = compute_reef_kpis_benthic(benthic, water_background_full_frame=water)
    color_legend = build_color_legend_with_percentages(benthic)

    return {
        "media": kind,
        "percentages": full_pct,
        "percentages_full_frame": full_pct,
        "benthic_percentages": benthic,
        "kpis": kpis,
        "meta": meta,
        "color_legend": color_legend,
        "segmentation_overlay_png_base64": overlay_b64,
        "segmentation_note": (
            "Overlay shows only five classes (live, bleached, dead, algae, benthic substrate); "
            "water/background pixels keep the original photo. KPIs and benthic_percentages exclude water."
        ),
    }
