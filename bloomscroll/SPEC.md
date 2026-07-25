# BLOOMSCROLL — Megaprompt for Claude Code

Paste this whole thing into Claude Code as your first message in the project folder. If it feels like a lot, tell Claude Code: "Read this whole spec, then start with Phase 0 and stop for my review after each phase." That keeps it from running off and building the wrong thing for two hours.

---

## WHAT THIS IS

Bloomscroll is a web app that fact-checks health and appearance claims from social media — the "mewing fixes your jawline," "this supplement changes everything," looksmaxxing-style content that teenagers scroll past and absorb uncritically. You paste a link (YouTube, TikTok, Reddit, or any article) or paste text directly. The app pulls out the actual checkable claims, searches real biomedical/scientific literature for evidence, and shows you what the evidence actually supports — clearly labeled by how strong that evidence is, with real clickable citations.

It is built by a high school student, for a 72-hour hackathon (TKS Prompt to Product Challenge), and needs to feel like a real, considered product — not a hackathon toy, and not a generic AI-tool template.

The name matters: it's the opposite of doomscrolling. Not "stop scrolling" — scrolling but growing instead of numbing out.

---

## PART 1 — DESIGN DIRECTION

Do not reach for a fixed palette I hand you. I want you to design this the way a small studio would design a distinctive product, not the way most AI-assisted builds default. Specifically avoid these three patterns, which are the current AI-generated-design tells:

1. Warm cream background with a high-contrast serif and a terracotta/clay accent.
2. Near-black background with a single bright acid-green or neon-purple/violet accent.
3. Broadsheet/newspaper style with hairline rules, zero border radius, dense columns.

All three are legitimate starting points for *some* brief, but they show up regardless of subject, which is the problem. I want a palette and type system that comes from the actual subject matter of this product: the tension between mindless scrolling and genuine evidence, between anxiety-inducing certainty ("this ONE trick") and calm, graded truth. Think about what that tension actually looks like visually — not what a generic "AI app" looks like.

**Work in two passes, and show me the first pass before writing code:**

**Pass 1 — plan.** Give me:
- **Color**: 4–6 named hex values with a one-line reason each, grounded in the bloom/growth-vs-scroll concept.
- **Type**: a display face used with restraint, a body face, and a utility/data face for citations and evidence tags. Pair faces deliberately — not the defaults you'd reach for on any other project.
- **Layout**: one-sentence description plus a rough ASCII wireframe of the main screen (input → status → claim cards).
- **Signature element**: the one thing this page will be remembered by. This should tie to "bloom" concretely — for example, how a claim visually resolves from raw and uncertain into something structured and graded, in a way that feels like something opening up, not a generic loading spinner. You decide the actual mechanic; make it specific to this product.

**Pass 2 — self-critique.** Before touching code, check your own plan: does any part of it read as the generic default you'd produce for a similar prompt? If so, revise it and tell me what changed and why. Only then start building, and derive every color/spacing/type decision from the revised plan — don't drift back to defaults mid-build.

**Restraint rule:** spend your one bold idea on the signature element. Everything else — spacing, secondary color use, supporting type — should be quiet and disciplined around it. If in doubt, cut an accessory rather than add one.

---

## PART 2 — LOGO

Design a simple mark, not a mascot. It needs to work as a favicon at 16px and as a loading/status indicator (it will animate briefly during the "checking" state, so keep it simple enough to animate well). Build it as an inline SVG so it can be recolored and animated with CSS, not a static image file.

Concept direction: something that visually bridges "scroll" and "bloom" — a shape that could be read as an opening/unfurling form, or as a subtle nod to a feed/scroll turning into something growing. I'm not going to specify the exact shape — that's the signature-element thinking from Part 1, applied to the mark itself. Avoid: literal flowers, generic checkmarks, generic magnifying glasses, generic AI-sparkle icons. Show me 2–3 directions in code (SVG in the browser) before we commit to one.

---

