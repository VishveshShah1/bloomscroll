#!/usr/bin/env python3
"""Run ONE real generation through local Ollama using the app's exact system
prompt + user framing. STREAMING so it survives slow CPU generation and writes
partial output as it goes. num_ctx 8192 to avoid swapping on 16GB RAM."""
import json, re, time, pathlib, urllib.request

root = pathlib.Path(__file__).parent
system = (root / "out" / "system_prompt.txt").read_text(encoding="utf-8")

BRIEF = ("Sundara, a small-batch natural skincare studio in Goa, India. "
         "Cold-pressed face oils, balms and soaps made in tiny batches from local botanicals. "
         "Needs a premium storefront-feel site: hero, the product range, an ingredients and "
         "sourcing story, a 'how it's made' section, a reviews / social-proof band, and a "
         "newsletter signup.")

body = {
    "model": "qwen2.5-coder:7b",
    "stream": True,
    "messages": [
        {"role": "system", "content": system},
        {"role": "user", "content": "Business / idea to build the site for:\n" + BRIEF},
    ],
    "options": {"num_ctx": 8192, "num_predict": 8000, "temperature": 0.8},
}

raw_path = root / "out" / "local-raw.txt"
print("generating (streaming, slow on CPU)...", flush=True)
t0 = time.time()
req = urllib.request.Request(
    "http://localhost:11434/api/chat",
    data=json.dumps(body).encode(),
    headers={"content-type": "application/json"},
)
full, n = "", 0
with urllib.request.urlopen(req, timeout=180) as r:
    for line in r:
        line = line.strip()
        if not line:
            continue
        obj = json.loads(line)
        piece = obj.get("message", {}).get("content", "")
        if piece:
            full += piece
            n += 1
            if n % 100 == 0:
                raw_path.write_text(full, encoding="utf-8")
                print(f"  ~{n} chunks, {len(full)} chars, {time.time()-t0:.0f}s", flush=True)
        if obj.get("done"):
            break

secs = time.time() - t0
raw_path.write_text(full, encoding="utf-8")
print(f"done in {secs:.0f}s, {len(full)} chars, ~{n} chunks", flush=True)

# extract the HTML doc the same way the app does
m = re.search(r"<!doctype html", full, re.I) or re.search(r"<html", full, re.I)
start = m.start() if m else 0
end = full.lower().rfind("</html>")
html = full[start:end + 7] if end != -1 else full[start:]

out = root / "samples" / "local-sundara.html"
out.write_text(html, encoding="utf-8")
print("html chars:", len(html))
print("saved to", out)
print("VALID_DOC:", html.lower().strip().startswith("<!doctype") or html.lower().strip().startswith("<html"))
