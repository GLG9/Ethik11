# serve_peft.py
import os, json, threading, asyncio, time
from typing import Dict, Any, Optional

import torch
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TextIteratorStreamer,
    BitsAndBytesConfig,
    StoppingCriteria, StoppingCriteriaList
)
from peft import PeftModel
import anyio

# -------------------------
# Konfiguration
# -------------------------
ALIAS_MAP = {
    "deepseek-r1:7b": "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
    "deepseek-r1-7b": "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
    "deepseek-r1": "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
}


def resolve_model_id(name: str) -> str:
    override = os.environ.get("BASE_MODEL_HF")
    if override:
        return override
    return ALIAS_MAP.get(name, name)


BASE_ALIAS = os.environ.get("BASE_MODEL", "deepseek-r1:7b")
BASE = resolve_model_id(BASE_ALIAS)
if BASE != BASE_ALIAS:
    print(f"INFO: Lade Basismodell '{BASE}' für Alias '{BASE_ALIAS}'.")
ADAPTERS: Dict[str, str] = {
    "loewith":  "out/loewith_lora",
    "gehlen":   "out/gehlen_lora",
    "kant":     "out/kant_lora",
    "plessner": "out/plessner_lora",
    "marx":     "out/marx_lora",
}

STYLE: Dict[str, str] = {
    "loewith":  "Du bist Karl Löwith. Erkläre Kulturwesen und zweite Natur schülernah, ohne Aufzählungen. Antworte ausschließlich auf Deutsch.",
    "gehlen":   "Du bist Arnold Gehlen. Erkläre Mängelwesen, Weltoffenheit, Institutionen schülernah, ohne Aufzählungen. Antworte ausschließlich auf Deutsch.",
    "kant":     "Du bist Immanuel Kant. Erkläre ungesellige Geselligkeit (Antagonismus) schülernah, ohne Aufzählungen. Antworte ausschließlich auf Deutsch.",
    "plessner": "Du bist Helmuth Plessner. Erkläre exzentrische Positionalität schülernah, ohne Aufzählungen. Antworte ausschließlich auf Deutsch.",
    "marx":     "Du bist Karl Marx. Erkläre Entfremdung, Arbeit, Bourgeoisie schülernah, ohne Aufzählungen. Antworte ausschließlich auf Deutsch.",
}

GEN_DEFAULTS = {
    "max_new_tokens": int(os.environ.get("MAX_NEW_TOKENS", 160)),
    "temperature": float(os.environ.get("TEMPERATURE", 0.7)),
    "top_p": float(os.environ.get("TOP_P", 0.9)),
    "repetition_penalty": float(os.environ.get("REPETITION_PENALTY", 1.05)),
}

# -------------------------
# Model-Init (einmalig)
# -------------------------
bnb = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

tokenizer = AutoTokenizer.from_pretrained(BASE, trust_remote_code=True)
base = AutoModelForCausalLM.from_pretrained(
    BASE,
    quantization_config=bnb,
    torch_dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True,
)

first_name = next(iter(ADAPTERS))
model = PeftModel.from_pretrained(base, ADAPTERS[first_name], adapter_name=first_name)
for name, path in ADAPTERS.items():
    if name == first_name:
        continue
    model.load_adapter(path, adapter_name=name)

model.eval()
if tokenizer.pad_token_id is None:
    tokenizer.pad_token_id = tokenizer.eos_token_id

# EIN globaler Lock schützt set_adapter()+generate (Race-Fix)
GENERATION_LOCK = asyncio.Lock()

app = FastAPI()

class CompletionRequest(BaseModel):
    prompt: str
    max_new_tokens: Optional[int] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    repetition_penalty: Optional[float] = None

def _pack_sse(obj: Dict[str, Any]) -> bytes:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n".encode("utf-8")

def build_inputs(adapter: str, prompt: str):
    sys_msg = STYLE.get(adapter, "Antworte ausschließlich auf Deutsch.")
    messages = [
        {"role": "system", "content": sys_msg},
        {"role": "user",  "content": prompt},
    ]
    try:
        input_ids = tokenizer.apply_chat_template(
            messages, tokenize=True, add_generation_prompt=True, return_tensors="pt"
        ).to(model.device)
        return input_ids
    except Exception:
        text = sys_msg + "\n\nFrage: " + prompt + "\nAntwort:"
        return tokenizer(text, return_tensors="pt").to(model.device)

# ---- Cancel-StoppingCriteria, um GPU-Rechnen bei Disconnect zu beenden
class CancelFlag(StoppingCriteria):
    def __init__(self, flag: threading.Event):
        super().__init__()
        self.flag = flag
    def __call__(self, input_ids, scores, **kwargs):
        return self.flag.is_set()

async def stream_generate(adapter: str, req: CompletionRequest, request: Request):
    gen = GEN_DEFAULTS.copy()
    for k in ["max_new_tokens", "temperature", "top_p", "repetition_penalty"]:
        v = getattr(req, k)
        if v is not None:
            gen[k] = v

    async with GENERATION_LOCK:
        if adapter not in ADAPTERS:
            yield _pack_sse({"error": f"Unknown adapter '{adapter}'"})
            return

        model.set_adapter(adapter)
        input_ids = build_inputs(adapter, req.prompt)

        streamer = TextIteratorStreamer(
            tokenizer,
            skip_prompt=True,
            skip_special_tokens=True,
            decode_kwargs={"skip_special_tokens": True},
        )

        cancel_event = threading.Event()
        stop_criteria = StoppingCriteriaList([CancelFlag(cancel_event)])

        gen_kwargs = dict(
            input_ids=input_ids,
            streamer=streamer,
            do_sample=True,
            max_new_tokens=gen["max_new_tokens"],
            temperature=gen["temperature"],
            top_p=gen["top_p"],
            repetition_penalty=gen["repetition_penalty"],
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.pad_token_id,
            stopping_criteria=stop_criteria,
        )

        th = threading.Thread(target=model.generate, kwargs=gen_kwargs, daemon=True)
        th.start()

        last_ka = time.monotonic()
        KEEPALIVE_SEC = 12.0  # Kommentar-Event, damit Proxies nicht zumachen

        try:
            for text in streamer:
                # Keepalive-Kommentar, falls länger kein Token kommt
                now = time.monotonic()
                if now - last_ka > KEEPALIVE_SEC:
                    try:
                        yield b":keepalive\n\n"
                    except (anyio.BrokenResourceError, anyio.ClosedResourceError,
                            ConnectionResetError, BrokenPipeError):
                        cancel_event.set()
                        break
                    last_ka = now

                if text:
                    try:
                        yield _pack_sse({"delta": text})
                    except (anyio.BrokenResourceError, anyio.ClosedResourceError,
                            ConnectionResetError, BrokenPipeError):
                        cancel_event.set()
                        break

                # aktiv prüfen, ob Client schon getrennt ist
                try:
                    if await request.is_disconnected():
                        cancel_event.set()
                        break
                except Exception:
                    pass
        finally:
            cancel_event.set()
            th.join(timeout=0.2)
            # Abschluss-Event nur versuchen, wenn Socket noch offen
            try:
                yield _pack_sse({"done": True})
            except (anyio.BrokenResourceError, anyio.ClosedResourceError,
                    ConnectionResetError, BrokenPipeError):
                pass

@app.post("/completion/{adapter}")
async def completion(adapter: str, req: CompletionRequest, request: Request):
    try:
        return StreamingResponse(
            stream_generate(adapter, req, request),
            media_type="text/event-stream; charset=utf-8",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # wichtig hinter Nginx/Traefik, verhindert Buffering
            },
        )
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
