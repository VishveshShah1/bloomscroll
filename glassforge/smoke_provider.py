#!/usr/bin/env python3
"""Verify the provider UI across all four providers: app boots clean, Ollama is
the default (no key needed), and provider switching swaps key UI + model lists.
Benign 'Ollama not reachable' network noise (localhost:11434) is ignored."""
import sys, pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).parent
app = (root / "index.html").resolve().as_uri()

def is_noise(t):
    t = (t or "").lower()
    return "11434" in t or "err_connection" in t or "failed to load resource" in t

errors = []
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("console", lambda m: (errors.append(m.text) if m.type == "error" and not is_noise(m.text) else None))
    pg.on("pageerror", lambda e: (errors.append(str(e)) if not is_noise(str(e)) else None))
    pg.goto(app, wait_until="load", timeout=30000)
    pg.wait_for_timeout(600)

    provider_default = pg.eval_on_selector("#provider", "el => el.value")
    ollama_label = pg.inner_text("#keyLabel")
    key_hidden = pg.eval_on_selector("#apiKey", "el => getComputedStyle(el).display === 'none'")
    gen_enabled_no_key = pg.eval_on_selector("#generateBtn", "el => !el.disabled")
    ollama_models = pg.eval_on_selector_all("#model option", "els => els.map(e => e.value)")

    # switch to each cloud provider and confirm key UI returns + models swap
    pg.select_option("#provider", "groq"); pg.wait_for_timeout(150)
    groq_label = pg.inner_text("#keyLabel")
    groq_key_shown = pg.eval_on_selector("#apiKey", "el => getComputedStyle(el).display !== 'none'")
    groq_models = pg.eval_on_selector_all("#model option", "els => els.map(e => e.value)")

    pg.select_option("#provider", "gemini"); pg.wait_for_timeout(150)
    gemini_label = pg.inner_text("#keyLabel")

    pg.select_option("#provider", "anthropic"); pg.wait_for_timeout(150)
    anthropic_models = pg.eval_on_selector_all("#model option", "els => els.map(e => e.value)")

    b.close()

print("default provider     :", provider_default)
print("ollama key label     :", ollama_label)
print("ollama key input hidden:", key_hidden)
print("generate enabled w/o key:", gen_enabled_no_key)
print("ollama models        :", ollama_models)
print("groq label / shown   :", groq_label, "/", groq_key_shown)
print("gemini label         :", gemini_label)
print("anthropic models     :", anthropic_models)
print("real app errors      :", errors if errors else "none")

ok = (provider_default == "ollama"
      and "Ollama" in ollama_label
      and key_hidden
      and gen_enabled_no_key
      and "qwen2.5-coder:7b" in ollama_models
      and "Groq" in groq_label and groq_key_shown
      and "Google" in gemini_label
      and "claude-sonnet-5" in anthropic_models
      and not errors)
print("\nPROVIDER SMOKE:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