## PART 3 — MOTION

Motion should serve the *contrast* this product is built on: the frantic, dopamine-loop feeling of a doomscroll feed versus the settled, confident feeling of seeing real evidence. Don't animate everything — pick a small number of moments that matter and make them land:

- The transition from "paste something in" to "here's what we found" should feel like a shift in pace — quick urgency while it's working, then a settling/composing motion when results land. This is your one orchestrated moment; make it count.
- Verdict badges (supported / mixed / weak / no evidence / not a testable claim) can have a small, restrained entrance — not a bounce-fest.
- Respect `prefers-reduced-motion` throughout — fall back to instant, clean state changes.
- No decorative background animation, no particle effects, no gradient shifting for its own sake. If an animation doesn't communicate progress or a state change, cut it.

---

## PART 4 — FUNCTIONAL BUILD, IN ORDER

Build and check in after each phase. Stack: Next.js 14 + TypeScript + Tailwind, deployed on Vercel. Anthropic API (model: claude-sonnet-4-6) for the AI steps. Europe PMC REST API for literature retrieval — no key required. Keep the API key server-side only, never in client code.

### Phase 0 — Scaffold and deploy
Create the Next.js app. One home page: input field with placeholder "Paste a link, or paste the claim itself," a submit action, and an empty results area below. One API route at `/api/check` that currently returns mock JSON. Deploy to Vercel immediately and confirm the live URL loads on both desktop and mobile browsers before moving on. Getting something live now matters more than getting it right — we can only improve on something that's already deployed.

