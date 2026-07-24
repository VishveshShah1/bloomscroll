# GlassForge

Type one prompt describing a business or idea. GlassForge generates a complete,
self-contained **3D interactive liquid-glass website**, renders it, scores it against
a strict 25-point rubric, auto-fixes any weak category, and only then shows it to you.
Then keep shaping it two ways: **chat with it** ("make the hero bigger", "warm palette")
or flip on **Edit mode** and click things directly. Download the finished HTML any time.

Everything is plain HTML/JS with no build step. Each site it makes is a single portable
`.html` file you can host anywhere or hand to a client.

---

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | **The generator app.** Open it in a browser. Prompt box, live preview, chat edits, Edit mode, download. |
| `scorer.js` | The 25-point rubric engine. Runs inside the app; also pasteable into any page's DevTools console. |
| `verify.py` | Headless-browser verifier. Renders a local file **or a live URL**, scores it, screenshots top/mid/bottom. |
| `samples/lumen-roastery.html` | The proof-of-work site (see score below). A finished example of the output quality. |
| `smoke_app.py`, `smoke_edit.py` | Tests: prove the app's scoring wiring and the edit→download round-trip work. |
| `out/` | Screenshots and committed-HTML artifacts from the verification runs. |

---

## 1. Run the generator (30 seconds)

1. Double-click **`index.html`** (or open it in any modern browser — Chrome, Edge, Safari, Firefox).
2. Pick a **Model provider** (top-left). Options, and what they cost:
   - **Local (Ollama) — unlimited, no key (default).** Runs a model on your own PC. No key, no quotas,
     no per-minute limits, free forever, and nothing leaves your machine. One-time setup below (Section 1b).
     This is the recommended free path because the cloud free tiers are too small for this workload.
   - **Groq — free cloud.** Free key at <https://console.groq.com/keys> (no card). Works, but the free
     tier is **12,000 tokens/minute**, which is enough for a single first generation of a modest site and
     not much more — **edits usually exceed it.** Fine for a quick one-off, not for iterating.
   - **Google Gemini — free cloud (region-dependent).** Free key at <https://aistudio.google.com/apikey>.
     Its free tier is huge (~1M tokens/min) *when your project actually gets it* — but some new projects
     return `limit: 0` on every model. The fix is in Section 1b. When it works, it's the best free cloud option.
   - **Anthropic (Claude) — paid.** Key at <https://console.anthropic.com/settings/keys>. Billed per token.
   - **Model list is discovered live:** the moment you paste a key (or, for Ollama, select the provider),
     the app asks that provider which models are actually available to you and fills the dropdown from the
     answer — so it never goes stale when a provider retires a model name.
   - Any cloud key lives **in memory only** by default. Tick "Remember on this device" to keep it in this
     browser's localStorage (per provider). It goes straight to the provider and to no one else — there is
     no GlassForge server. Nothing is hardcoded; view-source exposes no key.
3. Describe the site in the prompt box. Be specific: name, what they do, the vibe, key sections.
4. Hit **Generate & self-test**. Watch the loop run (generate → render → score → fix → re-score).
5. When it lands 22+/25, the site appears in the preview with its score breakdown.

**Models:** on Groq, **Llama 3.3 70B** is the free default (big enough output to never truncate a full
site); avoid the tiny "instant/8B" models for full generation as they can cut off. On Anthropic, **Sonnet 5**
is the balanced default. The self-test loop is the same regardless of model — a weaker/free model may just
need a couple more auto-fix attempts to clear the bar.

> No key handy? You can still explore: the app renders and scores the included proof sample, and Edit mode
> + Download work without any key. Only *generating* needs a key.

> **If a generation fails with a rate-limit (429) message:** you've hit a cloud provider's free
> per-minute/day quota — wait a moment and retry, switch model, or use the local Ollama path (Section 1b),
> which has no quota. On Gemini specifically, a `limit: 0` error means that project has no free quota at all
> (see the Gemini fix in Section 1b).

---

## 1b. Free engine setup

The cloud free tiers are small for this workload (a full site is ~10k+ tokens, and edits resend the whole
file). Two genuinely-free, self-serve paths that never touch any paid account:

### Local (Ollama) — unlimited, recommended free path
Runs a model on your own computer. No key, no quotas, nothing leaves your machine. Best on a PC with
16GB+ RAM (8GB works with a smaller model, slower).

