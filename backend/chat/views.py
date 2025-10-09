import json
from pathlib import Path

from django.http import Http404, HttpRequest, StreamingHttpResponse

MODEL_PORTS_PATH = Path(__file__).resolve().parent / 'model_ports.json'


def load_model_ports() -> dict[str, dict[str, int]]:
    try:
        return json.loads(MODEL_PORTS_PATH.read_text(encoding='utf-8'))
    except FileNotFoundError:
        return {}


def chat_stream(request: HttpRequest, who: str) -> StreamingHttpResponse:
    persona = who.lower()
    model_ports = load_model_ports()

    if persona not in model_ports:
        raise Http404(f'Unbekannte Persona: {who}')

    def event_stream():
        yield f'data: Verbunden mit {persona.title()} (Stub)\n\n'
        yield 'data: OK (Stub)\n\n'

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response
