from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any
import re

import httpx
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt

MODEL_PORTS_PATH = Path(__file__).resolve().parent / 'model_ports.json'

DEFAULT_CHAT_BASE_URL = os.environ.get('CHAT_COMPLETIONS_URL', 'http://127.0.0.1:9000/v1/chat/completions')
REQUEST_TIMEOUT = float(os.environ.get('CHAT_REQUEST_TIMEOUT', '60'))
GERMAN_GUARDRAIL = (
    'Antworte ausschließlich auf Deutsch, klar und prägnant, höchstens vier Sätze. '
    'Liefere nur den finalen Antworttext, ohne Meta-Kommentare, ohne innere Gedanken '
    'und ohne Tags wie <think>.'
)
FALLBACK_REPLY = 'Ich konnte gerade keine Antwort erzeugen. Bitte versuche es erneut.'

def build_timeout() -> httpx.Timeout:
    base_timeout = REQUEST_TIMEOUT if REQUEST_TIMEOUT > 0 else None
    return httpx.Timeout(base_timeout)


@dataclass(frozen=True, slots=True)
class ChatPayload:
    model: str
    messages: list[dict[str, Any]]
    temperature: float = 0.4
    max_tokens: int | None = None

    def as_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            'model': self.model,
            'messages': self.messages,
            'temperature': self.temperature,
        }
        if isinstance(self.max_tokens, int) and self.max_tokens > 0:
            payload['max_tokens'] = self.max_tokens
        return payload


def load_model_ports() -> dict[str, dict[str, int]]:
    try:
        return json.loads(MODEL_PORTS_PATH.read_text(encoding='utf-8'))
    except FileNotFoundError:
        return {}


def extract_reply(payload: dict[str, Any]) -> str:
    if not payload:
        return FALLBACK_REPLY

    if 'reply' in payload and isinstance(payload['reply'], str):
        cleaned = sanitize_plain_text(payload['reply'])
        if cleaned:
            return cleaned
        return FALLBACK_REPLY

    choices = payload.get('choices')
    if isinstance(choices, list) and choices:
        choice = choices[0] or {}
        message = choice.get('message') or {}
        delta = choice.get('delta') or {}
        content = message.get('content') or delta.get('content')
        if isinstance(content, str) and content.strip():
            cleaned = sanitize_plain_text(content.strip())
            if cleaned:
                return cleaned
            return FALLBACK_REPLY

    return json.dumps(payload, ensure_ascii=False)


def strip_reasoning(text: str) -> str:
    """Remove completed <think> blocks and trailing fragments before </think>."""
    cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    if '</think>' in cleaned:
        cleaned = cleaned.split('</think>')[-1]
    return cleaned


def build_payload(persona: str, body: dict[str, Any]) -> ChatPayload:
    messages = body.get('messages')
    if not isinstance(messages, list) or not messages:
        raise ValueError('messages must be a non-empty Array.')

    if not all(isinstance(message, dict) and 'role' in message and 'content' in message for message in messages):
        raise ValueError('each message needs role and content.')

    temperature = body.get('temperature', 0.4)
    max_tokens = body.get('max_tokens')
    try:
        temperature = float(temperature)
    except (ValueError, TypeError):
        temperature = 0.4

    controlled_messages = [{'role': 'system', 'content': GERMAN_GUARDRAIL}, *messages]

    return ChatPayload(
        model=persona,
        messages=controlled_messages,
        temperature=temperature,
        max_tokens=max_tokens if isinstance(max_tokens, int) and max_tokens > 0 else None,
    )


def call_completion(payload: ChatPayload) -> dict[str, Any]:
    with httpx.Client(timeout=build_timeout()) as client:
        response = client.post(DEFAULT_CHAT_BASE_URL, json=payload.as_dict())
        response.raise_for_status()
        return response.json()


def sanitize_plain_text(text: str) -> str:
    cleaned = strip_reasoning(text).strip()
    return cleaned


@csrf_exempt
def chat_stream(request: HttpRequest, who: str):
    persona = who.lower()
    model_ports = load_model_ports()
    if persona not in model_ports:
        return JsonResponse({'detail': f'Unbekannte Persona: {who}'}, status=404)

    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    try:
        body = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'detail': 'Invalid JSON payload'}, status=400)

    try:
        chat_payload = build_payload(persona, body)
    except ValueError as exc:
        return JsonResponse({'detail': str(exc)}, status=400)

    try:
        raw_response = call_completion(chat_payload)
        reply = extract_reply(raw_response)
        return JsonResponse(
            {
                'model': persona,
                'reply': reply,
                'raw': raw_response,
            }
        )
    except httpx.HTTPStatusError as exc:
        return JsonResponse(
            {
                'detail': f'Modell-Antwort fehlgeschlagen (Status {exc.response.status_code})',
                'raw': safe_json(exc.response),
            },
            status=502,
        )
    except httpx.RequestError as exc:
        return JsonResponse(
            {'detail': f'KI-Dienst nicht erreichbar: {exc}'},
            status=503,
        )


def safe_json(response: httpx.Response) -> Any:
    try:
        return response.json()
    except Exception:  # pylint: disable=broad-except
        return {'text': response.text}
