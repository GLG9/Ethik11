#!/usr/bin/env python3
# Datei: stream_wall.py
import argparse, asyncio, time, json, random, codecs, re, shutil, signal
import httpx

DEFAULT_ENDPOINTS = ["kant", "marx", "gehlen", "plessner", "loewith"]
PROMPTS = [
    "Erkläre dein Menschenbild schülergerecht.",
    "Vergleiche dein Menschenbild kurz mit einem anderen.",
    "Nenne eine Stärke und eine Grenze deines Ansatzes.",
    "Gib ein Alltagsbeispiel, das dein Menschenbild verdeutlicht.",
    "Was ist der Kernbegriff deines Menschenbilds?"
]

def now_ms():
    return int(time.time() * 1000)

async def sse_word_generator(client: httpx.AsyncClient, url: str, payload: dict):
    """
    Liest SSE (text/event-stream) und gibt vollständige Wörter (ohne Leerzeichen) in Ankunftsreihenfolge aus.
    Fallback: Wenn kein SSE, lädt den Body und „emuliert“ Wörter (weniger echt).
    """
    stream_url = url + ("&" if "?" in url else "?") + "stream=1"
    try:
        async with client.stream("POST", stream_url, json=payload, timeout=120) as r:
            if r.status_code != 200 or "text/event-stream" not in r.headers.get("Content-Type","").lower():
                # Fallback: normaler POST
                txt = (await r.aread()).decode("utf-8", "ignore")
                for w in re.findall(r"\S+", txt):
                    yield w
                return
            dec = codecs.getincrementaldecoder("utf-8")()
            buf = ""
            pending = ""  # unvollständige Wortfragmente zwischen Deltas
            async for chunk in r.aiter_bytes():
                buf += dec.decode(chunk)
                # Events sind durch \n\n getrennt
                while True:
                    sep = buf.find("\n\n")
                    if sep == -1:
                        break
                    block = buf[:sep]
                    buf = buf[sep + 2:]
                    # data:-Zeilen einsammeln
                    data_lines = []
                    for line in block.splitlines():
                        if not line or line.startswith(":"):
                            continue
                        if line.startswith("data:"):
                            data_lines.append(line[5:].lstrip())
                    if not data_lines:
                        continue
                    try:
                        obj = json.loads("\n".join(data_lines))
                    except json.JSONDecodeError:
                        continue
                    if "delta" in obj and obj["delta"]:
                        pending += obj["delta"]
                        # komplette Wörter aus pending extrahieren
                        i = 0
                        while i < len(pending):
                            m = re.search(r"\s+", pending[i:])
                            if not m:
                                break
                            end = i + m.start()
                            word = pending[i:end]
                            # führende Leerzeichen überspringen
                            if word:
                                yield word
                            # auf den nächsten Nicht-Leerraum springen
                            i = i + m.end()
                        pending = pending[i:]
                    if obj.get("done"):
                        # Restwort (falls vorhanden) ausgeben
                        if pending.strip():
                            yield pending.strip()
                        return
            # Verbindungsende ohne done: rest flushen
            tail = dec.decode(b"", final=True)
            if tail:
                pending += tail
            if pending.strip():
                for w in re.findall(r"\S+", pending):
                    yield w
    except Exception:
        # Netzwerkfehler: nichts liefern
        return

async def session_task(idx: int, base_url: str, endpoint: str, prompt: str,
                       line_data, # dict mit Feldern je Session
                       client: httpx.AsyncClient):
    """
    Startet eine Session, sammelt Wörter, Zeiten und schreibt in line_data[idx]
    """
    url = f"{base_url.rstrip('/')}/completion/{endpoint}"
    start_ms = now_ms()
    first_word_ms = None
    words = []
    async for w in sse_word_generator(client, url, {"prompt": prompt}):
        if first_word_ms is None:
            first_word_ms = now_ms()
        words.append(w)
        # nur Daten aktualisieren; Render-Task malt regelmäßig
        d = line_data[idx]
        d["words"] = words[:]  # flache Kopie
        d["first_ms"] = first_word_ms
    # fertig
    end_ms = now_ms()
    d = line_data[idx]
    d["done"] = True
    d["end_ms"] = end_ms
    if first_word_ms is None:
        d["first_ms"] = None

