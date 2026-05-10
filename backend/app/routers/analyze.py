from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field

from backend.app.services.kpi import compute_reef_kpis_benthic
from backend.app.services.llm_groq import generate_reef_report
from backend.app.services.rag_store import rag_store
from backend.app.services.segmentation import (
    detect_media_kind,
    predict_video_bytes,
    run_image_prediction,
)
from backend.app.services.visualization import build_color_legend_with_percentages, overlay_five_class_base64
from lib.segformer_coralscapes import benthic_percentages_from_full_frame

router = APIRouter(tags=["analyze"])


class AnalyzeFromPercentagesBody(BaseModel):
    """Pass either full-frame 6-class dict (with water_background) or benthic-only 5-class dict."""

    percentages: dict[str, float]
    include_llm: bool = True
    water_background_full_frame: float | None = Field(
        None,
        description="If percentages are benthic-only, set this for KPI context / LLM.",
    )


@router.post("/analyze")
async def analyze_full(
    file: UploadFile = File(...),
    include_llm: bool = Query(True),
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

    out = _assemble_analysis(
        full_pct,
        benthic,
        meta,
        kind,
        include_llm,
        kpis_precalc=kpis,
    )
    out["percentages"] = full_pct
    out["percentages_full_frame"] = full_pct
    out["benthic_percentages"] = benthic
    out["color_legend"] = build_color_legend_with_percentages(benthic)
    out["segmentation_overlay_png_base64"] = overlay_b64 if include_overlay else None
    out["segmentation_note"] = (
        "Overlay: five classes colored; water keeps original pixels. "
        "benthic_percentages and KPIs exclude water from the denominator."
    )
    return out


@router.post("/analyze/from_percentages")
async def analyze_from_percentages(body: AnalyzeFromPercentagesBody) -> dict:
    p = body.percentages
    if "water_background" in p:
        full_pct = p
        benthic = benthic_percentages_from_full_frame(full_pct)
        water = full_pct.get("water_background")
    else:
        benthic = p
        water = body.water_background_full_frame
        full_pct = {**benthic, "water_background": water if water is not None else 0.0}

    kpis = compute_reef_kpis_benthic(benthic, water_background_full_frame=water)
    meta = {"width": None, "height": None, "frames_averaged": 0}
    out = _assemble_analysis(full_pct, benthic, meta, "json", body.include_llm, kpis_precalc=kpis)
    out["percentages"] = full_pct
    out["percentages_full_frame"] = full_pct
    out["benthic_percentages"] = benthic
    out["color_legend"] = build_color_legend_with_percentages(benthic)
    out["segmentation_overlay_png_base64"] = None
    return out


def _assemble_analysis(
    percentages_full_frame: dict[str, float],
    benthic_percentages: dict[str, float],
    meta: dict,
    media: str,
    include_llm: bool,
    kpis_precalc: dict | None = None,
) -> dict:
    kpis = kpis_precalc or compute_reef_kpis_benthic(
        benthic_percentages,
        water_background_full_frame=percentages_full_frame.get("water_background"),
    )

    rag_q = (
        f"Reef monitoring: benthic-only % (excl. water) — live {benthic_percentages.get('live_coral', 0)}%, "
        f"bleached {benthic_percentages.get('bleached_coral', 0)}%, dead {benthic_percentages.get('dead_coral', 0)}%, "
        f"algae {benthic_percentages.get('algae', 0)}%, substrate {benthic_percentages.get('benthic_substrate', 0)}%. "
        f"Water ~{percentages_full_frame.get('water_background', 0):.1f}% of full frame."
    )
    rag_hits = rag_store.search(rag_q, top_k=5)
    rag_texts = [h["text"] for h in rag_hits]

    water_ff = percentages_full_frame.get("water_background")
    report = ""
    if include_llm:
        report = generate_reef_report(
            benthic_percentages,
            kpis,
            rag_texts,
            None,
            water_full_frame_percent=float(water_ff) if water_ff is not None else None,
        )

    return {
        "media": media,
        "kpis": kpis,
        "meta": meta,
        "rag_hits": rag_hits,
        "scientific_questions": [],
        "report_markdown": report,
    }
