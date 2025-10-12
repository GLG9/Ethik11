import argparse
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig
import torch

def _to_str(x):
    if isinstance(x, str): return x
    if isinstance(x, dict): return str(x.get("text", "")) if "text" in x else str(x)
    if isinstance(x, list): return " ".join([_to_str(z) for z in x if z is not None])
    return str(x)

def _normalize_messages(msgs):
    fixed = []
    for m in msgs:
        if isinstance(m, dict):
            role = m.get("role", "user")
            content = _to_str(m.get("content", ""))
        else:
            role = "user"
            content = _to_str(m)
        fixed.append({"role": role, "content": content})
    return fixed

def render_one(ex, tok):
    if isinstance(ex, str):
        return ex
    msgs = ex.get("messages")
    if msgs is None:
        if "text" in ex: return _to_str(ex["text"])
        raise ValueError(f"Sample ohne 'messages' oder 'text': {ex}")
    msgs = _normalize_messages(msgs)
    if ex.get("system"):
        msgs = [{"role":"system","content":_to_str(ex["system"])}] + msgs
    return tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=False)

def formatting_func_any(sample, tok):
    """
    Muss IMMER list[str] liefern (TRL 0.9.6).
    - Batched: sample ist Dict mit Listen (z.B. sample['messages'][i])
    - Single:  sample ist einzelnes Dict -> wrappe in Liste
    """
    if isinstance(sample, dict) and any(isinstance(v, list) for v in sample.values()):
        # Batched
        # Finde Batchgröße über ein Listenfeld
        first_list_len = None
        for v in sample.values():
            if isinstance(v, list):
                first_list_len = len(v)
                break
        n = first_list_len or 0
        out = []
        for i in range(n):
            ex = {}
            if "messages" in sample:
                ex["messages"] = sample["messages"][i]
            if "system" in sample:
                sysval = sample["system"]
                ex["system"] = sysval[i] if isinstance(sysval, list) and i < len(sysval) else sysval
            out.append(render_one(ex, tok))
        return out
    # Single
    return [render_one(sample, tok)]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="Qwen/Qwen2.5-7B-Instruct")
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--epochs", type=int, default=2)
    ap.add_argument("--maxlen", type=int, default=512)
    ap.add_argument("--qlora", action="store_true")
    args = ap.parse_args()

    tok = AutoTokenizer.from_pretrained(args.base, use_fast=True, trust_remote_code=True)

    if args.qlora:
        from transformers import BitsAndBytesConfig
        qconf = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
        )
        model = AutoModelForCausalLM.from_pretrained(
            args.base, quantization_config=qconf, device_map="auto", trust_remote_code=True
        )
        model = prepare_model_for_kbit_training(model)
    else:
        model = AutoModelForCausalLM.from_pretrained(
            args.base,
            dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None,
            trust_remote_code=True,
        )

    peft_cfg = LoraConfig(
        r=16, lora_alpha=32, lora_dropout=0.05,
        target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, peft_cfg)

    ds = load_dataset("json", data_files=args.data, split="train")

    sft_cfg = SFTConfig(
        output_dir=args.out,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,
        learning_rate=1e-4,
        logging_steps=10,
        save_steps=200,
        bf16=torch.cuda.is_available(),
        optim="paged_adamw_8bit" if args.qlora else "adamw_torch",
        max_seq_length=args.maxlen,
        packing=False,          # Mini-Datensatz => kein Packing
        dataset_text_field=None,
        report_to="none",
    )

    trainer = SFTTrainer(
        model=model,
        args=sft_cfg,
        train_dataset=ds,
        tokenizer=tok,
        formatting_func=lambda s: formatting_func_any(s, tok),  # <- ALWAYS returns list[str]
    )

    trainer.train()
    model.save_pretrained(args.out)
    tok.save_pretrained(args.out)

if __name__ == "__main__":
    main()