def render_screen(line_data, start_time):
    cols = shutil.get_terminal_size((120, 30)).columns
    # Header
    elapsed = (now_ms() - start_time) / 1000.0
    header = f"Parallel-Stream (elapsed {elapsed:5.1f}s)  —  Zeilen = Sessions  —  jedes Wort erscheint rechts angehängt"
    print("\x1b[H\x1b[2J", end="")  # clear screen
    print(header[:cols])
    print("-" * min(cols, len(header)))
    # Body
    for d in line_data:
        label = f"[{d['idx']:02d}|{d['endpoint']}] "
        if d["first_ms"] is None:
            prefix = f"{label}<wartet…> "
        else:
            ttfb = (d["first_ms"] - d["start_ms"]) / 1000.0
            prefix = f"{label}(TTFW {ttfb:.2f}s) "
        line_text = " ".join(d["words"])
        # Zeile zuschneiden: zeige das rechte Ende (neueste Wörter)
        avail = max(10, cols - len(prefix))
        if len(line_text) > avail:
            line_text = "…" + line_text[-(avail - 1):]
        print((prefix + line_text)[:cols])
    # Fußzeile
    done = sum(1 for d in line_data if d["done"])
    total = len(line_data)
    print("-" * cols)
    print(f"fertig: {done}/{total}".ljust(cols))

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://127.0.0.1:8001")
    ap.add_argument("--sessions", type=int, default=10, help="Anzahl paralleler Sessions/Zeilen")
    ap.add_argument("--concurrency", type=int, default=None, help="Max. gleichzeitige Verbindungen (Default=sessions)")
    ap.add_argument("--endpoints", nargs="+", default=DEFAULT_ENDPOINTS, help="Liste möglicher Endpunkte")
    ap.add_argument("--assign", choices=["roundrobin", "random"], default="roundrobin", help="Zuweisung der Endpunkte auf Sessions")
    ap.add_argument("--prompt", default=None, help="Ein Prompt für alle; sonst zufällige aus vordefinierter Liste")
    ap.add_argument("--fps", type=float, default=10.0, help="Bildwiederholrate des Renderers")
    args = ap.parse_args()

    sessions = max(1, args.sessions)
    concurrency = args.concurrency if args.concurrency is not None else sessions
    eps = args.endpoints or DEFAULT_ENDPOINTS

    # Session-Konfiguration erzeugen
    assignments = []
    if args.assign == "roundrobin":
        for i in range(sessions):
            assignments.append(eps[i % len(eps)])
    else:
        for i in range(sessions):
            assignments.append(random.choice(eps))

    prompts = []
    for i in range(sessions):
        prompts.append(args.prompt if args.prompt else random.choice(PROMPTS))

    # Datencontainer je Zeile
    line_data = []
    for i in range(sessions):
        line_data.append({
            "idx": i + 1,
            "endpoint": assignments[i],
            "words": [],
            "done": False,
            "start_ms": now_ms(),
            "first_ms": None,
            "end_ms": None
        })

    # HTTP-Client
    headers = {"Accept": "text/event-stream"}
    limits = httpx.Limits(max_connections=concurrency, max_keepalive_connections=concurrency)
    timeout = httpx.Timeout(None)

    stop = asyncio.Event()
    try:
        loop = asyncio.get_running_loop()
        loop.add_signal_handler(signal.SIGINT, stop.set)
    except Exception:
        pass

    async with httpx.AsyncClient(headers=headers, limits=limits, timeout=timeout) as client:
        # Warmup (ohne Streaming)
        for ep in set(assignments):
            try:
                await client.post(f"{args.base_url.rstrip('/')}/completion/{ep}", json={"prompt":"Warmup"}, timeout=30)
            except Exception:
                pass

        # Sessions starten (Semaphore limitiert echte Gleichzeitigkeit)
        sem = asyncio.Semaphore(concurrency)
        async def one(i):
            async with sem:
                line_data[i]["start_ms"] = now_ms()
                await session_task(i, args.base_url, assignments[i], prompts[i], line_data, client)

        tasks = [asyncio.create_task(one(i)) for i in range(sessions)]

        # Renderer-Schleife
        start_time = now_ms()
        try:
            while not stop.is_set():
                render_screen(line_data, start_time)
                if all(d["done"] for d in line_data):
                    break
                await asyncio.sleep(max(0.02, 1.0 / args.fps))
        finally:
            # letzte Ausgabe sichern
            render_screen(line_data, start_time)

        # Aufräumen
        for t in tasks:
            if not t.done():
                t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

if __name__ == "__main__":
    asyncio.run(main())
