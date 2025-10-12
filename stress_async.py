# Datei: stress_async.py
import argparse, asyncio, time, json, random, statistics, codecs, signal
import httpx

ENDPOINTS = ["kant", "marx", "gehlen", "plessner", "loewith"]

PROMPTS = [
    "Erkläre dein Menschenbild schülergerecht.",
    "Vergleiche dein Menschenbild kurz mit einem anderen.",
    "Nenne eine Stärke und eine Grenze deines Ansatzes.",
    "Gib ein Alltagsbeispiel, das dein Menschenbild verdeutlicht.",
    "Was ist der Kernbegriff deines Menschenbilds?"
]

async def _consume_sse(response: httpx.Response) -> None:
    dec = codecs.getincrementaldecoder("utf-8")()
    buf = ""
    async for chunk in response.aiter_bytes():
        buf += dec.decode(chunk)
        while True:
            sep = buf.find("\n\n")
            if sep == -1:
                break
            block = buf[:sep]
            buf = buf[sep + 2:]
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
            if obj.get("done"):
                return
    _ = dec.decode(b"", final=True)

async def fire_one(client: httpx.AsyncClient, url: str, payload: dict, stream: bool) -> tuple[bool, float]:
    t0 = time.perf_counter()
    try:
        if stream:
            stream_url = url + ("&" if "?" in url else "?") + "stream=1"
            async with client.stream("POST", stream_url, json=payload, timeout=120) as r:
                ok = (r.status_code == 200)
                if ok:
                    await _consume_sse(r)
        else:
            r = await client.post(url, json=payload, timeout=120)
            ok = (r.status_code == 200)
    except Exception:
        ok = False
    dt = time.perf_counter() - t0
    return ok, dt

async def worker(client, url, payload, semaphore, statlist, stream: bool):
    try:
        async with semaphore:
            ok, dt = await fire_one(client, url, payload, stream)
            statlist.append(("ok" if ok else "fail", dt))
    except asyncio.CancelledError:
        # Task wurde abgebrochen (Ctrl+C); nichts mehr anhängen
        pass
    except Exception:
        statlist.append(("fail", 0.0))

def summarize(ep: str, data):
    total = len(data)
    ok = sum(1 for s, _ in data if s == "ok")
    fails = total - ok
    lat = [dt for s, dt in data if s == "ok"]
    if lat:
        avg = sum(lat) / len(lat)
        p95 = statistics.quantiles(lat, n=100)[94] if len(lat) >= 20 else max(lat)
        print(f"{ep:10s}  reqs={total:4d}  ok={ok:4d}  fail={fails:3d}  avg={avg*1000:.1f} ms  p95={p95*1000:.1f} ms")
    else:
        print(f"{ep:10s}  reqs={total:4d}  ok={ok:4d}  fail={fails:3d}  avg=NA  p95=NA")

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://127.0.0.1:8001")
    ap.add_argument("-c", "--concurrency", type=int, default=30, help="Gesamtgleichzeitigkeit")
    ap.add_argument("-n", "--per-endpoint", type=int, default=0, help="Default-Requests pro Endpunkt (falls keine individuellen Flags genutzt)")
    ap.add_argument("--stream", action="store_true", help="SSE-Streaming konsumieren (?stream=1)")
    ap.add_argument("--no-warmup", action="store_true", help="Warmup-Requests überspringen")
    for ep in ENDPOINTS:
        ap.add_argument(f"--{ep}", type=int, help=f"Anzahl Requests für {ep}")
    args = ap.parse_args()

    specified = any(getattr(args, ep) is not None for ep in ENDPOINTS)
    targets = {ep: (getattr(args, ep) or 0) if specified else args.per_endpoint for ep in ENDPOINTS}
    used_endpoints = [ep for ep, n in targets.items() if n > 0]
    if not used_endpoints:
        print("Nichts zu tun: Setze per Endpunkt z. B. '--marx 5 --kant 8' oder nutze '-n'.")
        return

    stats = {ep: [] for ep in used_endpoints}
    headers = {"Accept": "text/event-stream"} if args.stream else {}

    # WICHTIG: Verbindungs-Limits sinnvoll setzen (vorher: 0 → Deadlock!)
    limits = httpx.Limits(
        max_connections=args.concurrency,          # Gesamtzahl erlaubter Verbindungen
        max_keepalive_connections=args.concurrency # gleich groß reicht hier aus
    )
    timeout = httpx.Timeout(None)

    # Für sauberes Ctrl+C
    stop_event = asyncio.Event()
    def _handle_sigint():
        stop_event.set()
    try:
        loop = asyncio.get_running_loop()
        loop.add_signal_handler(signal.SIGINT, _handle_sigint)
    except NotImplementedError:
        # Windows/Umgebungen ohne signal-Unterstützung
        pass

    async with httpx.AsyncClient(headers=headers, limits=limits, timeout=timeout) as client:
        if not args.no_warmup:
            for ep in used_endpoints:
                try:
                    await client.post(f"{args.base_url.rstrip('/')}/completion/{ep}", json={"prompt": "Warmup"}, timeout=30)
                except Exception:
                    pass

        sem = asyncio.Semaphore(args.concurrency)
        tasks = []
        for ep in used_endpoints:
            url = f"{args.base_url.rstrip('/')}/completion/{ep}"
            for _ in range(targets[ep]):
                payload = {"prompt": random.choice(PROMPTS)}
                tasks.append(asyncio.create_task(worker(client, url, payload, sem, stats[ep], args.stream)))

        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        # Wenn Ctrl+C kam, alle Tasks canceln und Teilergebnisse zeigen
        while not stop_event.is_set() and pending:
            # normal weiterlaufen bis alles fertig
            done2, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
            done |= done2

        if stop_event.is_set():
            for t in pending:
                t.cancel()
            await asyncio.gather(*pending, return_exceptions=True)

    print("\n=== Ergebnisse (pro Endpunkt) ===")
    for ep in used_endpoints:
        summarize(ep, stats[ep])

    all_data = [x for ep in used_endpoints for x in stats[ep]]
    summarize("TOTAL", all_data)

if __name__ == "__main__":
    asyncio.run(main())
