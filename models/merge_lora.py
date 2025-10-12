# ~/ethik/models/merge_lora.py
import argparse, torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

p = argparse.ArgumentParser()
p.add_argument("--base", default="Qwen/Qwen2.5-7B-Instruct")
p.add_argument("--lora", required=True)
p.add_argument("--out", required=True)
args = p.parse_args()

tok = AutoTokenizer.from_pretrained(args.base, use_fast=True, trust_remote_code=True)
base = AutoModelForCausalLM.from_pretrained(args.base, torch_dtype=torch.float16, trust_remote_code=True)
merged = PeftModel.from_pretrained(base, args.lora)
merged = merged.merge_and_unload()
merged.save_pretrained(args.out)
tok.save_pretrained(args.out)
print("Merged →", args.out)