### Phase 1 — Content resolver
Write `resolveContent(input: string)` in `/lib/resolve.ts`:
- If input is a YouTube URL → fetch the caption/transcript track, return `{ text, title, source: "youtube" }`.
- If input is a TikTok URL → call the public oEmbed endpoint (`tiktok.com/oembed?url=...`) and use the returned caption/title field as text, `source: "tiktok"`.
- If input is a reddit.com URL → append `.json` to the URL, fetch, and pull the post title plus body text, `source: "reddit"`.
- If input is any other URL → fetch the page and extract the main readable text (strip nav/ads/boilerplate), `source: "article"`.
- If input is not a URL at all → treat it as raw text directly, `source: "pasted"`.
- Every failure path returns a typed, specific error (no captions found / private or unavailable / couldn't extract text) rather than throwing. The UI needs to show a helpful message per failure type, especially "this platform blocked us — paste the caption instead."

Test each branch by hand with a real link before moving on.

### Phase 2 — Claim extraction
Write `extractClaims(text)` calling the Anthropic API. System instruction: extract up to 3 factual claims that are checkable against scientific literature, prioritizing health, body, and appearance claims. For each claim return: the claim itself in one plain sentence, a category (`biomedical` / `general_scientific` / `not_empirical`), and 2–4 proper clinical/scientific search terms — translate slang into real terminology (e.g. "mewing" → tongue posture, orofacial myofunctional therapy; "bone smashing" → bone remodeling, mechanical loading, Wolff's law). Return strict JSON only, no markdown fences. Parse defensively; retry once on malformed output.

### Phase 3 — Literature retrieval
Write `searchLiterature(searchTerms)` querying Europe PMC's REST search endpoint (`https://www.ebi.ac.uk/europepmc/webservices/rest/search`, `format=json`). Run 2 query variants per claim, dedupe results, return `{ id, title, abstract, year, journal, url, pubType }[]`. Return an empty array cleanly (not an error) when nothing is found — that's a valid, meaningful result, not a failure.

### Phase 4 — Evidence grading (anti-hallucination is non-negotiable here)
Write `gradeClaim(claim, papers)` calling the Anthropic API. Give it the claim plus a **numbered list** of the retrieved abstracts. It must return: a `verdict` — one of `supported`, `mixed`, `weak`, `no_evidence`, `not_empirical` — a 2–3 sentence `summary` that names the actual evidence type ("one small study in mice suggests..." not "studies show"), and `citation_ids` referencing ONLY indices from the numbered list you gave it. Explicitly instruct it: it may never invent a title, author, journal, or ID that isn't in the provided list. In code, after the response comes back, validate every citation index actually exists in the retrieved set before you ever render it — treat this as a hard gate, not a nice-to-have. A fabricated citation is the single worst failure this product can have; a judge who clicks a fake link ends the demo.

### Phase 5 — Pipeline wiring + streaming
Chain resolve → extract → search → grade behind `/api/check`. Stream progress to the client via server-sent events with clear stages (reading the source → found N claims → searching the literature → weighing the evidence → done). Process claims in parallel where possible. Cache results by a hash of the input in memory so repeat checks (including your own demo runs) are instant and don't burn API calls.

### Phase 6 — Results UI
Each claim renders as a card: the claim in plain language, a colour-coded verdict badge (your palette from Part 1 should assign these deliberately, not default red/yellow/green), the evidence summary, and citations as real clickable links showing journal + year. Distinct, helpful empty states for: no captions found, platform blocked extraction, no literature found, and "this isn't a testable claim — it's an opinion" (this last one is a first-class result, not an error — style it as such).

### Phase 7 — Safety override layer
Hard-code a check that runs regardless of what retrieval found: if the claim matches known-harmful practices (self-injury adjacent, unregulated injectable substances, extreme dietary restriction, anything where "we didn't find much evidence either way" could be misread as permission), always show an explicit, clear warning — never let a `no_evidence` or `weak` verdict sit unqualified on something dangerous. This is a small, static list you maintain — not something you ask the model to decide live.

### Phase 8 — Access page (this is the actual point of the product, don't shortcut it)
A dedicated page that opens with three clear options — Android, iPhone, Desktop — each with real, working setup:
- **Android**: PWA manifest with a `share_target` entry, plus the route that receives an incoming share and runs the check automatically. Explain in one line: "Install once, then Bloomscroll shows up in your Share menu next to Messages and WhatsApp."
- **iPhone**: a pre-built Shortcut (built in the Shortcuts app, not code) that accepts shared text/links and opens the site with the content attached, distributed as an iCloud link on this page. Explain: "Add this once — it'll show up under Share → Shortcuts."
- **Desktop**: a bookmarklet — a `javascript:` link people drag to their bookmarks bar that grabs the current tab's URL and opens it in Bloomscroll.
State plainly, without apologizing, what isn't covered yet (Instagram blocks this kind of access for every third-party tool, not just this one) — that's a strength of the copy, not a weakness to hide.

### Phase 9 — Landing copy
Write the actual words for the homepage and access page following this voice: plain verbs, sentence case, no filler, no hype. Say what the product does, not what it "revolutionizes." Name a disclaimer clearly and once — this explains evidence, it doesn't diagnose or give medical advice — near the input, not buried in a footer. Every empty/error state should read like the product's own calm voice explaining what happened and what to do next, not a generic error string.

---

## QUALITY BAR — non-negotiable regardless of time pressure
- No fabricated citations, ever — the validation gate in Phase 4 is the most important line of code in this project.
- Fully responsive down to a real phone screen — this is a mobile-first product, test on your actual phone, not just resized desktop Chrome.
- Visible keyboard focus states; respect reduced-motion.
- Every claim gets an evidence-strength tier, never a bare true/false.
- Something deployed and live at all times after Phase 0 — never let the only working version live on localhost.

---

## HOW TO ACTUALLY USE THIS WITH CLAUDE CODE
Don't paste this and walk away for three hours. Paste it, let it do Part 1 (the design plan) first and react to that before any code gets written — cheap to redirect at that stage, expensive after. Then go phase by phase through Part 4, glancing at the deployed URL after each one. If it starts adding anything not in this spec (accounts, history, extra platforms, extra pages), redirect it back to scope — that's the single most likely way this goes over time budget.
