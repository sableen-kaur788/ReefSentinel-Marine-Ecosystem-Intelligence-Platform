from __future__ import annotations

from typing import Literal

ReefStage = Literal["critical", "stressed", "transitional", "healthy"]


def compute_reef_kpis_benthic(
    benthic_percentages: dict[str, float],
    *,
    water_background_full_frame: float | None = None,
) -> dict:
    """
    KPIs from the five benthic classes only (% of non-water pixels).
    Water is excluded from scoring; optional full-frame water % is returned for context.
    """
    live = benthic_percentages.get("live_coral", 0.0)
    bleached = benthic_percentages.get("bleached_coral", 0.0)
    dead = benthic_percentages.get("dead_coral", 0.0)
    algae = benthic_percentages.get("algae", 0.0)
    substrate = benthic_percentages.get("benthic_substrate", 0.0)

    coral_cover = round(live + bleached + dead, 2)
    stress_index = dead + 0.85 * bleached + 0.25 * max(0.0, algae - 15.0)
    health_index = 55.0 + 1.1 * live - 0.9 * stress_index
    health_index = round(max(0.0, min(100.0, health_index)), 1)

    if health_index >= 72 and live >= 12:
        stage: ReefStage = "healthy"
    elif health_index >= 50:
        stage = "transitional"
    elif health_index >= 30:
        stage = "stressed"
    else:
        stage = "critical"

    out: dict = {
        "health_index": health_index,
        "reef_stage": stage,
        "coral_cover_percent": coral_cover,
        "live_coral_percent": live,
        "stress_signal_percent": round(dead + bleached, 2),
        "algae_percent": algae,
        "benthic_substrate_percent": substrate,
        "kpi_basis": "benthic_only_excludes_water",
    }
    if water_background_full_frame is not None:
        out["water_background_percent_full_frame"] = round(water_background_full_frame, 2)
    return out
