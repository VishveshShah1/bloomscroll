#!/usr/bin/env python3
"""Render GF_sampleContent through the template engine (loaded as an EXTERNAL
script, the way the app loads it) and save the HTML so we can score the template
itself with no model involved."""
import pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).parent
# harness in the same dir as template.js so the relative src resolves; load it
# externally (not inlined) so the </script> inside the template output is fine.
harness = root / "_tpl_harness.html"
harness.write_text(
    "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>"
    "<script src='template.js'></script></body></html>",
    encoding="utf-8",
)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(harness.resolve().as_uri(), wait_until="load")
    pg.wait_for_timeout(200)
    typ = pg.evaluate("() => typeof window.GF_renderTemplate")
    if typ != "function":
        b.close()
        raise SystemExit(f"template not loaded (typeof={typ}); errors={errs}")
    html = pg.evaluate("() => window.GF_renderTemplate(window.GF_sampleContent)")
    b.close()

out = root / "samples" / "template-sundara.html"
out.write_text(html, encoding="utf-8")
harness.unlink(missing_ok=True)
print("rendered", len(html), "chars ->", out)
