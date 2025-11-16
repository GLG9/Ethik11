from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import numpy as np
from sentence_transformers import SentenceTransformer

from .documents import Document

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class SearchResult:
    document: Document
    score: float


class VectorIndex:
    def __init__(
        self,
        documents: Sequence[Document],
        cache_dir: Path,
        signature: str,
        model_name: str,
        batch_size: int,
        force_rebuild: bool = False,
    ) -> None:
        self._documents = list(documents)
        self._signature = signature
        self._cache_dir = Path(cache_dir)
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        self._model_name = model_name
        self._batch_size = max(1, batch_size)
        self._encoder = SentenceTransformer(self._model_name)
        self._persona_map: dict[str, list[int]] = {}
        for idx, doc in enumerate(self._documents):
            self._persona_map.setdefault(doc.persona, []).append(idx)
        self._embeddings: np.ndarray | None = None
        if not force_rebuild and self._load_cache():
            logger.info('Loaded RAG embeddings from cache (%s)', self._cache_dir)
        else:
            self._build_and_cache()
        if self._embeddings is None:
            raise RuntimeError('RAG embeddings missing after initialization')

    def __len__(self) -> int:
        return len(self._documents)

    @property
    def encoder(self) -> SentenceTransformer:
        return self._encoder

    def _cache_paths(self) -> tuple[Path, Path]:
        embeddings_path = self._cache_dir / 'embeddings.npy'
        metadata_path = self._cache_dir / 'metadata.json'
        return embeddings_path, metadata_path

    def _load_cache(self) -> bool:
        embeddings_path, metadata_path = self._cache_paths()
        if not embeddings_path.exists() or not metadata_path.exists():
            return False
        try:
            metadata = json.loads(metadata_path.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            return False
        if metadata.get('signature') != self._signature or metadata.get('model') != self._model_name:
            return False
        try:
            embeddings = np.load(embeddings_path)
        except OSError:
            return False
        if embeddings.shape[0] != len(self._documents):
            return False
        self._embeddings = embeddings
        return True

    def _build_and_cache(self) -> None:
        logger.info('Baue neue RAG-Embeddings mit %s ...', self._model_name)
        contexts = [doc.context for doc in self._documents]
        if not contexts:
            dim = self._encoder.get_sentence_embedding_dimension()
            self._embeddings = np.zeros((0, dim), dtype='float32')
        else:
            embeddings = self._encoder.encode(
                contexts,
                batch_size=self._batch_size,
                convert_to_numpy=True,
                show_progress_bar=len(contexts) >= 100,
                normalize_embeddings=True,
            )
            self._embeddings = embeddings.astype('float32', copy=False)
        embeddings_path, metadata_path = self._cache_paths()
        np.save(embeddings_path, self._embeddings)
        metadata = {
            'signature': self._signature,
            'model': self._model_name,
            'size': len(self._documents),
        }
        metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')

    def _candidate_indices(self, persona: str | None) -> Iterable[int]:
        if persona:
            return self._persona_map.get(persona.lower(), [])
        return range(len(self._documents))

    def query(self, persona: str | None, query: str, top_k: int) -> list[SearchResult]:
        if self._embeddings is None or not query:
            return []
        candidates = list(self._candidate_indices(persona))
        if not candidates:
            return []
        query_vec = self._encoder.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )[0]
        matrix = self._embeddings[candidates]
        scores = matrix @ query_vec
        ranked = sorted(
            zip(candidates, scores.tolist()),
            key=lambda item: item[1],
            reverse=True,
        )
        results: list[SearchResult] = []
        for idx, score in ranked[: max(1, top_k)]:
            if score <= 0:
                continue
            results.append(SearchResult(self._documents[idx], float(score)))
        return results
