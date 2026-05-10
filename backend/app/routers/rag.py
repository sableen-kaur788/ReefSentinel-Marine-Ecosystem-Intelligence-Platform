from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.app.config import settings
from backend.app.services.llm_groq import groq_client
from backend.app.services.rag_store import rag_store

router = APIRouter(prefix="/rag", tags=["rag"])


class RAGQuery(BaseModel):
    query: str = Field(..., min_length=2, max_length=2000)
    top_k: int = Field(5, ge=1, le=20)


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=5000)


class RAGChatRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)
    top_k: int = Field(5, ge=1, le=20)


@router.post("/query")
async def rag_query(body: RAGQuery) -> dict:
    hits = rag_store.search(body.query, top_k=body.top_k)
    return {"query": body.query, "hits": hits}


@router.post("/rebuild")
async def rag_rebuild() -> dict:
    n = rag_store.build_from_corpus_dir()
    return {"chunks_indexed": n}


@router.post("/chat")
async def rag_chat(body: RAGChatRequest) -> dict:
    hits = rag_store.search(body.message, top_k=body.top_k)
    context_block = "\n\n".join(f"[{i+1}] {h['text']}" for i, h in enumerate(hits))

    fallback_answer = (
        "I could not reach the Groq model right now. "
        "Based on retrieved reef docs, please review the cited context cards."
    )

    client = groq_client()
    if client is None:
        return {
            "answer": fallback_answer,
            "citations": hits,
            "model": "fallback",
        }

    history = [
        {"role": m.role, "content": m.content}
        for m in body.history[-8:]
    ]
    prompt = (
        "Use the retrieved context below to answer the user's reef question clearly and naturally. "
        "If context is insufficient, say so briefly.\n\n"
        f"Retrieved context:\n{context_block}\n\n"
        f"User question: {body.message}"
    )

    completion = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are ReefSentinel Assistant, an expert marine ecology chatbot. "
                    "Answer conversationally, concise but useful, and rely on provided context."
                ),
            },
            *history,
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=900,
    )
    answer = completion.choices[0].message.content or fallback_answer
    return {
        "answer": answer,
        "citations": hits,
        "model": settings.groq_model,
    }
