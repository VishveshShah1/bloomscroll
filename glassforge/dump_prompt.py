#!/usr/bin/env python3
"""Load the app headlessly and dump the exact GF_SYSTEM_PROMPT it uses, so a
local generation uses the identical rubric prompt."""
import pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).parent
app = (root / "index.html").resolve().as_uri()
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page()
    pg.goto(app, wait_until="load")
    pg.wait_for_timeout(300)
    prompt = pg.evaluate("() => window.GF_SYSTEM_PROMPT")
    b.close()

out = root / "out" / "system_prompt.txt"
out.parent.mkdir(exist_ok=True)
out.write_text(prompt, encoding="utf-8")
print("system prompt chars:", len(prompt))
print("saved to", out)
