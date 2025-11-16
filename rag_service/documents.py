from __future__ import annotations

import json
import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence


@dataclass(frozen=True, slots=True)
class Document:
    persona: str
    question: str
    answer: str
    context: str
    source: str


def iter_files(glob_pattern: str) -> Iterable[Path]:
    path = Path(glob_pattern)
    if any(marker in glob_pattern for marker in ('*', '?', '[')):
        root = path.parent if path.parent != Path('.') else Path.cwd()
        for candidate in sorted(root.glob(path.name)):
            if candidate.is_file():
                yield candidate
    elif path.is_file():
        yield path


def _first_content(messages: Sequence[dict], role: str) -> str | None:
    for message in messages:
        if isinstance(message, dict) and message.get('role') == role:
            content = message.get('content')
            if isinstance(content, str):
                return content.strip()
    return None


def line_to_document(line: str, persona: str, source: str) -> Document | None:
    try:
        payload = json.loads(line)
    except json.JSONDecodeError:
        return None
    messages = payload.get('messages')
    if not isinstance(messages, list):
        return None
    question = _first_content(messages, 'user')
    answer = _first_content(messages, 'assistant')
    system = _first_content(messages, 'system')
    if not question or not answer:
        return None
    context_parts = []
    if system:
        context_parts.append(system)
    context_parts.append(f'Frage: {question}')
    context_parts.append(f'Antwort: {answer}')
    context = '\n'.join(context_parts)
    return Document(
        persona=persona.lower(),
        question=question.strip(),
        answer=answer.strip(),
        context=context,
        source=source,
    )


def load_documents(glob_pattern: str, limit: int) -> tuple[list[Document], list[Path]]:
    documents: list[Document] = []
    used_files: list[Path] = []
    for file_path in iter_files(glob_pattern):
        persona = file_path.stem.lower()
        used_files.append(file_path)
        try:
            with file_path.open('r', encoding='utf-8') as handle:
                for line in handle:
                    line = line.strip()
                    if not line:
                        continue
                    document = line_to_document(line, persona, str(file_path))
                    if document:
                        documents.append(document)
                    if 0 < limit <= len(documents):
                        break
        except (OSError, UnicodeDecodeError):
            continue
        if 0 < limit <= len(documents):
            break
    return documents, used_files


def compute_corpus_signature(files: Sequence[Path], extra: str | None = None) -> str:
    parts: list[str] = []
    for file_path in files:
        try:
            stat = file_path.stat()
        except OSError:
            continue
        parts.append(f'{file_path}:{stat.st_size}:{int(stat.st_mtime)}')
    payload = '|'.join(parts)
    if extra:
        payload = f'{payload}|{extra}'
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()
