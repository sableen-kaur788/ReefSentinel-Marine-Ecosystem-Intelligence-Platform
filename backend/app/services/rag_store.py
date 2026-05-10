from __future__ import annotations

import re
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from backend.app.config import settings

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover
    PdfReader = None


def _chunk_text(text: str, max_chars: int = 900) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= max_chars:
        return [text] if text else []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        if end < len(text):
            cut = text.rfind(". ", start, end)
            if cut > start + 200:
                end = cut + 1
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        start = end
    return chunks


class MarineRAGStore:
    def __init__(self) -> None:
        self._model: SentenceTransformer | None = None
        self._index: faiss.Index | None = None
        self._chunks: list[str] = []

    @property
    def chunk_count(self) -> int:
        return len(self._chunks)

    def _ensure_model(self) -> SentenceTransformer:
        if self._model is None:
            self._model = SentenceTransformer(settings.embed_model)
        return self._model

    def build_from_corpus_dir(self, directory: Path | None = None) -> int:
        directory = directory or settings.rag_corpus_dir
        texts: list[str] = []
        if directory.is_dir():
            for path in sorted(directory.glob("*.txt")):
                texts.extend(_chunk_text(path.read_text(encoding="utf-8")))
            if PdfReader is not None:
                for path in sorted(directory.glob("*.pdf")):
                    texts.extend(self._chunks_from_pdf(path))
        if not texts:
            texts = [
                "Coral reef health is often assessed using live coral cover, structural complexity, "
                "and signs of bleaching or algal overgrowth.",
                "Bleaching occurs when corals expel symbiotic algae under heat stress; recovery depends "
                "on stress duration and species resilience.",
                "High turf algae or macroalgae can indicate reduced herbivory or nutrient runoff, "
                "competing with coral recruits.",
                "Benthic substrate classes include sand, rubble, and hard bottom; these affect "
                "recruitment and monitoring interpretation.",
            ]
        self._chunks = texts
        model = self._ensure_model()
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        embeddings = embeddings.astype(np.float32)
        faiss.normalize_L2(embeddings)
        dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings)
        self._index = index
        return len(texts)

    def _chunks_from_pdf(self, path: Path) -> list[str]:
        if PdfReader is None:
            return []
        try:
            reader = PdfReader(str(path))
        except Exception:
            return []
        chunks: list[str] = []
        for page in reader.pages:
            text = (page.extract_text() or "").strip()
            if not text:
                continue
            chunks.extend(_chunk_text(text))
        return chunks

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        if self._index is None or not self._chunks:
            self.build_from_corpus_dir()
        assert self._index is not None
        model = self._ensure_model()
        q = model.encode([query], convert_to_numpy=True).astype(np.float32)
        faiss.normalize_L2(q)
        scores, indices = self._index.search(q, min(top_k, len(self._chunks)))
        out: list[dict] = []
        for rank, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx < 0:
                continue
            out.append({"rank": rank + 1, "score": float(score), "text": self._chunks[idx]})
        return out


rag_store = MarineRAGStore()