1. **Install Ollama:** <https://ollama.com/download> (Windows/Mac/Linux).
2. **Pull a code-capable model** (in a terminal). Good picks, in order of quality vs. size:
   ```bash
   ollama pull qwen2.5-coder:7b       # solid default, ~5GB
   ollama pull qwen2.5-coder:14b      # better, needs more RAM
   ollama pull llama3.1:8b            # general-purpose alternative
   ```
3. **Let the browser talk to Ollama.** Ollama blocks web-page requests unless you allow the origin. Set an
   environment variable and (re)start Ollama:
   - **Windows (PowerShell):** `setx OLLAMA_ORIGINS "*"` then quit Ollama from the tray and reopen it.
   - **Mac/Linux:** `launchctl setenv OLLAMA_ORIGINS "*"` (Mac) or `OLLAMA_ORIGINS=* ollama serve` (Linux).
4. **Serve the app over http, not file://** (browsers treat a `file://` page as a foreign origin Ollama
   rejects). In the `glassforge` folder:
   ```bash
   python -m http.server 8000
   ```
   then open <http://localhost:8000>.
5. In the app, provider is already **Local (Ollama)**. The Model dropdown fills with your installed models
   — pick a `coder` one. The status shows "Local - N models installed" when it connects. Generate.

> Quality note: a 7-14B local model is weaker than a frontier cloud model, so the self-test loop may use a
> couple more auto-fix attempts to clear 22/25 (it has no quota to worry about, so that's fine). If a big
> site truncates, the `num_ctx` is set to 16384 in `callOllama` inside `index.html` — raise it if you have
> the RAM. If the dropdown says "Ollama not reachable", Ollama isn't running or step 3/4 wasn't done.

### Gemini `limit: 0` fix
A brand-new Gemini key returning `limit: 0` on every model almost always means the key was created inside a
Google Cloud project that has billing partly attached (which disables the free tier). Fix:

1. Go to <https://aistudio.google.com/apikey>.
2. Click **Create API key → Create API key in a new project** (a *fresh* project, no billing attached).
3. Use that key in the app with the provider set to **Google Gemini**, and pick a **Flash** model.

If a fresh-project key still shows `limit: 0`, the free tier likely isn't offered in your region right now —
use the local Ollama path instead.

---

## 1c. Two generation modes (this is the important one)

Asking a model to write a whole 30 KB liquid-glass site from scratch is slow and unreliable — a weak or
local model produces thin, broken sites and takes forever. So GlassForge defaults to a smarter design:

- **Reliable template mode (default, checkbox ON).** The model writes **only the copy** — a small (~1 KB)
  JSON of business name, headline, sections, prices, colors. The app pours that into a **fixed liquid-glass
  layout that already scores 25/25** (`template.js`, ported from the proof sample). Result: generation is
  **fast on any model** (only ~800 tokens to write, not ~9000) and **always clears the quality bar**, because
  the glass / 3D / scroll / interactivity is baked into the template, not gambled on the model. This is what
  makes the free local model actually usable.
- **Freeform mode (checkbox OFF).** The model writes the entire HTML itself. More creative freedom and
  layout variety, but needs a strong model (Gemini/Anthropic/Groq-70B) and is slower. On a weak/local model
  it will often miss the bar. Use this only with a capable model.

Both modes run the same self-test loop (render → score → fix). Template mode's "fix" rounds just ask for
richer copy, since the layout already passes. Chat edits in template mode update the JSON (fast); the visual
Edit mode (click-to-edit text/colors/images) works in both modes with no API call.

## 2. How the scoring works

The rubric is **25 points, 5 categories of 5**. A site is only shown to you at **22+ overall with
no single category below 3**. The scorer does not read the code and guess — it renders the real page
and inspects the **live DOM**: computed styles, plus synthetic mouse-move and scroll probes to prove
the interactive bits actually fire.

| Category | What it checks (examples) |
|---|---|
| **Glass** | `backdrop-filter: blur` on 3+ surfaces, semi-transparent backgrounds, thin light borders, blurred colour shapes behind the glass. |
| **3D** | CSS `perspective`, mouse-reactive tilt **verified by firing real mousemove events and watching the transform change**, a WebGL/Three.js element, 3+ z-index depth layers. |
| **Scroll** | IntersectionObserver reveals on every section, site-wide smooth scroll, parallax **verified by scrolling to two positions and confirming two different transforms**, continuous response. |
| **Interactivity** | Real hover + focus states, a micro-interaction (counters/magnetic/ripple), nav anchors that resolve to real sections, no dead-end links. |
| **Foundation** | Real copy (no lorem ipsum), viewport + media queries, no horizontal overflow, semantic landmarks + alt text, **zero console errors**. |

The **self-test loop** runs automatically on every generate and every chat edit:

1. Generate the HTML (the rubric above is the system prompt).
2. Render it in a sandboxed iframe and let it settle (fonts, Three.js, counters).
3. Score the live DOM.
4. **22+ and nothing under 3 → accept.** Otherwise, name the weak categories, send them back to the
   model with the exact failing checks, and regenerate.
5. Cap at **5 attempts**. If still short, keep the best-scoring version and tell you honestly what's missing.

The **same engine** runs in three places so a pass means the same thing everywhere:
the app (`scorer.js` inlined), the headless verifier (`verify.py` → `scorer.js`), and your own DevTools
(paste `scorer.js`, then `GlassForgeScorer.score().then(r=>console.log(GlassForgeScorer.format(r)))`).

---

## 3. Proof of work

Sample prompt used: *"Small-batch coffee roastery in Bangalore, single-origin Indian beans, subscriptions, a tasting room."* → `samples/lumen-roastery.html`.

```
GlassForge score: 25/25 PASS   (attempts: 1)
  Glass          5/5
  3D             5/5   (mouse-reactive tilt verified at runtime; Three.js particle field)
  Scroll         5/5   (parallax verified across two scroll positions)
  Interactivity  5/5
  Foundation     5/5   (zero console errors)
```

Reproduce it yourself:

```bash
pip install playwright
python -m playwright install chromium
python verify.py samples/lumen-roastery.html --shots out/lumen
```

That prints the full breakdown and writes `out/lumen_top.png`, `_mid.png`, `_bot.png`.

---

## 4. Editing after generation

**Chat revision** (left panel): type a change, e.g. *"make the hero bigger"* or *"shift to a warm palette"*.
GlassForge sends your request **plus the current code** to the model with an edit-focused instruction,
swaps in the result, and **re-runs the full self-test loop** — so an edit can never quietly break the guarantee.

**Direct visual editing** (Edit mode toggle, top of preview):
- **Click any text** → it becomes editable in place. Type over it.
- **Click any image** → replace it with a URL or a file from your computer.
- **Colours button** → every CSS variable in the site (accent, background, etc.) gets a colour swatch;
  changes apply live, no AI call.
- These are instant and free. Click **Edit mode** again to finish; **Download HTML** captures exactly
  what's on screen, edits folded in, with all editor scaffolding stripped out.

---

## 5. Publish it to a live URL

The download is one clean `index.html`. Any static host works. In order of least friction:

### Option A — Netlify Drop (recommended, public instantly, no account math)
1. Go to <https://app.netlify.com/drop>.
2. Drag your `index.html` (or a folder containing it) onto the page.
3. You get a live `https://<random-name>.netlify.app` URL in seconds. Public by default.
4. In **Site settings → Change site name**, pick a cleaner subdomain.

### Option B — Vercel
1. Install once: `npm i -g vercel`, then `vercel login`.
2. In the folder with your `index.html`, run `vercel --prod`. It prints your live URL.
3. **Important:** if your Vercel account/project has **Deployment Protection (Vercel Authentication)**
   turned on, every URL sits behind a Vercel login and the public can't see it. Turn it off at
   **Project → Settings → Deployment Protection → Vercel Authentication → Disabled** to make it public.
   *(This is exactly what happened when GlassForge deployed the sample here — the build succeeded but the
   account had this protection on, so the URL wasn't publicly reachable. It's a one-toggle fix.)*

### Option C — GitHub Pages
1. Put `index.html` in a repo, push it.
2. **Settings → Pages → Source: main branch / root.** Live at `https://<user>.github.io/<repo>/`.

---

## 6. Point a custom domain at it (plain English)

You bought a domain from Namecheap / GoDaddy / etc. DNS is just a phone book: you're telling the world
"when someone types my domain, send them to my host." You edit two kinds of records:

- An **A record** = "the bare domain (`yourbrand.com`) points to this host."
- A **CNAME record** = "the `www` version points to this host's address."

### On Netlify
1. In your site: **Domain management → Add a custom domain** → type `yourbrand.com` → Verify → Add.
2. Netlify shows you the exact records. It's usually:
   - **A record:** Host `@`  →  Value `75.2.60.5`
   - **CNAME record:** Host `www`  →  Value `<your-site>.netlify.app`
3. Go to your registrar (Namecheap: **Domain List → Manage → Advanced DNS**; GoDaddy: **My Products →
   Domain → DNS**). Delete any default "parking" A/CNAME records, then add the two above.
4. Wait. DNS can take 30 minutes to a few hours (occasionally up to 24). Netlify auto-issues a free HTTPS
   certificate once it sees the records. Done — `https://yourbrand.com` is live.

### On Vercel
1. **Project → Settings → Domains → Add** `yourbrand.com`.
2. Vercel shows the records to add at your registrar, usually:
   - **A record:** Host `@`  →  `76.76.21.21`
   - **CNAME record:** Host `www`  →  `cname.vercel-dns.com`
3. Add them at your registrar exactly as shown, save, wait for propagation. HTTPS is automatic.

**Registrar cheat-sheet:** "Host" (sometimes "Name") `@` means the bare domain; `www` means the www
subdomain. "Value" (sometimes "Points to" / "Target") is what your host gave you. TTL can stay Automatic.

---

## 7. Re-verify the LIVE site (do this before calling any site done)

Local-looks-good is not the same as live-works. After deploying, score the **real URL**:

```bash
python verify.py https://yourbrand.com --shots out/live
```

Same 25-point engine, now against the deployed build (CDN, real network, real HTTPS). Only call a site
finished when the **live URL** scores 22+.

> Note: if the host puts the site behind a login wall (e.g. Vercel Deployment Protection), the verifier
> will score the login page, not your site — make the URL public first (Section 5, Option B).

---

## 8. Repeatable per-client checklist

Do this identically for every site you sell:

1. **Generate** in `index.html` from the client's brief. Let the loop reach 22+.
2. **Refine** by chat and Edit mode until it's exactly right. Re-check the score after big edits.
3. **Download** `index.html`. Optionally rename the folder to the client (`clients/acme/index.html`).
4. **Deploy** (Netlify Drop is fastest). Confirm the URL is public.
5. **Re-verify the live URL**: `python verify.py https://theirsite.netlify.app`. Must be 22+.
6. **Custom domain**: add it on the host, paste the two DNS records into their registrar, wait for HTTPS.
7. **Hand off**: the folder is one clean `index.html` plus any images — a client can re-host it under
   their own Netlify/Vercel/host with zero cleanup. Nothing is tied to your machine or account.

---

## 9. Raising the bar later

The rubric is defined in one place per surface and is easy to tighten:

- **Thresholds & checks** live in `scorer.js` (and an identical inlined copy inside `index.html`, in the
  `<script id="scorer">` block). Each check is `{ name, points, earned, detail }`. To demand more — say,
  4+ glass surfaces instead of 3, or a minimum body-copy length — edit the `earned` condition. If you
  change `scorer.js`, mirror the change in the inlined copy so the app and the CLI agree.
- **What the model is told to build** lives in `window.GF_SYSTEM_PROMPT` inside `index.html`
  (`<script id="prompts">`). It contains the rubric verbatim plus the hook contract
  (`data-reveal`, `data-parallax`, `data-tilt`, `data-magnetic`, `data-counter`) that the scorer probes.
  Add a requirement here (e.g. "include a pricing section", "use a specific font") and every future site
  inherits it.
- **Pass bar** is `total >= 22 && every category >= 3` — change those two numbers in the `score()` return
  (both copies) to raise or relax the standard.
- **Attempt cap** is the `while (attempts < 5)` in the app's `selfTestLoop`. Raise it for more auto-fix
  rounds per site (costs more API calls).

---

## Honest notes on this environment

- The proof sample was verified with a **real headless Chromium** (Playwright) rendering the live DOM,
  not by re-reading the code. Screenshots are in `out/`.
- The generator supports four engines — **Local (Ollama), Groq, Google Gemini, Anthropic** — with live
  model discovery for each. The streaming call paths are built to each provider's documented API (Ollama
  native `/api/chat`; Groq/Gemini/Anthropic cloud), key held in memory, browser-direct. Running a real
  generation needs your chosen engine set up (a local Ollama model, or a provider key). Everything around
  it — provider/model switching, render, score, self-test loop, chat wiring, Edit mode, download — was
  smoke-tested headless and passes (`smoke_provider.py`, `smoke_app.py`, `smoke_edit.py`).
- The sample was **deployed to Vercel** to prove the deploy path. The build was accepted, but this Vercel
  account has **Deployment Protection on project-wide**, so the URL is gated behind a Vercel login and
  isn't publicly viewable yet. That's a one-toggle fix (Section 5, Option B), or use Netlify Drop which is
  public by default. Because of the gate, the live-URL rubric run in Section 7 could not be completed
  against a public URL here — the byte-identical file scores 25/25 locally, and `verify.py` is ready to run
  against the live URL the moment it's public.
