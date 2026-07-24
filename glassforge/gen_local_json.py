#!/usr/bin/env python3
"""Prove template mode end-to-end on the LOCAL model: the model writes only the
content JSON (small, fast), which is poured into the template. Uses the app's
real GF_TEMPLATE_PROMPT and GF_renderTemplate via template.js."""
import json, time, pathlib, urllib.request
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).parent
BRIEF = ("Northwind Cycles, a custom steel bicycle frame builder in Portland, Oregon. "
         "Handmade road and gravel frames brazed to order, an in-person fitting studio, "
         "and a build waitlist.")

# 1) get the exact template prompt + keep a page open to render with GF_renderTemplate
harness = root / "_tpl_harness2.html"
harness.write_text("<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>"
                   "<script src='template.js'></script></body></html>", encoding="utf-8")
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page()
    pg.goto(harness.resolve().as_uri(), wait_until="load")
    pg.wait_for_timeout(200)
    prompt = pg.evaluate("() => window.GF_TEMPLATE_PROMPT")

    # 2) call local Ollama for the content JSON (streaming so it can't stall)
    body = {"model": "qwen2.5-coder:7b", "stream": True,
            "messages": [{"role": "system", "content": prompt},
                         {"role": "user", "content": "Business / idea to build the site for:\n" + BRIEF}],
            "options": {"num_ctx": 8192, "num_predict": 4000, "temperature": 0.6}}
    t0 = time.time()
    req = urllib.request.Request("http://localhost:11434/api/chat",
                                 data=json.dumps(body).encode(),
                                 headers={"content-type": "application/json"})
    full = ""
    with urllib.request.urlopen(req, timeout=180) as r:
        for line in r:
            line = line.strip()
            if not line:
                continue
            o = json.loads(line)
            full += o.get("message", {}).get("content", "")
            if o.get("done"):
                break
    secs = time.time() - t0
    print(f"content JSON generated in {secs:.0f}s, {len(full)} chars")

    # 3) extract + parse JSON
    s, e = full.find("{"), full.rfind("}")
    chunk = full[s:e + 1] if s >= 0 and e > s else full
    try:
        content = json.loads(chunk)
    except Exception:
        import re
        content = json.loads(re.sub(r",\s*([}\]])", r"\1", chunk))
    print("JSON parsed OK. brand =", content.get("brand"),
          "| offerings:", len(content.get("offerings", {}).get("items", [])),
          "| steps:", len(content.get("process", {}).get("steps", [])),
          "| plans:", len(content.get("plans", {}).get("items", [])))

    # 4) render through the real template
    html = pg.evaluate("(c) => window.GF_renderTemplate(c)", content)
    b.close()

(root / "samples" / "local-northwind.html").write_text(html, encoding="utf-8")
(root / "out" / "local-northwind-content.json").write_text(json.dumps(content, indent=2), encoding="utf-8")
harness.unlink(missing_ok=True)
print("rendered", len(html), "chars -> samples/local-northwind.html")
