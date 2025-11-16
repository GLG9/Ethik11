from __future__ import annotations

import json
import os
import logging
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Iterable, List, Sequence

import httpx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

RAG_DATA_GLOB = os.environ.get('RAG_DATA_GLOB', '/data/*.jsonl')
RAG_TOP_K = int(os.environ.get('RAG_TOP_K', '4'))
RAG_MAX_DOCS = int(os.environ.get('RAG_MAX_DOCS', '2000'))
RAG_SERVICE_URL = os.environ.get('RAG_SERVICE_URL', '').strip()
RAG_SERVICE_TIMEOUT = float(os.environ.get('RAG_SERVICE_TIMEOUT', '5.0'))
GERMAN_STOPWORDS = [
    'der', 'die', 'das', 'und', 'oder', 'ein', 'eine', 'ist', 'sind', 'den', 'dem',
    'mit', 'für', 'auf', 'im', 'in', 'zu', 'vom', 'am', 'aus', 'dass', 'nicht',
    'wie', 'was', 'wer', 'warum', 'wieso', 'weshalb', 'auch', 'nur', 'wenn', 'man'
]

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class RAGDocument:
    persona: str
    question: str
    answer: str
    context: str
    source: str


class RAGIndex:
    def __init__(self) -> None:
        self._documents: List[RAGDocument] = []
        self._vectorizer: TfidfVectorizer | None = None
        self._matrix = None
        self._persona_indices: dict[str, List[int]] = {}
        self._lock = Lock()
        self._enabled = False
        self._load()

    @property
    def enabled(self) -> bool:
        return self._enabled

    def _load(self) -> None:
        with self._lock:
            documents: list[RAGDocument] = []
            persona_index: dict[str, List[int]] = {}
            for path in self._iter_files(RAG_DATA_GLOB):
                persona = path.stem.lower()
                try:
                    with path.open('r', encoding='utf-8') as handle:
                        for line in handle:
                            line = line.strip()
                            if not line:
                                continue
                            document = self._line_to_document(line, persona, str(path))
                            if document:
                                documents.append(document)
                except (OSError, json.JSONDecodeError):
                    continue
                if len(documents) >= RAG_MAX_DOCS:
                    break

            if not documents:
                self._documents = []
                self._vectorizer = None
                self._matrix = None
                self._persona_indices = {}
                self._enabled = False
                return

            corpus = [doc.context for doc in documents]
            vectorizer = TfidfVectorizer(
                lowercase=True,
                stop_words=GERMAN_STOPWORDS,
                ngram_range=(1, 2),
                max_features=20000
            )
            matrix = vectorizer.fit_transform(corpus)

            for idx, doc in enumerate(documents):
                persona_index.setdefault(doc.persona, []).append(idx)

            self._documents = documents
            self._vectorizer = vectorizer
            self._matrix = matrix
            self._persona_indices = persona_index
            self._enabled = True

    def _iter_files(self, glob_pattern: str) -> Iterable[Path]:
        path = Path(glob_pattern)
        if any(marker in glob_pattern for marker in ('*', '?', '[')):
            root = path.parent if path.parent != Path('.') else Path.cwd()
            for candidate in sorted(root.glob(path.name)):
                if candidate.is_file():
                    yield candidate
        elif path.exists() and path.is_file():
            yield path

    def _line_to_document(self, line: str, persona: str, source: str) -> RAGDocument | None:
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            return None
        messages = payload.get('messages')
        if not isinstance(messages, list):
            return None
        system = self._first_content(messages, 'system') or ''
        question = self._first_content(messages, 'user') or ''
        answer = self._first_content(messages, 'assistant') or ''
        if not question or not answer:
            return None
        context_parts = [
            system.strip(),
            f'Frage: {question.strip()}',
            f'Antwort: {answer.strip()}'
        ]
        context = '\n'.join(part for part in context_parts if part)
        return RAGDocument(
            persona=persona,
            question=question.strip(),
            answer=answer.strip(),
            context=context,
            source=source
        )

    @staticmethod
    def _first_content(messages: Sequence[dict], role: str) -> str | None:
        for message in messages:
            if isinstance(message, dict) and message.get('role') == role:
                content = message.get('content')
                if isinstance(content, str):
                    return content
        return None

    def query(self, persona: str, prompt: str, limit: int | None = None) -> list[RAGDocument]:
        if not self._enabled or not self._vectorizer or self._matrix is None:
            return []
        prompt = (prompt or '').strip()
        if not prompt:
            return []
        candidate_indices = self._persona_indices.get(persona.lower())
        if not candidate_indices:
            candidate_indices = list(range(len(self._documents)))
        if not candidate_indices:
            return []
        submatrix = self._matrix[candidate_indices]
        query_vec = self._vectorizer.transform([prompt])
        scores = cosine_similarity(query_vec, submatrix).flatten()
        scored = sorted(
            zip(candidate_indices, scores),
            key=lambda item: item[1],
            reverse=True
        )
        max_results = limit or RAG_TOP_K
        results: list[RAGDocument] = []
        for idx, score in scored[:max_results]:
            if score <= 0:
                continue
            results.append(self._documents[idx])
        return results


