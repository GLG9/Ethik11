# Agents.md — Ethik-KI-Webseite (Angular + Django, DE, ohne sudo)

## Rolle des Agents („codex“ in code-server)
Du setzt dieses Projekt Ende-zu-Ende um – **schrittweise**, mit sauberen Commits und kurzen Begründungen in den Commit-Messages. Halte dich an die Phasen unten. **Kein sudo.** UI durchgehend **Deutsch**. **Auth später** (nicht Teil von Phase 1).

---

## Leitplanken
- Frontend: **Angular 18**, Routing + SCSS, **ohne Angular Material** (reines SCSS).
- Backend: **Django 5 + DRF**, ASGI (uvicorn in Dev).
- DB Dev: **SQLite** (Datei im Repo). Postgres optional in späterer Phase.
- KI-Serving: 5× `llama.cpp server` (nur Anbindung vorbereiten).
  - Keys: `loewith`, `gehlen`, `kant`, `plessner`, `marx`
  - GPU-Ports: **8001–8005**, CPU-Fallback: **8101–8105**
- RAG: direkt einplanen (Hefter-Inhalte als Quellen), aber erst ab **Phase 3** implementieren.
- Keine globalen Root-Dienste; alles user-lokal.

---

## Ziel-Struktur
ethik/
├─ frontend/
│ └─ web/ # Angular-App
├─ backend/
│ ├─ .venv/ # Python venv (nur lokal)
│ ├─ server/ # Django-Projekt (ASGI)
│ ├─ chat/ # App: Chat (SSE-Bridge)
│ └─ quiz/ # App: Quiz/Leaderboard
├─ db/
│ └─ sqlite/db.sqlite3 # Dev-DB
├─ rag/
│ ├─ corpus/ # Textquellen (Hefter, Notizen, Zusammenfassungen)
│ ├─ index/ # erzeugte Indizes/Embeddings
│ └─ prompts.yml # Stylecards / Systemprompts (DE)
├─ docker/ # optionales Compose-Gerüst (später)
└─ Agents.md

## Phase 1 — **Gerüste & Dev-Start (ohne Business-Logik)**
**Ziel:** Leere, lauffähige Projekte + Dummy-Endpoints.

1) **Angular**
- `ng new web --routing --style=scss --strict` unter `frontend/`
- Routen (nur Überschrift im Template): `/`, `/loewith`, `/gehlen`, `/kant`, `/plessner`, `/marx`, `/quiz`, `/admin`
- `proxy.conf.json` in `frontend/web/` → `/api` → `http://127.0.0.1:3000`
- `environment.ts`: `apiBase = '/api'`

2) **Django**
- in `backend/` (venv aktiv): `django-admin startproject server .`; `startapp chat`; `startapp quiz`
- `settings.py`: `rest_framework`, `corsheaders`, `chat`, `quiz`; CORS für `http://localhost:4200`
- `urls.py`: `api/chat/<str:who>` (SSE-Stub), `api/quiz/` (DRF-Router-Stub)
- `python manage.py migrate`
- Dev-Start: `uvicorn server.asgi:application --host 127.0.0.1 --port 3000`

3) **Stubs**
- **Chat (SSE-Stub)**: akzeptiert `who`, streamt Heartbeats/Text „OK (Stub)“
- **Quiz-Router (Stub)**: `GET /questions`, `POST /submit`, `GET /leaderboard` mit Dummy-JSON
- **Konfig**: `backend/chat/model_ports.json` mit GPU/CPU-Ports (siehe Leitplanken)

**Akzeptanzkriterien Phase 1**
- `ng serve --proxy-config proxy.conf.json` läuft.
- `uvicorn ...:3000` läuft.
- Aufruf `GET /api/quiz/leaderboard/` liefert Dummy-Daten.
- `POST /api/chat/kant` liefert SSE-Stub.

---

## Phase 2 — **Quiz & Leaderboard (minimal)**
- **Modelle** (Django): `QuizQuestion(id, philosopher, question, choices[], correctIndex)`, `QuizAttempt(userNullable, score, createdAt)`
- **API**: 
  - `GET /api/quiz/questions?who=kant`
  - `POST /api/quiz/submit` → Score berechnen, `QuizAttempt` speichern
  - `GET /api/quiz/leaderboard` → Top-Scores (user oder anon)
- **Frontend**:
  - Quiz-Seite mit Multiple-Choice (DE), Ergebnisanzeige
  - Leaderboard-Widget (lesend)

**Akzeptanzkriterien Phase 2**
- Fragen abrufbar, Submit speichert, Leaderboard zeigt Top-Liste.
- Keine Auth nötig.

---

## Phase 3 — **Chatbots (5 Personas) + RAG-Vorbereitung**
- **prompts.yml** in `rag/` mit 5 **Stylecards** (DE) zu: Löwith (Kulturwesen), Gehlen (Mängelwesen/Institutionen), Kant (ungeselliger Geselle/Rechtsstaat), Plessner (exzentrische Positionalität), Marx (Entfremdung).
- **corpus/**: extrahiere Kernthesen/Notizen (1–2 Seiten je Philosoph, DE) als `.md` oder `.txt`.
- **Indexing-Script (Stub)** in `rag/`: CLI-Gerüst (z. B. `python -m rag.build --in rag/corpus --out rag/index`) – nur Platzhalter, noch keine echte Embedding-Lib.
- **Chat-Bridge**:
  - `model_ports.json` nutzen, GPU zuerst, bei Fehler CPU-Fallback
  - Prompt-Schablone: `Stylecard + Top-K Kontext + Nutzerfrage`
  - Streaming via SSE an Angular

**Akzeptanzkriterien Phase 3**
- `/api/chat/{who}` streamt echte Antworten von `llama.cpp`, falls Ports laufen.
- Backend sammelt **Top-K** Kontext-Snippets (Stub-Heuristik, echte Embeddings in Phase 4).

---

## Phase 4 — **RAG-Index & Embeddings (ohne sudo)**
- Python-User-Space: `transformers`, `datasets`, optional `faiss-cpu` (falls Wheel verfügbar) oder **SQLite FTS5** als Fallback.
- `rag.build`: erstellt Index; `rag.search`: liefert Top-K-Snippets.
- Qualität: Smoke-Tests (jede Persona beantwortet 3 Prüfungsfragen korrekt mit Quellenangabe).

---

## Phase 5 — **Optional Docker (nur wenn erlaubt)**
- `docker/docker-compose.yml` mit Services `api`, `frontend`, optional `proxy`
- Keine Produktion hier; nur Dev-Container vorbereiten.

---

## Dev-Kommandos (manuell)
- **Backend**: `cd backend && . .venv/bin/activate && uvicorn server.asgi:application --host 127.0.0.1 --port 3000`
- **Frontend**: `cd frontend/web && ng serve --proxy-config proxy.conf.json`

---

## Commit-Konvention
- Klein & sprechend: `chore(frontend): scaffold routes`, `feat(api): quiz submit`, `feat(chat): sse bridge`, `feat(rag): add prompts.yml`
- README knapp aktualisieren (Startanweisungen auf DE).

---

## Definition of Done (MVP Unterricht)
- 5 Wissensseiten (DE) + 5 Chatfenster (Personas) + Quiz + Leaderboard.
- KI-Bots antworten stiltreu + mit kurzen Quellen-Snippets (RAG).
- Läuft komplett ohne sudo in LXC, über Dev-Server.