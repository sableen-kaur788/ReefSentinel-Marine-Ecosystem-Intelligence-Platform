# Coral Reef Intelligence API

Run from the **repository root** (`coral/`) so `lib` and `data/coralscapes` resolve.

## Setup

```powershell
cd C:\path\to\coral
python -m venv .venv
.\.venv\Scripts\activate
pip install -r backend/requirements.txt
```

Optional `.env` at the repo root:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
HF_TOKEN=
PRELOAD_SEGFORMER=true
VIDEO_MAX_FRAMES=24
```

## Start server

```powershell
cd C:\path\to\coral
.\.venv\Scripts\activate
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

- `POST /predict` — multipart `file`; query `include_overlay` (default true). Returns **`percentages`** / **`percentages_full_frame`** (6-class, full image), **`benthic_percentages`** (5-class, % of non-water pixels only), **`segmentation_overlay_png_base64`** (five classes tinted; water keeps original pixels), **KPIs** (computed on benthic-only). Use `include_overlay=false` to skip the PNG.
- `POST /analyze` — same + `include_llm` and `include_overlay`; adds RAG + Groq **report_markdown** when LLM enabled.
- `POST /analyze/from_percentages` — JSON body with existing percentages (skip SegFormer).
- `POST /rag/query` — RAG only.
- `GET /health` — readiness.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8000`.
