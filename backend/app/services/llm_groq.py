from __future__ import annotations

from groq import Groq

from backend.app.config import settings


def groq_client() -> Groq | None:
    if not settings.groq_api_key:
        return None
    return Groq(api_key=settings.groq_api_key)


def generate_reef_report(
    percentages: dict[str, float],
    kpis: dict,
    rag_context: list[str],
    scientific_questions: list[str] | None = None,
    *,
    water_full_frame_percent: float | None = None,
) -> str:
    client = groq_client()
    context_block = "\n\n".join(f"- {c}" for c in rag_context[:8])
    qs = scientific_questions or []
    qs_block = "\n".join(f"- {q}" for q in qs) if qs else "(none)"

    water_line = ""
    if water_full_frame_percent is not None:
        water_line = (
            f"\nWater / open background (full frame, not in list above): {water_full_frame_percent:.2f}% of image.\n"
        )

    user_prompt = f"""Analyze this reef segmentation summary (model-derived).

Percentages (five benthic classes — each is % of non-water pixels only; water excluded from denominator):
{percentages}{water_line}
Derived KPIs:
{kpis}

Retrieved marine-science context (RAG):
{context_block}

Suggested scientific questions to explore:
{qs_block}

Write a concise reef health brief (Markdown): executive summary, interpretation of class balance,
stress signals, one monitoring recommendation, and caveats about automated segmentation."""

    if client is None:
        return (
            "## Report unavailable\n\nSet `GROQ_API_KEY` in the project `.env` to enable LLM reports.\n\n"
            f"**KPI snapshot:** health_index={kpis.get('health_index')}, stage={kpis.get('reef_stage')}\n"
        )

    completion = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are ReefSense Pro, a senior marine ecologist and reef analytics advisor. "
                    "Write in a professional scientific tone with clear section headers. "
                    "Ground claims in the provided percentages and retrieved context only. "
                    "Flag uncertainty, avoid overclaiming causality, and include practical field-monitoring actions."
                ),
            },
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.35,
        max_tokens=1200,
    )
    return completion.choices[0].message.content or ""


def suggest_scientific_queries(percentages: dict[str, float], kpis: dict) -> list[str]:
    client = groq_client()
    prompt = f"""Given reef class percentages {percentages} and KPIs {kpis}, output exactly 4 short
research questions (one line each) a scientist might ask next. Number them 1-4. No extra text."""

    if client is None:
        return [
            "How does live coral cover here compare to regional baselines?",
            "What field validation protocol would reduce segmentation uncertainty?",
            "Are bleaching signals seasonal or event-driven at this site?",
            "How does algal cover relate to local nutrient sources?",
        ]

    completion = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": "Output only numbered questions, no preamble."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
        max_tokens=400,
    )
    text = completion.choices[0].message.content or ""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    return lines[:6]
