# LoRA-Workflow für deepseek-r1:7b (7B)

Diese Anleitung beschreibt die Nutzung der Skripte in `models/scripts`, um fünf philosophische LoRA-Adapter zu trainieren, zu mergen und mit `vllm` bereitzustellen.

## Umgebung vorbereiten

# Virtuelle Umgebung (außerhalb von `models/`)
```bash
python3 -m venv /root/ethik/.venv_r1
source /root/ethik/.venv_r1/bin/activate
```

```bash
export CUDA_VISIBLE_DEVICES=0
export BASE_MODEL="deepseek-r1:7b"
export BASE_MODEL_HF="deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"  # optionales Override
export PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True"
pip install -U "torch==2.4.0+cu121" --index-url https://download.pytorch.org/whl/cu121
pip install -U transformers==4.42.4 accelerate==0.34.2 bitsandbytes==0.43.2 trl==0.9.6 datasets==2.19.2 peft==0.12.0
```

> Hinweis: Die Skripte lösen `deepseek-r1:7b` automatisch auf das HuggingFace-Repository `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B` auf. Bei Bedarf kannst du über `BASE_MODEL_HF` ein anderes Ziel setzen (z. B. lokalen Mirror). Das größere Alias `deepseek-r1:14b` bleibt optional und weist weiterhin auf `deepseek-ai/DeepSeek-R1-Distill-Qwen-14B`; sobald es aktiv ist, zieht `serve_vllm.sh` automatisch strengere Speicherlimits (`CPU_OFFLOAD_GB=16`, `GPU_MEMORY_UTILIZATION=0.93`, `MAX_MODEL_LEN=1792`, `SWAP_SPACE=16 GB`, `--max-cpu-loras 1`, `VLLM_LORA_BACKEND=torch`). Per `python models/quantize_awq.py --base deepseek-ai/DeepSeek-R1-Distill-Qwen-7B --out models/quantized/deepseek-r1-7b-awq` (oder `models/scripts/quantize_awq.sh`) kannst du eine 4-Bit-AWQ-Version erzeugen und `BASE_MODEL_HF` entsprechend auf das lokale Verzeichnis zeigen lassen, um VRAM zu sparen.
> Für das Serving mit `vllm` empfiehlt sich eine eigene Umgebung (`/root/ethik/.venv_vllm`) mit `torch==2.4.0+cu121` und `vllm==0.5.4` – `start-dev.sh` erkennt diese automatisch.

Lege sicher, dass alle Trainingsdaten (z. B. `data/loewith.jsonl`) unter `models/data/` liegen und dass ein passendes Python-Umfeld mit allen Abhängigkeiten aktiv ist.

## Training starten

Nutze das Sammelskript, um alle LoRA-Adapter nacheinander zu erzeugen:

```bash
cd /root/ethik
./models/scripts/train_all.sh
```

Das Skript überspringt bereits trainierte Adapter sowie fehlende Datensätze und bricht bei Fehlern ab.

## LoRA-Gewichte mergen

```bash
cd /root/ethik
./models/scripts/merge_all.sh
```

Auch dieses Skript ist idempotent und erzeugt die FP16-Gewichte in `models/merged/NAME_fp16`.

## vLLM-Serving

```bash
cd /root/ethik
./models/scripts/serve_vllm.sh
```

Der Server lauscht lokal auf `127.0.0.1:9000` und lädt automatisch alle vorhandenen Adapter aus `models/out/`.

## Referenzbefehle

Die Skripte kapseln folgende Befehle:

```bash
python train_sft.py --qlora --data data/loewith.jsonl --out out/loewith_lora
python train_sft.py --qlora --data data/gehlen.jsonl   --out out/gehlen_lora
python train_sft.py --qlora --data data/kant.jsonl     --out out/kant_lora
python train_sft.py --qlora --data data/plessner.jsonl --out out/plessner_lora
python train_sft.py --qlora --data data/marx.jsonl     --out out/marx_lora

python merge_lora.py --lora out/loewith_lora   --out merged/loewith_fp16
python merge_lora.py --lora out/gehlen_lora    --out merged/gehlen_fp16
python merge_lora.py --lora out/kant_lora      --out merged/kant_fp16
python merge_lora.py --lora out/plessner_lora  --out merged/plessner_fp16
python merge_lora.py --lora out/marx_lora      --out merged/marx_fp16

vllm serve deepseek-r1:7b \
  --dtype float16 \
  --enable-lora \
  --lora-modules \
  kant=/root/ethik/models/out/kant_lora \
  marx=/root/ethik/models/out/marx_lora \
  gehlen=/root/ethik/models/out/gehlen_lora \
  plessner=/root/ethik/models/out/plessner_lora \
  loewith=/root/ethik/models/out/loewith_lora \
  --host 127.0.0.1 --port 9000 \
  --max-model-len 4096 \
  --max-num-batched-tokens 1024 \
  --max-num-seqs 32 \
  --kv-cache-dtype fp8 \
  --gpu-memory-utilization 0.90 \
  --cpu-offload-gb 6 \
  --swap-space 8 \
  --max-loras 1 \
  --max-cpu-loras 5 \
  --enforce-eager
```

> Hinweis: Ein automatischer GitHub-Push ist nicht Bestandteil der Skripte; führe `git add`, `git commit` und `git push` bei Bedarf manuell aus.
