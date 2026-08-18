# Bloomscroll

## What it is

Bloomscroll fact-checks the health and appearance claims people scroll past —
"mewing fixes your jawline," "this supplement changed everything," looksmaxxing
content aimed at teenagers. A user pastes a link (YouTube, TikTok, Reddit, any
article) or types a claim; the app extracts the genuinely checkable claims,
searches real biomedical literature, and returns a verdict on a **five-tier
evidence scale** with real, clickable citations. Never a bare true/false. Built
by a high-school student (Vishvesh) with a cofounder (Arhaan) for the TKS
Prompt→Product challenge; now being taken toward a real launch.

Live: **https://getbloomscroll.com** · Repo: `VishveshShah1/bloomscroll`

## Stack & layout

Next.js 14 (App Router) + TypeScript + Tailwind, deployed on Vercel (auto-deploys
on push to `main`). Repo root holds two projects — **the app is in
`bloomscroll/`**, `glassforge/` is unrelated.

```
bloomscroll/
  app/            routes (App Router). page.tsx = landing, dashboard/ = the checker
  components/     React components (see file map)
  lib/            all logic — pipeline, AI calls, storage, i18n
  extension/      Chrome extension (MV3, separate from the Next app)
  public/brand/   logo assets (official TikTok/Reddit icons, comment button)
```

## The check pipeline

`lib/pipeline.ts` is the spine: **resolve → extract → search → grade**, an async
generator yielding stage events, streamed to the client over SSE from
`app/api/check/route.ts`.

- `lib/resolve.ts` — turns input into text. YouTube via the innertube player API
  (no key; page-scrape fallback), TikTok oEmbed, Reddit `.json`, generic article
  extraction, or raw pasted text. **Reddit 403s all non-browser fetches** — it
  returns a typed "paste the text instead" error by design.
- `lib/extract.ts` — Anthropic call. Pulls ≤3 checkable claims + clinical search
  terms (translates slang: "mewing" → "tongue posture").
- `lib/literature.ts` — Europe PMC REST search, no API key. Empty array is a
  valid result, not an error.
- `lib/grade.ts` — Anthropic call producing verdict + summary + citation ids.
- `lib/cache.ts` — in-memory LRU keyed by hash(input+lang).

## Anthropic API usage

Two stages, **two different models on purpose** (`lib/models.ts`):

| Stage | Env var | Default |
|---|---|---|
| extract | `BLOOMSCROLL_EXTRACT_MODEL` | `claude-haiku-4-5` |
| grade | `BLOOMSCROLL_GRADE_MODEL` | `claude-sonnet-4-6` |

Extraction is bounded/structured and runs on the full input (token-heavy), so it
uses the cheap model. Grading is the judgment the product rests on and stays on
the stronger one. `BLOOMSCROLL_MODEL` is retired — it warns if still set. Key is
`ANTHROPIC_API_KEY`, server-side only, never in client code.

Spend caps in `lib/spend.ts`: `SPEND_CAP_FREE_MONTHLY_USD` (10),
`SPEND_CAP_PAID_MONTHLY_USD` (25), `PAID_ALERT_THRESHOLD_RATIO` (0.8),
`CANOPY_USER_ALERT_USD` (15).

### The citation gate — do not weaken this

`validateCitations()` in `lib/grade.ts` drops any citation index that isn't in
the retrieved paper set (out of range, duplicate, non-numeric). Citation URLs
come from **our** retrieval, never from the model. This is the single most
important guarantee in the product — a judge clicking a fabricated link ends the
demo. It's a pure function and unit-testable without an API key.

## File map — likely edit targets

- `app/page.tsx` — landing page (~1300 lines): nav, hero, pipeline sections,
  verdict scale, pricing, FAQ, footer
- `components/PipelineArt.tsx` — the four big "how it works" SVG diagrams
  (paste / extract / search / grade). Most recent design work lives here.
- `components/Checker.tsx` — the real checker UI (dashboard)
- `lib/i18n.ts` — **all copy**, EN + FR. `Strings` type forces FR to match EN,
  so adding an EN key requires an FR one or the build fails.
- `app/globals.css` — `pa-*` keyframes for the diagrams, `.surface`, brand colors
- `app/terms|privacy|support/page.tsx` — legal/support pages

## Conventions

- **Brand colors** (hex, not Tailwind defaults): canvas `#F6F3EA`, moss `#E8EDDE`,
  forest `#1E4D2B`, sprout `#4A8B5A`, ink `#12201A`, bark `#5B6B5E`
- Copy voice: plain verbs, sentence case, no hype, no filler. Say what it does.
- Comments explain **why**, especially non-obvious fixes — keep them.
- SVG gotchas (both cost real debugging time): def ids must be slugs, never
  labels with spaces; a CSS keyframe `transform` **replaces** an SVG `transform`
  attribute, so animated groups need a separate parent `<g>` for positioning.
- **Never gate content visibility on JS.** An earlier version wrapped the page in
  `class="invisible"` until hydration and rendered blank. Animations enhance;
  they must never be the reason something is visible. Same rule for CSS
  animation `fill-mode: both` on entrance animations — a throttled/background tab
  freezes the clock and content stays at the invisible start frame.

