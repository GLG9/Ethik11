from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .config import (
    FORCE_REBUILD_INDEX,
    RAG_BATCH_SIZE,
    RAG_CACHE_DIR,
    RAG_DATA_GLOB,
    RAG_EMBED_MODEL,
    RAG_MAX_DOCS,
    RAG_TOP_K_DEFAULT,
    ensure_cache_dir,
)
from .documents import Document, compute_corpus_signature, load_documents
from .index import VectorIndex

logging.basicConfig(level=os.environ.get('RAG_LOG_LEVEL', 'INFO').upper())
logger = logging.getLogger(__name__)

logger.info(
    'Initialisiere RAG-Service (glob=%s, max_docs=%s, model=%s)...',
    RAG_DATA_GLOB,
    RAG_MAX_DOCS,
    RAG_EMBED_MODEL,
)

DOCUMENTS, FILES = load_documents(RAG_DATA_GLOB, RAG_MAX_DOCS)
if not DOCUMENTS:
    logger.warning('Keine RAG-Daten gefunden unter %s – Service liefert leere Antworten.', RAG_DATA_GLOB)
SIGNATURE = compute_corpus_signature(FILES, str(len(DOCUMENTS)))
CACHE_DIR = ensure_cache_dir()
INDEX = VectorIndex(
    DOCUMENTS,
    cache_dir=CACHE_DIR,
    signature=SIGNATURE,
    model_name=RAG_EMBED_MODEL,
    batch_size=RAG_BATCH_SIZE,
    force_rebuild=FORCE_REBUILD_INDEX,
)
logger.info('RAG-Service geladen (%s Dokumente).', len(INDEX))

app = FastAPI(title='Ethik RAG Service', version='1.0.0')


def format_block(doc: Document) -> str:
    return (
        f'Quelle: {doc.source} (Persona: {doc.persona})\n'
        f'Frage: {doc.question}\n'
        f'Antwort: {doc.answer}'
    )


class DocumentChunk(BaseModel):
    persona: str
    source: str
    question: str
    answer: str
    score: float
    block: str


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    persona: str | None = None
    top_k: int | None = Field(default=None, ge=1, le=20)


class QueryResponse(BaseModel):
    persona: str | None
    query: str
    top_k: int
    chunks: list[DocumentChunk]
    total_documents: int


@app.get('/healthz')
def healthcheck() -> dict[str, Any]:
    return {
        'status': 'ok',
        'documents': len(INDEX),
        'model': RAG_EMBED_MODEL,
    }


@app.post('/v1/rag/query', response_model=QueryResponse)
def rag_query(request: QueryRequest) -> QueryResponse:
    if not request.query.strip():
        raise HTTPException(status_code=400, detail='query muss gesetzt sein')
    persona = request.persona.lower() if request.persona else None
    top_k = request.top_k or RAG_TOP_K_DEFAULT
    results = INDEX.query(persona, request.query.strip(), top_k)
    chunks = [
        DocumentChunk(
            persona=result.document.persona,
            source=result.document.source,
            question=result.document.question,
            answer=result.document.answer,
            score=result.score,
            block=format_block(result.document),
        )
        for result in results
    ]
    return QueryResponse(
        persona=persona,
        query=request.query,
        top_k=top_k,
        chunks=chunks,
        total_documents=len(INDEX),
    )


if __name__ == '__main__':
    HOST = os.environ.get('RAG_SERVICE_HOST', '127.0.0.1')
    PORT = int(os.environ.get('RAG_SERVICE_PORT', '9400'))
    import uvicorn

    uvicorn.run('rag_service.server:app', host=HOST, port=PORT)
