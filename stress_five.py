#!/usr/bin/env python3
import asyncio, aiohttp, time, sys, argparse, codecs, json

async def _print_delta(endpoint: str, text: str):
    if not text:
        return
    sys.stdout.write(f"\n[{endpoint}] ")
    sys.stdout.write(text)
    sys.stdout.flush()

def _process_sse_event(endpoint: str, event_block: str):
    """
    Verarbeitet einen vollständigen SSE-Event-Block (ohne abschließende Leerzeile).
    Gibt (done_flag, printed_any) zurück.
    """
    data_lines = []
    for line in event_block.splitlines():
        if not line:
            continue
        if line.startswith(":"):
            # Kommentar/Keepalive ignorieren
            continue
        if line.startswith("data:"):
            data_lines.append(line[5:].lstrip())  # nach 'data:' evtl. Leerzeichen weg
        # 'event:' / 'id:' ignorieren – nicht benötigt
    if not data_lines:
        return False, False

    payload = "\n".join(data_lines)
    try:
        obj = json.loads(payload)
    except json.JSONDecodeError:
        # Falls der Server mal reinen Text schickt, trotzdem ausgeben
        asyncio.create_task(_print_delta(endpoint, payload))
        return False, True

    if "error" in obj:
        # Fehler sichtbar machen
        sys.stdout.write(f"\n[{endpoint}] ")
        sys.stdout.write(f"[ERROR] {obj['error']}\n")
        sys.stdout.flush()
        return False, True

    printed = False
    if "delta" in obj and obj["delta"]:
        asyncio.create_task(_print_delta(endpoint, obj["delta"]))
        printed = True

    if obj.get("done"):
        return True, printed

    return False, printed

async def hit(session, base_url, endpoint, prompt, stream):
    sep = "&" if "?" in base_url else "?"
    url = f"{base_url.rstrip('/')}/completion/{endpoint}{sep}stream=1"
    payload = {"prompt": prompt}
    t0 = time.perf_counter()
    try:
        async with session.post(url, json=payload) as resp:
            start_recv = None
            total_bytes = 0

            if stream:
                content_type = resp.headers.get("Content-Type", "")
                # --- Streaming-Pfad ---
                if "text/event-stream" in content_type.lower():
                    dec = codecs.getincrementaldecoder("utf-8")()
                    buf = ""
                    done = False

                    async for chunk in resp.content.iter_chunked(1024):
                        if start_recv is None:
                            start_recv = time.perf_counter()
                        total_bytes += len(chunk)
                        buf += dec.decode(chunk)

                        # vollständige SSE-Events herauslösen (durch \n\n getrennt)
                        while True:
                            sep_idx = buf.find("\n\n")
                            if sep_idx == -1:
                                break
                            block = buf[:sep_idx]
                            buf = buf[sep_idx + 2:]
                            d, _ = _process_sse_event(endpoint, block)
                            if d:
                                done = True
                                break
                        if done:
                            # Rest ignorieren (Server beendet meist sauber)
                            break

                    # Reste flushen und evtl. letzten Event verarbeiten
                    tail = dec.decode(b"", final=True)
                    if tail:
                        buf += tail
                    if buf and not done:
                        _process_sse_event(endpoint, buf)

                    text = ""  # bereits gestreamt
                else:
                    # Fallback: kein SSE – robustes inkrementelles UTF-8-Streaming
                    dec = codecs.getincrementaldecoder("utf-8")()
                    async for chunk in resp.content.iter_chunked(1024):
                        if start_recv is None:
                            start_recv = time.perf_counter()
                        total_bytes += len(chunk)
                        piece = dec.decode(chunk)
                        if piece:
                            await _print_delta(endpoint, piece)
                    tail = dec.decode(b"", final=True)
                    if tail:
                        await _print_delta(endpoint, tail)
                    text = ""
            else:
                # Nicht-Streaming: komplette Antwort lesen
                text = await resp.text()
                total_bytes = len(text.encode("utf-8"))
                start_recv = time.perf_counter()

            t1 = time.perf_counter()
            return {
                "endpoint": endpoint,
                "status": resp.status,
                "t_total": t1 - t0,
                "t_first_byte": (start_recv - t0) if start_recv else (t1 - t0),
                "bytes": total_bytes,
            }
    except Exception as e:
        t1 = time.perf_counter()
        return {"endpoint": endpoint, "status": "ERR", "error": str(e), "t_total": t1 - t0}

async def main(args):
    conn = aiohttp.TCPConnector(limit=0, force_close=True, enable_cleanup_closed=True)
    timeout = aiohttp.ClientTimeout(total=None)
    headers = {"Accept": "text/event-stream"} if args.stream else {}
    async with aiohttp.ClientSession(connector=conn, timeout=timeout, headers=headers) as session:
        tasks = [hit(session, args.base_url, ep, args.prompt, args.stream)
                 for ep in args.endpoints]
        results = await asyncio.gather(*tasks)
    print("\n\n=== Metriken ===")
    for r in results:
        if r.get("status") == "ERR":
            print(f"{r['endpoint']:10} status=ERR  err='{r['error']}'  total={r['t_total']:.3f}s")
        else:
            print(f"{r['endpoint']:10} status={r['status']} total={r['t_total']:.3f}s "
                  f"first_byte={r['t_first_byte']:.3f}s bytes={r['bytes']}")
    ok = sum(1 for r in results if r.get("status") == 200)
    print(f"OK={ok}/{len(results)}")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--base-url", default="http://127.0.0.1:8001")
    p.add_argument("--endpoints", nargs="+",
                   default=["kant","marx","gehlen","plessner","loewith"])
    p.add_argument("--prompt", default="GPU-Test: Bitte gib eine kurze Antwort.")
    p.add_argument("--stream", action="store_true",
                   help="Clientseitig streamen (zeigt Deltas live; SSE bevorzugt).")
    args = p.parse_args()
    asyncio.run(main(args))
