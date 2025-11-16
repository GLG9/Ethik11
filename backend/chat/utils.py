from __future__ import annotations

import re

__all__ = ['strip_reasoning', 'sanitize_plain_text']

_THINK_PATTERN = re.compile(r'<think>.*?</think>', flags=re.DOTALL)


def strip_reasoning(text: str) -> str:
    """Remove <think> blocks and trailing fragments after </think>."""
    cleaned = _THINK_PATTERN.sub('', text)
    if '</think>' in cleaned:
        cleaned = cleaned.split('</think>')[-1]
    return cleaned


def sanitize_plain_text(text: str) -> str:
    """Normalize assistant replies by trimming and removing reasoning tags."""
    return strip_reasoning(text).strip()

