#!/usr/bin/env python3
# ~/ethik/models/merge_lora.py
import argparse, os, torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

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


p = argparse.ArgumentParser()
p.add_argument("--base", default=os.environ.get("BASE_MODEL", "deepseek-r1:7b"))
p.add_argument("--lora", required=True)
p.add_argument("--out", required=True)
args = p.parse_args()

base_alias = args.base
base_model_id = resolve_model_id(base_alias)
if base_model_id != base_alias:
    print(f"INFO: Verwende Basismodell '{base_model_id}' für Alias '{base_alias}'.")

tok = AutoTokenizer.from_pretrained(base_model_id, use_fast=True, trust_remote_code=True)
base = AutoModelForCausalLM.from_pretrained(base_model_id, torch_dtype=torch.float16, trust_remote_code=True)
merged = PeftModel.from_pretrained(base, args.lora)
merged = merged.merge_and_unload()
merged.save_pretrained(args.out)
tok.save_pretrained(args.out)
print("Merged →", args.out)