class _RemoteRAGClient:
    def __init__(self, base_url: str, timeout: float) -> None:
        normalized = base_url.rstrip('/')
        if not normalized.startswith(('http://', 'https://')):
            normalized = f'http://{normalized}'
        self._endpoint = f'{normalized}/v1/rag/query'
        self._timeout = timeout if timeout and timeout > 0 else 5.0
        self._warned = False

    def build_context(self, persona: str, prompt: str, limit: int | None) -> str:
        blocks = self._fetch_blocks(persona, prompt, limit)
        if not blocks:
            return ''
        return '\n\n'.join(blocks)

    def _fetch_blocks(self, persona: str, prompt: str, limit: int | None) -> list[str]:
        payload = {
            'query': prompt,
            'top_k': limit or RAG_TOP_K,
        }
        if persona:
            payload['persona'] = persona
        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.post(self._endpoint, json=payload)
                response.raise_for_status()
                data = response.json()
            self._warned = False
        except httpx.HTTPError as exc:
            if not self._warned:
                logger.warning('Remote RAG-Service nicht erreichbar (%s) – nutze lokalen Fallback.', exc)
                self._warned = True
            return []

        chunks = data.get('chunks')
        if not isinstance(chunks, list):
            return []
        blocks: list[str] = []
        for chunk in chunks:
            if not isinstance(chunk, dict):
                continue
            block = chunk.get('block')
            if isinstance(block, str) and block.strip():
                blocks.append(block.strip())
                continue
            source = chunk.get('source', '?')
            persona_name = chunk.get('persona', persona or '?')
            question = chunk.get('question') or ''
            answer = chunk.get('answer') or ''
            snippet = (
                f'Quelle: {source} (Persona: {persona_name})\n'
                f'Frage: {question}\n'
                f'Antwort: {answer}'
            )
            blocks.append(snippet.strip())
        return blocks


_INDEX = RAGIndex()
_REMOTE_CLIENT = _RemoteRAGClient(RAG_SERVICE_URL, RAG_SERVICE_TIMEOUT) if RAG_SERVICE_URL else None
RAG_ENABLED = bool(_REMOTE_CLIENT) or _INDEX.enabled


def build_context_for_query(persona: str, prompt: str, limit: int | None = None) -> str:
    if not RAG_ENABLED:
        return ''
    prompt = (prompt or '').strip()
    if not prompt:
        return ''
    if _REMOTE_CLIENT:
        remote_context = _REMOTE_CLIENT.build_context(persona, prompt, limit)
        if remote_context:
            return remote_context
    if not _INDEX.enabled:
        return ''
    return _build_local_context(persona, prompt, limit)


def _build_local_context(persona: str, prompt: str, limit: int | None = None) -> str:
    matches = _INDEX.query(persona, prompt, limit)
    if not matches:
        return ''
    chunks = []
    for doc in matches:
        chunks.append(
            f'Quelle: {doc.source} (Persona: {doc.persona})\nFrage: {doc.question}\nAntwort: {doc.answer}'
        )
    return '\n\n'.join(chunks)
