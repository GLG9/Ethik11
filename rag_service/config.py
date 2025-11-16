from __future__ import annotations

import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]

RAG_DATA_GLOB = os.environ.get('RAG_DATA_GLOB', '/data/*.jsonl')
RAG_MAX_DOCS = int(os.environ.get('RAG_MAX_DOCS', '4000'))
RAG_TOP_K_DEFAULT = int(os.environ.get('RAG_TOP_K', '4'))
RAG_EMBED_MODEL = os.environ.get(
    'RAG_EMBED_MODEL',
    'sentence-transformers/paraphrase-multilingual-mpnet-base-v2',
)
RAG_BATCH_SIZE = max(1, int(os.environ.get('RAG_BATCH_SIZE', '24')))
RAG_CACHE_DIR = Path(os.environ.get('RAG_CACHE_DIR', ROOT_DIR / 'rag_service' / 'cache'))
FORCE_REBUILD_INDEX = os.environ.get('RAG_REBUILD_INDEX', '').lower() in {'1', 'true', 'yes'}


def ensure_cache_dir() -> Path:
    RAG_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    return RAG_CACHE_DIR
