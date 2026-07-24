#!/usr/bin/env python3
"""Smoke test the GlassForge app UI without an API key.
Loads index.html, injects the proof sample via GF_loadSample, and confirms the
in-app scorer paints a score, the palette builds, and the APP page has no
console errors of its own."""
import sys, pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).parent
app = (root / "index.html").resolve().as_uri()
sample = (root / "samples" / "lumen-roastery.html").read_text(encoding="utf-8")

def is_noise(t):
    t = (t or "").lower()
    return "11434" in t or "err_connection" in t or "failed to load resource" in t

app_errors = []
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("console", lambda m: (app_errors.append(m.text) if m.type == "error" and not is_noise(m.text) else None))
    pg.on("pageerror", lambda e: (app_errors.append(str(e)) if not is_noise(str(e)) else None))
    pg.goto(app, wait_until="load", timeout=30000)
    pg.wait_for_timeout(500)

    # inject proof sample through the app's own loader (no API key needed)
    pg.evaluate("(html) => window.GF_loadSample(html)", sample)
    pg.wait_for_timeout(6000)  # render + settle + score

    total = pg.inner_text("#scoreTotal")
    verdict = pg.inner_text("#verdict")
    swatches = pg.eval_on_selector_all("#swatches .swatch", "els => els.length")
    dl_disabled = pg.eval_on_selector("#downloadBtn", "el => el.disabled")
    cats = pg.eval_on_selector_all("#cats .cat", "els => els.map(e => e.textContent)")

    pg.screenshot(path=str(root / "out" / "app_loaded.png"))
    b.close()

print("score total text :", total.replace("\n", ""))
print("verdict          :", verdict)
print("palette swatches :", swatches)
print("download enabled :", not dl_disabled)
print("categories       :", cats)
print("APP console errors:", app_errors if app_errors else "none")

ok = ("/25" in total) and swatches > 0 and (not dl_disabled) and (not app_errors)
print("\nSMOKE:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
