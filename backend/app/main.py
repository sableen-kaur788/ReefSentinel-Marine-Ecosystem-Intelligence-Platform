from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.routers import analyze, predict, rag
from backend.app.services.rag_store import rag_store
from lib.segformer_coralscapes import segformer_service


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    rag_store.build_from_corpus_dir()
    if settings.preload_segformer:
        segformer_service.load()
    yield


app = FastAPI(
    title="Coral Reef Intelligence API",
    description="SegFormer Coralscapes inference, KPIs, FAISS RAG, Groq reports",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(rag.router)
app.include_router(analyze.router)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "segformer_loaded": segformer_service.is_loaded,
        "groq_configured": bool(settings.groq_api_key),
        "rag_chunks": rag_store.chunk_count,
    }
