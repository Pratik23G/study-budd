"""API router for document processing endpoints (simple RAG)."""

from __future__ import annotations

import hashlib
import math
import re
from typing import Any
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.processing.models import Document, DocumentChunk
from app.processing.schemas import (
    ChunkResponse,
    ProcessRequest,
    ProcessingStatusResponse,
    QueryRequest,
    QueryResponse,
)

router = APIRouter(prefix="/processing", tags=["processing"])

# Together BAAI/bge-base-en-v1.5 outputs 768. Must match Vector(dim) in models.py.
EMBEDDING_DIM = 768


# ----------------------------
# Chunking (simple + robust)
# ----------------------------
def chunk_text(text: str, max_chars: int = 900, overlap: int = 150) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []

    chunks: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        end = min(i + max_chars, n)
        chunk = text[i:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == n:
            break
        i = max(0, end - overlap)
    return chunks


# ----------------------------
# Embeddings (Together API if configured, else deterministic fallback)
# ----------------------------
def _hash_to_unit_vector(s: str, dim: int = EMBEDDING_DIM) -> list[float]:
    """
    Deterministic "good enough" fallback embedding:
    - hashes tokens into a fixed-size bag
    - L2 normalize
    This is NOT SOTA, but makes the system run without external deps/keys.
    """
    vec = [0.0] * dim
    tokens = re.findall(r"[A-Za-z0-9_]+", s.lower())
    if not tokens:
        return vec

    for t in tokens:
        h = int(hashlib.sha256(t.encode("utf-8")).hexdigest(), 16)
        vec[h % dim] += 1.0

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


async def embed(texts: list[str]) -> list[list[float]]:
    """Generate embeddings via Together API or fallback to deterministic hash vectors."""
    settings = get_settings()
    if not settings.together_api_key:
        return [_hash_to_unit_vector(t) for t in texts]

    # ensure EMBEDDING_DIM matches that model's output dimension
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "https://api.together.xyz/v1/embeddings",
            headers={"Authorization": f"Bearer {settings.together_api_key}"},
            json={"model": settings.together_embed_model, "input": texts},
        )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Embedding provider error: {r.text}")

        data = r.json()
        vectors = [item["embedding"] for item in data["data"]]

    # If dimensions differ, fail loudly so you fix Vector(dim).
    if vectors and len(vectors[0]) != EMBEDDING_DIM:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Embedding dimension mismatch: got {len(vectors[0])} but Vector is {EMBEDDING_DIM}. "
                "Either change EMBEDDING_DIM + Vector(dim) and migrate, or use a matching embed model."
            ),
        )
    return vectors


# ----------------------------
# RAG answer generation (Together chat if configured)
# ----------------------------
async def generate_answer(question: str, context: str) -> str:
    """Generate RAG answer via Together chat API."""
    settings = get_settings()
    if not settings.together_api_key:
        return (
            "No LLM configured (TOGETHER_API_KEY not set). "
            "Here is the retrieved context you can use:\n\n"
            f"{context}"
        )

    async with httpx.AsyncClient(timeout=45.0) as client:
        r = await client.post(
            "https://api.together.xyz/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.together_api_key}"},
            json={
                "model": settings.together_model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful study assistant. Answer using ONLY the provided context. "
                            "If the context is insufficient, say you don't have enough information."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Question: {question}\n\nContext:\n{context}",
                    },
                ],
                "temperature": 0.2,
                "max_tokens": settings.together_max_tokens,
            },
        )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"LLM provider error: {r.text}")

        out = r.json()
        return out["choices"][0]["message"]["content"].strip()


# ----------------------------
# Processing endpoints
# ----------------------------
@router.post("/{document_id}")
async def process_document(
    document_id: UUID,
    req: ProcessRequest,
    db: AsyncSession = Depends(get_db),
) -> ProcessingStatusResponse:
    # upsert document
    existing = await db.scalar(select(Document).where(Document.id == document_id))
    if existing is None:
        doc = Document(id=document_id, title=req.title, status="processing")
        db.add(doc)
        await db.flush()
    else:
        await db.execute(
            update(Document)
            .where(Document.id == document_id)
            .values(title=req.title, status="processing", error=None)
        )

    # clear old chunks
    await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))

    chunks = chunk_text(req.text)
    if not chunks:
        await db.execute(
            update(Document)
            .where(Document.id == document_id)
            .values(status="error", error="No text to process.")
        )
        await db.commit()
        raise HTTPException(status_code=400, detail="No text to process.")

    vectors = await embed(chunks)

    for idx, (content, vec) in enumerate(zip(chunks, vectors)):
        db.add(
            DocumentChunk(
                document_id=document_id,
                chunk_index=idx,
                content=content,
                embedding=vec,
                metadata={**req.metadata, "chunk_index": idx},
            )
        )

    await db.execute(
        update(Document).where(Document.id == document_id).values(status="ready", error=None)
    )
    await db.commit()

    return ProcessingStatusResponse(
        document_id=document_id,
        status="ready",
        chunks_count=len(chunks),
        error=None,
    )


@router.get("/{document_id}/status")
async def get_status(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ProcessingStatusResponse:
    doc = await db.scalar(select(Document).where(Document.id == document_id))
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunks_count = await db.scalar(
        select(func.count()).select_from(DocumentChunk).where(DocumentChunk.document_id == document_id)
    )

    return ProcessingStatusResponse(
        document_id=doc.id,
        status=doc.status,
        chunks_count=int(chunks_count or 0),
        error=doc.error,
    )


@router.get("/{document_id}/chunks")
async def get_chunks(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[ChunkResponse]:
    rows = (await db.execute(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.chunk_index.asc())
    )).scalars().all()

    return [
        ChunkResponse(
            id=r.id,
            document_id=r.document_id,
            chunk_index=r.chunk_index,
            content=r.content,
            metadata=r.metadata or {},
        )
        for r in rows
    ]


# ----------------------------
# RAG query endpoint
# ----------------------------
@router.post("/rag/query", response_model=QueryResponse)
async def rag_query(
    req: QueryRequest,
    db: AsyncSession = Depends(get_db),
) -> QueryResponse:
    # ensure document ready
    doc = await db.scalar(select(Document).where(Document.id == req.document_id))
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail=f"Document status is '{doc.status}', not ready.")

    qvec = (await embed([req.question]))[0]

    # pgvector distance: smaller is closer
    # cosine distance operator: <=>  (pgvector)
    # l2 distance operator: <->       (pgvector)
    rows = (await db.execute(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == req.document_id)
        .order_by(DocumentChunk.embedding.cosine_distance(qvec))
        .limit(req.top_k)
    )).scalars().all()

    context_chunks = [
        ChunkResponse(
            id=r.id,
            document_id=r.document_id,
            chunk_index=r.chunk_index,
            content=r.content,
            metadata=r.metadata or {},
        )
        for r in rows
    ]

    context_text = "\n\n---\n\n".join(
        f"[Chunk {c.chunk_index}]\n{c.content}" for c in context_chunks
    )

    answer = await generate_answer(req.question, context_text)

    return QueryResponse(
        document_id=req.document_id,
        question=req.question,
        answer=answer,
        context_chunks=context_chunks,
    )

# TODO: Add endpoints
# POST /processing/{document_id} - Trigger processing for a document
# GET /processing/{document_id}/status - Get processing status
# GET /processing/{document_id}/chunks - Get document chunks