## Build / run / test

```bash
cd bloomscroll
npm run dev      # localhost:3000 (this session used :3001 via .claude/launch.json)
npm run build    # full production build — run before pushing
npx tsc --noEmit # typecheck
```

No test suite. Verification is: typecheck → build → drive the page in a browser.
**Node is portable** at `C:\Users\vishv\tools\node` (no system install) — prefix
Bash with `export PATH="/c/Users/vishv/tools/node:$PATH"`.

## Decisions already made — don't re-litigate

1. **Five-tier verdicts, never true/false.** `no_evidence` and `not_empirical`
   are first-class results, and they legitimately cite nothing.
2. **Scroll-tinted background** (`components/ScrollBackground.tsx`) ramps cream →
   deep forest via `--scroll-tint`. Deep sections use the cream palette; long
   text pages (`/terms`, `/privacy`, `/support`) instead lay a fixed
   `rgba(246,243,234,0.58)` veil over it and use pure black text (measured 8.2:1
   worst case). A scroll-adaptive text color was tried and **rejected** — fading
   ink→cream passes through mid-grey at ~1.5:1, worse than either endpoint.
3. **Logos are real assets**, not redraws (`public/brand/`). Hand-drawn platform
   marks looked wrong at every size.
4. **Verdict tiles**: 6-col grid, each spanning 2, 4th starting at col 2 →
   centered last row; `auto-rows-fr` for equal heights.
5. **Reddit is unfixable server-side** — graceful typed error, not a retry loop.

## Known bugs / TODO

- **Upstash — verify before assuming it's broken.** `lib/kv.ts` falls back to an
  in-process Map when `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are
  unset; on serverless each instance gets its own empty Map, so usage counters
  and the review +3 bonus would silently reset. **Not reproducible from this
  repo:** there is no local `.env` (so localhost always uses the fallback), and
  the Vercel project that actually serves getbloomscroll.com belongs to Arhaan —
  a different project from `prj_vdS7...`, which is a stale early deploy and
  returns 403 for logs/env. Arhaan has said Upstash is connected on the real
  project. Confirm behaviourally (leave a review, hard-refresh, check the limit
  stays at 8) rather than inferring from the repo.
- **French is only half-wired.** `components/LangToggle.tsx` now exists and is
  in the nav on `/`, `/access`, `/terms`, `/privacy`, `/support`; `useLang`
  broadcasts a `bloom:lang` window event so every instance stays in sync.
  BUT ~48 visible strings are still hardcoded English, so a French visitor sees
  a mixed page. Remaining work, in order of visibility:
    1. `components/HeroPhoneAnimation.tsx` (851 lines) — the phone vignette.
       5 samples x ~9 fields (handle, caption, claim, verdictLabel, meaning,
       summary, 3 citations) plus UI chrome (THE CLAIM, EVIDENCE STRENGTH,
       CITED IN THE ANSWER, SHARE TO, "papers weighed"). Does not import i18n
       at all yet — it is a client component, so it can call `useLang()`
       directly rather than threading a prop.
    2. `components/PipelineArt.tsx` — SVG labels: SHARE TO, SOURCE READ,
       THE CAPTION, the Beat captions, claim chips, "matches"/"opens" flow
       labels.
    3. `app/page.tsx` — `DEMO_CLAIM`/`DEMO_SUMMARY` (~line 403), the step
       title "It searches the literature" (~line 609), and the four
       "See the … install guide" strings (~line 988).
  Add keys to BOTH dictionaries in `lib/i18n.ts` — the `Strings` type makes a
  missing FR key a build error, which is the safety net.
- Legal copy on `/terms` and `/privacy` is hardcoded English in `SECTIONS`
  arrays, not i18n. The toggle switches those pages' chrome but not the body.
  Either translate it or hide the toggle there.
- The real checker (`components/Checker.tsx`) doesn't match the landing page's
  input styling.
- Step 04 citation numbers should slide up and stay, replaying only on tier
  change (partially done; verify after the recent rebase).
- Preview-pane caveat: the browser tab runs `document.hidden = true`, which
  **freezes CSS animation clocks**. Entrance animations always read opacity 0
  there. Verify via the Web Animations API (`getAnimations()`, set
  `currentTime`), not by reading computed opacity.

## Chrome Web Store status

Done: domain (getbloomscroll.com), dev account + $5 fee, listing copy in
`extension/STORE_LISTING.md`, single-purpose statement, permission
justifications, data-disclosure answers (**Website content + Web history only** —
not the nine boxes originally ticked), privacy policy URL, extension origin
migration (stale `*.vercel.app` origins are dropped on update — an existing
install must be reloaded at `chrome://extensions`).

Open: screenshots at 1280×800 (most common rejection cause), final submit.

## Next steps

1. Set up Upstash and add the two env vars in Vercel — the only real launch
   blocker.
2. Finish the three open UI items above (EN/FR everywhere, checker styling,
   citation slide).
3. Capture Web Store screenshots and submit.

**Workflow:** commit at the end of any turn that changes working code; push only
when Vishvesh says "push it live." Arhaan works in the same repo — `git pull
--rebase` before starting, and commit local work first so a rebase can't lose it.
