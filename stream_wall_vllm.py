#!/usr/bin/env python3
# Datei: stream_wall_vllm.py
import asyncio, httpx, argparse, json, random, re, shutil, sys, time
from typing import List, Dict

LORAS = ["kant", "marx", "gehlen", "plessner", "loewith"]

PROMPTS = [
    "Gib mir in zwei Sätzen das Kernmotiv deines Menschenbilds.",
    "Erkläre dein Menschenbild schülergerecht.",
    "Nenne eine Stärke und eine Grenze deines Ansatzes.",
    "Gib ein Alltagsbeispiel, das dein Menschenbild verdeutlicht.",
    "Was ist der zentrale Begriff deines Menschenbilds?"
]

def pick_loras(n: int, mix: Dict[str, int] | None) -> List[str]:
    if mix:
        seq = []
        for name, cnt in mix.items():
            seq += [name] * cnt
        if len(seq) < n:
            seq += random.choices(LORAS, k=n-len(seq))
        return seq[:n]
    return [random.choice(LORAS) for _ in range(n)]

class RowState:
    def __init__(self, sid: int, lora: str, prompt: str):
        self.sid = sid
        self.lora = lora
        self.prompt = prompt
        self.buffer = ""          # roh-Text, inkl. evtl. unvollständigem Wort
        self.emitted = 0          # wie viele vollständige Wörter schon gerendert
        self.done = False
        self.error = None

    def add_delta(self, txt: str):
        if not txt:
            return
        self.buffer += txt

    def render_line(self, width: int) -> str:
        # komplette Wörter bestimmen (letztes Token evtl. unvollständig)
        s = self.buffer
        complete = s.endswith((" ", "\n", "\t"))
        words = re.findall(r"\S+", s)
        total_complete = len(words) if complete else max(0, len(words) - 1)
        new_words = words[self.emitted:total_complete]
        self.emitted += len(new_words)

        line = " ".join(words[:self.emitted])
        head = f"[{self.sid:02d}|{self.lora}] "
        # optischer Cursor bei unvollständigem Wort
        if not complete and words:
            line_disp = head + line + (" " if line else "") + words[-1]
        else:
            line_disp = head + line
        # hart kürzen auf Terminalbreite
        return (line_disp[:width-1]) if len(line_disp) >= width else line_disp

async def stream_one(base_url: str, row: RowState, client: httpx.AsyncClient):
    url = f"{base_url.rstrip('/')}/v1/chat/completions"
    payload = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "messages": [
            {"role": "system", "content": "Antworte ausschließlich auf Deutsch."},
            {"role": "user", "content": row.prompt},
        ],
        "stream": True,
        # vLLM: aktiven LoRA-Adapter wählen
        "extra_body": {"lora": row.lora},
        # leichte Varianz
        "temperature": 0.7,
        "top_p": 0.9,
        "max_tokens": 160
    }
    try:
        async with client.stream("POST", url, json=payload, timeout=120) as r:
            async for line in r.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                try:
                    obj = json.loads(data)
                except json.JSONDecodeError:
                    continue
                choice = obj.get("choices", [{}])[0]
                delta = choice.get("delta", {})
                content = delta.get("content") or ""
                row.add_delta(content)
    except Exception as e:
        row.error = str(e)
    finally:
        row.done = True

async def render_loop(rows: List[RowState]):
    # Bildschirm zyklisch komplett neu zeichnen (einfach & robust)
    try:
        while True:
            width = shutil.get_terminal_size((120, 30)).columns
            out_lines = []
            out_lines.append("Parallel-Stream (jede Zeile = 1 Konversation) — Ctrl+C zum Beenden\n")
            for row in rows:
                line = row.render_line(width)
                if row.error and row.done:
                    # Fehler ans Ende der Zeile hängen, falls vorhanden
                    msg = f"  [ERROR: {row.error}]"
                    line = (line + msg)[:width-1]
                out_lines.append(line)
            screen = "\x1b[2J\x1b[H" + "\n".join(out_lines) + "\n"
            sys.stdout.write(screen)
            sys.stdout.flush()
            if all(r.done for r in rows):
                break
            await asyncio.sleep(0.07)
    except KeyboardInterrupt:
        pass

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://127.0.0.1:9000", help="vLLM OpenAI-Server")
    ap.add_argument("-n", "--sessions", type=int, default=20, help="Anzahl paralleler Sessions/Zeilen")
    ap.add_argument("--mix", nargs="*", help="Fixe Verteilung, z.B. --mix kant=5 marx=3 ...")
    ap.add_argument("--prompt", default=None, help="Optionaler Einheits-Prompt für alle Zeilen")
    args = ap.parse_args()

    mix = None
    if args.mix:
        mix = {}
        for item in args.mix:
            name, cnt = item.split("=")
            mix[name.strip()] = int(cnt)

    loras = pick_loras(args.sessions, mix)
    prompts = [args.prompt or random.choice(PROMPTS) for _ in range(args.sessions)]
    rows = [RowState(i, loras[i], prompts[i]) for i in range(args.sessions)]

    async with httpx.AsyncClient() as client:
        tasks = [stream_one(args.base_url, row, client) for row in rows]
        await asyncio.gather(render_loop(rows), *tasks)

if __name__ == "__main__":
    asyncio.run(main())
