#!/usr/bin/env python3
from __future__ import annotations

import os
from typing import List, Optional

import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import uvicorn

MODEL_PATH = os.environ.get('OSS_MODEL_PATH', '/root/ethik/models/quantized/gpt-oss-20b')
HOST = os.environ.get('OSS_HOST', '127.0.0.1')
PORT = int(os.environ.get('OSS_PORT', '9000'))
MAX_NEW_TOKENS = int(os.environ.get('OSS_MAX_NEW_TOKENS', '512'))
DEFAULT_TEMPERATURE = float(os.environ.get('OSS_DEFAULT_TEMPERATURE', '0.4'))

print(f"[gpt-oss] Lade Modell aus {MODEL_PATH} ...", flush=True)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, use_fast=False, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token
dtype = torch.float16 if torch.cuda.is_available() else torch.float32
model_kwargs = dict(
    dtype=dtype,
    trust_remote_code=True,
)

model = AutoModelForCausalLM.from_pretrained(MODEL_PATH, **model_kwargs)
if torch.cuda.is_available():
    model.to('cuda')
model.eval()
print("[gpt-oss] Modell geladen.", flush=True)

app = FastAPI()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: Optional[str] = None
    messages: List[Message]
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class Choice(BaseModel):
    index: int
    message: dict
    finish_reason: str


class ChatResponse(BaseModel):
    model: str
    reply: str
    choices: List[Choice]


ROLE_TAGS = {
    'system': '<|system|>',
    'user': '<|user|>',
    'assistant': '<|assistant|>',
}


def build_prompt(messages: List[Message]) -> str:
    segments = []
    for message in messages:
        role = message.role.lower()
        tag = ROLE_TAGS.get(role, '<|user|>')
        segments.append(f"{tag}{message.content.strip()}")
    segments.append('<|assistant|>')
    return '\n'.join(segments)


def strip_reasoning(text: str) -> str:
    if '<think>' in text and '</think>' in text:
        start = text.index('</think>') + len('</think>')
        text = text[start:]
    return text.strip()


@app.post('/v1/chat/completions')
def create_chat_completion(request: ChatRequest):
    prompt = build_prompt(request.messages)
    temperature = request.temperature if request.temperature is not None else DEFAULT_TEMPERATURE
    max_tokens = min(request.max_tokens or MAX_NEW_TOKENS, MAX_NEW_TOKENS)
    inputs = tokenizer(prompt, return_tensors='pt').to(model.device)
    with torch.inference_mode():
        generated = model.generate(
            **inputs,
            do_sample=temperature > 0,
            temperature=max(temperature, 1e-3),
            max_new_tokens=max_tokens,
            pad_token_id=tokenizer.eos_token_id,
        )
    output_tokens = generated[0][inputs['input_ids'].shape[-1]:]
    raw_text = tokenizer.decode(output_tokens, skip_special_tokens=False)
    reply = strip_reasoning(raw_text.split('<|assistant|>')[-1])
    reply = reply.split('<|user|>')[0].split('<|system|>')[0].strip()

    response = {
        'model': request.model or 'gpt-oss:20b',
        'reply': reply,
        'choices': [
            {
                'index': 0,
                'message': {'role': 'assistant', 'content': reply},
                'finish_reason': 'stop',
            }
        ],
    }
    return response


@app.get('/healthz')
def healthcheck():
    return {'status': 'ok'}


if __name__ == '__main__':
    uvicorn.run(app, host=HOST, port=PORT)
