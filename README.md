Ethik-Projekt — Grundgerüste und Dev-Server.
- frontend/web        -> Angular-App (ng serve auf 0.0.0.0:4200)
- backend/server      -> Django/DRF (uvicorn auf 0.0.0.0:3000)
- db/sqlite/db.sqlite3-> Platzhalter für lokale DB
- docker/*            -> Platzhalter für Container-Setup

## Entwicklung starten

### Alles auf einmal
```bash
./start-dev.sh
```
Der Helfer richtet bei Bedarf `backend/.venv`, führt Migrationen aus, startet `uvicorn` auf `0.0.0.0:3000` und `ng serve` auf `0.0.0.0:4200`. Strg+C beendet beide Prozesse.

### vLLM/OpenAI-Endpunkt

- `./start-dev.sh` startet zusätzlich das Skript `models/scripts/serve_vllm.sh`. Es nutzt die virtuelle Umgebung `models/.venv` (dort muss `vllm` installiert sein) und bindet den OpenAI-kompatiblen HTTP-Server auf `http://0.0.0.0:9000`. Standardmäßig wird jetzt das Alias `deepseek-r1:7b` genutzt, was intern zu `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B` aufgelöst wird (überschreibbar via `BASE_MODEL_HF`). Das größere 14B-Modell bleibt optional verfügbar – sobald `deepseek-r1:14b` gewählt wird, setzt das Skript automatisch die strengeren Speicher-Limits (`GPU_MEMORY_UTILIZATION=0.93`, `MAX_MODEL_LEN=1792`, `SWAP_SPACE=16 GB`, `CPU_OFFLOAD_GB=16`, `--max-cpu-loras 1`, `VLLM_LORA_BACKEND=torch`), damit es weiterhin auf der 16‑GB-GPU funktioniert. Für das 7B-Default sind die Limits lockerer und lassen sich wie gewohnt per Umgebungsvariablen überschreiben. Quantisierung ist optional – per `models/scripts/quantize_awq.sh` erhältst du eine AWQ-Variante (`models/quantized/deepseek-r1-7b-awq`), die automatisch bevorzugt wird, sobald vorhanden.
- Empfohlenes vLLM-Setup (separate Umgebung):
  ```bash
  python3 -m venv /root/ethik/.venv_vllm
  source /root/ethik/.venv_vllm/bin/activate
  pip install -U "torch==2.4.0+cu121" --index-url https://download.pytorch.org/whl/cu121
  pip install vllm==0.5.4
  ```
- Verfügbare Modelle (Basismodell + LoRA-Adapter wie `kant`, `marx`, `gehlen`, `plessner`, `loewith`) anzeigen:
  ```bash
  curl http://0.0.0.0:9000/v1/models | jq
  ```
- Beispiel-Request gegen das Basismodell:
  ```bash
  curl http://0.0.0.0:9000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
      "model": "deepseek-r1:7b",
      "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Fasse Kants Kategorischen Imperativ in zwei Sätzen zusammen."}
      ],
      "temperature": 0.2
    }'
  ```
- Einen Philosophen-LoRA laden, indem der Adaptername als Modell gesetzt wird (z. B. `kant`):
  ```bash
  curl http://0.0.0.0:9000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
      "model": "marx",
      "messages": [
        {"role": "system", "content": "Du antwortest im Denken Immanuel Kants und bliebst immer bei maximal 4 Sätzen."},
        {"role": "user", "content": "Was macht dein Menschenbild aus?"}
      ]
    }'
  ```
- LoRA-Training (DeepSeek-R1 Distill Qwen 7B) läuft über eine dedizierte Umgebung:
  ```bash
  python3 -m venv /root/ethik/.venv_r1
  source /root/ethik/.venv_r1/bin/activate
  pip install -U "torch==2.4.0+cu121" --index-url https://download.pytorch.org/whl/cu121
  pip install -U transformers==4.42.4 accelerate==0.34.2 bitsandbytes==0.43.2 trl==0.9.6 datasets==2.19.2 peft==0.12.0
  cd models
  ./scripts/train_all.sh
  ```
- Für Python-Clients (`openai`-SDK): `export OPENAI_API_BASE=http://0.0.0.0:9000/v1` und `export OPENAI_API_KEY=dummy` setzen, anschließend wie gewohnt `client.chat.completions.create(model="kant", ...)` verwenden.

### Frontend
```bash
cd frontend/web
npm install          # nur beim ersten Mal bzw. nach Änderungen an package.json
npm run start        # läuft auf http://0.0.0.0:4200/ (von außen über Host-IP erreichbar)
```

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate  # falls noch kein venv existiert
pip install -r requirements.txt                     # sobald verfügbar
uvicorn server.asgi:application --host 0.0.0.0 --port 3000
```

Das Django-Admin-Interface ist unter `http://<HOST-IP>:3000/admin/` erreichbar (vorher `python manage.py createsuperuser` ausführen). Angular nutzt weiterhin die Proxy-Konfiguration auf `/api`, sodass Frontend und Backend auch aus dem Netzwerk heraus zusammenspielen.

### Produktion (Apache + OpenWebUI)
`./start-prod.sh` erledigt den gesamten Build/Deploy:

1. `.env` wird geladen (inkl. `CHATKI_*`, `FRONTEND_ORIGINS`, …).
2. Backend-Abhängigkeiten + Migrationen laufen in `backend/.venv`.
3. `npm run build --configuration production` erzeugt `frontend/web/dist/web/browser`.
4. Der fertige Build wird nach `DOC_ROOT` kopiert (`/var/www/ethik-angular` als Default, anpassbar via `DOC_ROOT=/srv/www/ethik`).
5. Optionaler Apache-Reload (`APACHE_RELOAD_CMD="apachectl -k graceful"` – kann überschrieben werden).
6. `uvicorn` startet auf `BACKEND_HOST:BACKEND_PORT` (Default `0.0.0.0:3000`).

Das Frontend wird also vollständig von Apache ausgeliefert; Node/http-server ist nicht mehr nötig.

#### ChatKI-Anbindung
Sobald `CHATKI_API_TOKEN` gesetzt ist, leitet das Backend jede Anfrage von `/api/chat/<persona>/` an die ChatKI-Instanz weiter. Standardmäßig wird `http://192.168.9.202:7000` als Basis genutzt (überschreibbar via `CHATKI_BASE_URL`). Weitere Optionen:

- `CHATKI_ORIGIN` – Origin/Referer-Header (Default `https://chatki.md.314.de`)
- `CHATKI_CHAT_ID` und `CHATKI_SESSION_ID` – optional, falls ein bestehender Chat weiter genutzt werden soll (ansonsten werden Standardwerte verwendet)
- `CHATKI_MODEL_PREFIX` oder `CHATKI_MODEL_OVERRIDES` (JSON) – Zuordnung der Personas zu Modell-IDs, z. B. `ethik-kant`

`./start-dev.sh` lädt automatisch eine `.env` im Projektstamm (falls vorhanden) und exportiert die Variablen für Backend/Modelle. Nach der `POST /api/chat/completions`-Anfrage wird automatisch `POST /api/chat/completed` mit der erhaltenen `task_id` aufgerufen, bis die finale Antwort vorliegt.

#### Externe Frontends / Domains
Wenn das Angular-Frontend nicht lokal (4200) läuft, sondern z. B. über `https://ethik.md.314.de`, muss die Domain in `FRONTEND_ORIGINS` eingetragen werden:

```bash
FRONTEND_ORIGINS=https://ethik.md.314.de,https://chatki.md.314.de
```

Der Eintrag landet in `.env` oder der jeweiligen Service-Definition; Django übernimmt ihn automatisch als CORS- und CSRF-Trusted-Origin.

## GPT-OSS 20B + RAG-Produktion

Für den produktiven GPT/RAG-Stack gibt es jetzt `./start-prod-gpt.sh`. Das Skript

- richtet `backend/.venv` sowie das neue `.venv_gpt` ein, installiert dort FastAPI, Sentence-Transformers und die speziellen `vllm==0.10.1+gptoss`-Wheels (zusätzliche Indizes werden automatisch gesetzt),
- baut Frontend & Backend wie `start-prod.sh`,
- startet den neuen FastAPI-Dienst `rag_service.server` (liest `/data/*.jsonl`, embeddet mit `sentence-transformers/paraphrase-multilingual-mpnet-base-v2`, speichert Embeddings unter `rag_service/cache/`) und exportiert `RAG_SERVICE_URL=http://127.0.0.1:9400`,
- startet anschließend das Django-Backend (nutzt zuerst den RAG-Service, fällt bei Ausfall auf das lokale TF-IDF-Backup zurück) sowie den VLLM-Server für `openai/gpt-oss-20b`.

Relevante Umgebungsvariablen:

- `RAG_DATA_GLOB`, `RAG_MAX_DOCS`, `RAG_TOP_K`, `RAG_EMBED_MODEL`, `RAG_BATCH_SIZE`, `RAG_REBUILD_INDEX` steuern den RAG-Service.
- `RAG_SERVICE_HOST/PORT` ändern den HTTP-Port, `RAG_SERVICE_URL` überschreibt das vom Backend verwendete Ziel (z. B. wenn ein externer RAG-Dienst läuft).
- `VLLM_HOST/PORT`, `MODEL_ID`, `GPT_OSS_LOCAL_PATH` bestimmen den GPT-OSS-Start.
- Die vLLM/GPT-Abhängigkeiten erwarten Python 3.12. Das Skript installiert bei Bedarf automatisch `python3.12` + `python3.12-venv` via `apt`, fällt andernfalls auf einen lokalen Download eines vorkompilierten Python-Builds (aus `python-build-standalone`, Default `cpython-3.12.7+20241002-…`) zurück und baut `.venv_gpt` mit diesem Interpreter. Anschließend lädt es direkt die veröffentlichten GPT-OSS-Wheels (`VLLM_WHEEL_URL`, `FLASHINFER_WHEEL_URL`, `TRITON_WHEEL_URL`, `TRITON_KERNELS_WHEEL_URL`, `GPT_OSS_WHEEL_URL`) und installiert sämtliche vom GPT-OSS-Build verlangten Python-Pakete (u. a. `aiohttp`, `blake3`, `cloudpickle`, `compressed-tensors`, `flashinfer_python`, `gguf`, `gpt_oss`, `llguidance`, `lm-format-enforcer`, `mistral_common[audio,image]`, `numba`, `openai`, `openai_harmony`, `opencv-python-headless`, `outlines_core`, `partial-json-parser`, `ray[cgraph]`, `sentencepiece`, `tiktoken`, `xgrammar`). Torch, Torchaudio und Torchvision stammen aus dem PyTorch-Nightly-Index (`PYTORCH_INDEX`) und lassen sich über `TORCH_VERSION`, `TORCHAUDIO_VERSION`, `TORCHVISION_VERSION` steuern (default: `2.9.0.dev20250804+cu128`, `2.8.0.dev20250804+cu128`, `0.24.0.dev20250804+cu128`, sprich die von GPT-OSS geforderten Builds). Falls PyTorch einzelne Nightlies wieder entfernt oder du eigene Builds nutzen möchtest, kannst du komplette Wheels via `TORCH_WHEEL_URL`, `TORCHAUDIO_WHEEL_URL`, `TORCHVISION_WHEEL_URL` hinterlegen (z. B. Pfade auf lokale Artefakt-Server). Ohne diese drei Wheels bricht das Skript den Start informativ ab, damit kein inkonsistentes CUDA-Setup entsteht.

Nach dem Start stehen drei Prozesse: Backend (`uvicorn` auf 127.0.0.1:3000), `rag_service` (127.0.0.1:9400) und `vllm` (127.0.0.1:9000). Der Django-Chat holt sich bei jeder Anfrage Kontext über `POST /v1/rag/query` und injiziert die zusammengefassten Blöcke in die Promptkette, bevor `gpt-oss:20b` über den OpenAI-kompatiblen Endpunkt befragt wird.
