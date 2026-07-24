#!/usr/bin/env python3
"""
GlassForge verifier - renders a site in headless Chromium, runs the 25-point
rubric scorer against the LIVE DOM (computed styles + synthetic mouse/scroll
probes), captures console errors, and screenshots top/middle/bottom.

Works on local files AND live deployed URLs - the same harness the brief asks
you to re-run against the deployed site, not just the local preview.

Usage:
    python verify.py samples/lumen-roastery.html
    python verify.py https://your-site.netlify.app
    python verify.py samples/lumen-roastery.html --shots out/lumen

Exit code 0 = passed (>=22, no category <3), 1 = failed, 2 = harness error.
"""
import sys, os, json, pathlib, argparse

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("target", help="Local HTML file path or http(s) URL")
    ap.add_argument("--shots", default=None, help="Screenshot path prefix (writes _top/_mid/_bot .png)")
    ap.add_argument("--json", action="store_true", help="Print raw JSON report as well")
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright not installed. Run: pip install playwright && python -m playwright install chromium")
        sys.exit(2)

    scorer_path = pathlib.Path(__file__).parent / "scorer.js"
    scorer_js = scorer_path.read_text(encoding="utf-8")

    target = args.target
    if "://" not in target:
        target = pathlib.Path(target).resolve().as_uri()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1366, "height": 900}, device_scale_factor=1)

        # Capture console errors + page errors BEFORE navigation so load-time
        # errors are counted (this drives the Foundation "zero console errors" check).
        page.add_init_script("window.__gf_errors = [];")
        page.on("console", lambda m: page.evaluate(
            "(t)=>window.__gf_errors && window.__gf_errors.push(t)", m.text
        ) if m.type == "error" else None)
        page.on("pageerror", lambda e: page.evaluate(
            "(t)=>window.__gf_errors && window.__gf_errors.push(t)", str(e)
        ))

        page.goto(target, wait_until="load", timeout=45000)
        page.wait_for_timeout(1800)  # let Three.js / counters / reveals settle

        results = {}
        if args.shots:
            out = pathlib.Path(args.shots)
            out.parent.mkdir(parents=True, exist_ok=True)
            page.evaluate("window.scrollTo(0,0)"); page.wait_for_timeout(500)
            page.screenshot(path=f"{args.shots}_top.png")
            h = page.evaluate("document.documentElement.scrollHeight - window.innerHeight")
            page.evaluate(f"window.scrollTo(0,{int(h*0.5)})"); page.wait_for_timeout(700)
            page.screenshot(path=f"{args.shots}_mid.png")
            page.evaluate(f"window.scrollTo(0,{int(h)})"); page.wait_for_timeout(700)
            page.screenshot(path=f"{args.shots}_bot.png")
            page.evaluate("window.scrollTo(0,0)"); page.wait_for_timeout(300)

        page.evaluate(scorer_js)
        report = page.evaluate("() => GlassForgeScorer.score()")
        text = page.evaluate("(r) => GlassForgeScorer.format(r)", report)
        browser.close()

    print(text)
    if args.json:
        print("\n--- JSON ---")
        print(json.dumps(report, indent=2))
    sys.exit(0 if report["passed"] else 1)

if __name__ == "__main__":
    main()
