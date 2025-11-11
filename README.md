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
