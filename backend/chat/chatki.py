from __future__ import annotations

import json
import os
from typing import Any

import httpx

from .utils import sanitize_plain_text

_RAW_BASE_URL = os.environ.get('CHATKI_BASE_URL', 'http://192.168.9.202:7000').strip()
_DEFAULT_BASE = 'http://192.168.9.202:7000'

def _normalize_base(url: str) -> str:
    candidate = url or _DEFAULT_BASE
    candidate = candidate.rstrip('/')
    if not candidate.startswith(('http://', 'https://')):
        candidate = f'http://{candidate}'
    return candidate


CHATKI_BASE_URL = _normalize_base(_RAW_BASE_URL or _DEFAULT_BASE)
CHATKI_API_TOKEN = os.environ.get('CHATKI_API_TOKEN', '').strip()
CHATKI_ORIGIN = os.environ.get('CHATKI_ORIGIN', 'https://chatki.md.314.de').strip()
CHATKI_MODEL_PREFIX = os.environ.get('CHATKI_MODEL_PREFIX', 'ethik-')
CHATKI_CHAT_ID = os.environ.get('CHATKI_CHAT_ID', '2b27a9ad-ceae-41f4-bc1d-ffa8fc8a80a6').strip()
CHATKI_SESSION_ID = os.environ.get('CHATKI_SESSION_ID', 'n-cu0PfAvw8YKzPSABRO').strip()
CHATKI_MODEL_OVERRIDES: dict[str, str] = {}
if os.environ.get('CHATKI_MODEL_OVERRIDES'):
    try:
        CHATKI_MODEL_OVERRIDES = json.loads(os.environ['CHATKI_MODEL_OVERRIDES'])
    except json.JSONDecodeError:
        CHATKI_MODEL_OVERRIDES = {}

def chatki_is_configured() -> bool:
    return bool(CHATKI_API_TOKEN)


def call_chatki_completion(
    persona: str,
    messages: list[dict[str, Any]],
    temperature: float,
    max_tokens: int | None,
    timeout: httpx.Timeout,
) -> dict[str, Any]:
    if not chatki_is_configured():
        raise RuntimeError('CHATKI_API_TOKEN missing – cannot forward chat request.')

    request_payload = _build_chatki_payload(persona, messages, temperature, max_tokens)
    completion_response = _post('/api/v1/chat/completions', request_payload, timeout)
    reply_text = sanitize_plain_text(_extract_chatki_reply(completion_response))

    return {
        'reply': reply_text,
        'source': 'chatki',
        'chatki': {
            'request': request_payload,
            'response': completion_response,
        },
    }


def _post(path: str, payload: dict[str, Any], timeout: httpx.Timeout) -> dict[str, Any]:
    headers = {
        'Authorization': f'Bearer {CHATKI_API_TOKEN}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    if CHATKI_ORIGIN:
        headers['Origin'] = CHATKI_ORIGIN
        headers['Referer'] = CHATKI_ORIGIN

    cookies = {'token': CHATKI_API_TOKEN}

    with httpx.Client(timeout=timeout) as client:
        response = client.post(f'{CHATKI_BASE_URL}{path}', json=payload, headers=headers, cookies=cookies)
        response.raise_for_status()
        return response.json()


def _build_chatki_payload(
    persona: str,
    messages: list[dict[str, Any]],
    temperature: float,
    max_tokens: int | None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        'model': _resolve_model_id(persona),
        'messages': messages,
        'stream': False,
    }
    if temperature is not None:
        payload['temperature'] = float(temperature)
    if isinstance(max_tokens, int) and max_tokens > 0:
        payload['max_tokens'] = max_tokens
    return payload


def _resolve_model_id(persona: str) -> str:
    persona = persona.lower()
    if persona in CHATKI_MODEL_OVERRIDES:
        return CHATKI_MODEL_OVERRIDES[persona]
    if persona == 'loewith':
        # Normalisiere Umlaut
        return CHATKI_MODEL_PREFIX + 'loewith'
    return CHATKI_MODEL_PREFIX + persona


def _extract_chatki_reply(payload: Any) -> str:
    if isinstance(payload, dict):
        for key in ('reply', 'content', 'text'):
            if key in payload:
                text = _string_from_node(payload[key])
                if text:
                    return text
        if 'choices' in payload:
            choice = payload['choices']
            if isinstance(choice, list) and choice:
                text = _extract_from_choice(choice[0])
                if text:
                    return text
        if 'outputs' in payload:
            outputs = payload['outputs']
            if isinstance(outputs, list):
                for entry in outputs:
                    text = _string_from_node(entry)
                    if text:
                        return text
        for value in payload.values():
            if isinstance(value, (dict, list)):
                text = _extract_chatki_reply(value)
                if text:
                    return text
    elif isinstance(payload, list):
        for item in payload:
            text = _extract_chatki_reply(item)
            if text:
                return text
    elif isinstance(payload, str):
        stripped = payload.strip()
        if stripped:
            return stripped
    return ''


def _extract_from_choice(choice: Any) -> str:
    if not isinstance(choice, dict):
        return ''
    message = choice.get('message') or {}
    delta = choice.get('delta') or {}
    return _string_from_node(message.get('content') or delta.get('content'))


def _string_from_node(node: Any) -> str:
    if isinstance(node, str):
        return node.strip()
    if isinstance(node, dict):
        if 'text' in node:
            return _string_from_node(node['text'])
        if 'content' in node:
            return _string_from_node(node['content'])
        for value in node.values():
            if isinstance(value, (str, dict, list)):
                candidate = _string_from_node(value)
                if candidate:
                    return candidate
    if isinstance(node, list):
        parts: list[str] = []
        for item in node:
            candidate = _string_from_node(item)
            if candidate:
                parts.append(candidate)
        return ' '.join(parts).strip()
    return ''
