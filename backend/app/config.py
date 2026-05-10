from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"
    hf_token: str | None = None
    rag_corpus_dir: Path = REPO_ROOT / "data" / "rag_docs"
    embed_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    video_max_frames: int = 24
    preload_segformer: bool = False


settings = Settings()
