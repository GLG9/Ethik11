# ~/ethik/models/quick_infer.py
import argparse, torch
from transformers import AutoModelForCausalLM, AutoTokenizer

p = argparse.ArgumentParser()
p.add_argument("--model", required=True)
p.add_argument("--system", default="Du bist ein Tutor, antworte kurz und präzise.")
p.add_argument("--prompt", required=True)
args = p.parse_args()

tok = AutoTokenizer.from_pretrained(args.model, use_fast=True, trust_remote_code=True)
m = AutoModelForCausalLM.from_pretrained(
    args.model,
    torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
    device_map="auto" if torch.cuda.is_available() else None,
    trust_remote_code=True,
)

tpl = f"<|system|>{args.system}\n<|user|>{args.prompt}\n<|assistant|>"
ids = tok(tpl, return_tensors="pt").to(m.device)
out = m.generate(**ids, max_new_tokens=200, temperature=0.7, top_p=0.9)
print(tok.decode(out[0], skip_special_tokens=True))
