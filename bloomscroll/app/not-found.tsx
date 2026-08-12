import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import type { Verdict } from "@/lib/types";
import { VERDICT_TINT } from "@/lib/verdicts";

/**
 * Custom 404, built as a fact-check verdict card — the product's own format
 * turned on itself. The claim under review is "This page exists." and the
 * grade is the site's no-evidence tier.
 *
 * Deliberately a SERVER component. The three interactive moments are driven
 * by one scoped inline script rather than "use client", which buys three
 * things the client-component version can't have:
 *
 *   1. Every word ships in the SSR HTML. Nothing is gated behind a JS
 *      visibility flag, so the page is complete with scripting disabled.
 *   2. `metadata` can be exported (a "use client" file cannot export it).
 *   3. Zero client bundle for a page that is mostly static.
 *
 * With JS off: all copy is visible, the spiral still draws (pure CSS), the
 * badge is an inert button, and the card doesn't tilt. Nothing disappears.
 *
 * Everything here is local to this file — no shared component, no global
 * CSS, no config, no new dependency. The <style> block is required because
 * keyframes and prefers-reduced-motion cannot be expressed as inline styles;
 * every selector is prefixed `nf404-` so it cannot reach another route.
 *
 * Colors come from the real tokens (tailwind.config.ts) and VERDICT_TINT
 * rather than re-typed hex, so a palette change follows automatically.
 */

export const metadata: Metadata = {
  title: "404 · no evidence found",
};

/**
 * English verdict labels, mirroring STRINGS.en.verdictLabels in lib/i18n.ts.
 * Duplicated deliberately rather than imported: that module exports the
 * `useLang` hook, so importing it would force this whole page into a client
 * component and cost the server-rendered, JS-optional guarantee above.
 * Five short strings is the cheaper trade. Keep in sync if the labels change.
 */
const VERDICT_LABEL: Record<Verdict, string> = {
  supported: "Supported",
  mixed: "Mixed evidence",
  weak: "Weak evidence",
  no_evidence: "No evidence found",
  not_empirical: "Not a testable claim",
};

/** Cycle order for the badge easter egg. Starts and ends on no_evidence so
 *  the page's real verdict is both the initial and the resting state. */
const CYCLE: Verdict[] = ["no_evidence", "supported", "mixed", "weak", "not_empirical"];

/** One-liner shown under each verdict. The no_evidence entry is the page's
 *  actual copy; the rest are the same joke told at other grades. */
const BODY: Record<Verdict, string> = {
  no_evidence:
    "No sources, no citations, nothing in the literature. Either the link is wrong or the page never existed. We'd rather say so than guess.",
  supported:
    "Someone linked here once, so the claim did have a source. That source is a 404 too.",
  mixed:
    "The URL looks entirely plausible. The server disagrees. Both positions are well represented.",
  weak: "One broken bookmark and a hopeful guess do not constitute a body of evidence.",
  not_empirical:
    "Whether a page truly \"exists\" turns out to be a question for philosophers, not for PubMed.",
};

const DEFAULT: Verdict = "no_evidence";
const v0 = VERDICT_TINT[DEFAULT];

// Serialised for the inline script: label, glyph and the three colors per
// tier, plus the body copy. Read from the same constants the server just
// rendered, so the cycle can never drift from the initial paint.
const CYCLE_DATA = CYCLE.map((k) => ({
  label: VERDICT_LABEL[k],
  glyph: VERDICT_TINT[k].glyph,
  bg: VERDICT_TINT[k].bg,
  fg: VERDICT_TINT[k].text,
  bd: VERDICT_TINT[k].border,
  body: BODY[k],
}));

const SCRIPT = `
(function () {
  var data = ${JSON.stringify(CYCLE_DATA)};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- 1. badge cycles through the verdict scale --- */
  var badge = document.getElementById('nf404-badge');
  var glyph = document.getElementById('nf404-glyph');
  var label = document.getElementById('nf404-label');
  var body  = document.getElementById('nf404-body');
  if (badge && glyph && label && body) {
    var i = 0;
    badge.addEventListener('click', function () {
      i = (i + 1) % data.length;
      var d = data[i];
      badge.style.background = d.bg;
      badge.style.color = d.fg;
      badge.style.borderColor = d.bd;
      glyph.textContent = d.glyph;
      label.textContent = d.label;
      body.textContent = d.body;
    });
  }

  /* --- 2. card tilts toward the pointer. Fine pointers only, and never
         when the user asked for reduced motion. --- */
  var card = document.getElementById('nf404-card');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (card && fine && !reduce) {
    var MAX = 4.5;
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--nf-ry', ((px - 0.5) * 2 * MAX).toFixed(2) + 'deg');
      card.style.setProperty('--nf-rx', ((0.5 - py) * 2 * MAX).toFixed(2) + 'deg');
      card.style.setProperty('--nf-mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--nf-my', (py * 100).toFixed(1) + '%');
      card.style.setProperty('--nf-sheen', '1');
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--nf-ry', '0deg');
      card.style.setProperty('--nf-rx', '0deg');
      card.style.setProperty('--nf-sheen', '0');
    });
  }
})();
`;

const STYLE = `
/* Spiral draws itself in, reading as the page searching and then stopping.
   pathLength="1" normalises the geometry so the dash maths is exact. */
.nf404-spiral path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: nf404-draw 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes nf404-draw {
  to { stroke-dashoffset: 0; }
}

/* Tilt + sheen are driven by custom properties the script sets. Defaults
   are the neutral resting state, so with no JS the card simply sits flat
   and the sheen stays fully transparent. */
.nf404-card {
  transform: rotateX(var(--nf-rx, 0deg)) rotateY(var(--nf-ry, 0deg));
  transform-style: preserve-3d;
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}
.nf404-sheen {
  background: radial-gradient(
    240px circle at var(--nf-mx, 50%) var(--nf-my, 50%),
    rgba(255, 255, 255, 0.55),
    rgba(255, 255, 255, 0) 62%
  );
  opacity: var(--nf-sheen, 0);
  transition: opacity 220ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .nf404-spiral path {
    animation: none;
    stroke-dashoffset: 0;
  }
  .nf404-card {
    transform: none;
    transition: none;
  }
  .nf404-sheen {
    display: none;
  }
}
`;

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      <nav className="border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="focus-ring rounded-md">
            <Wordmark className="text-[22px]" />
          </Link>
          <Link
            href="/"
            className="focus-ring text-[14px] font-semibold text-bark transition hover:text-ink"
          >
            ← home
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[640px] px-5 py-16 sm:px-8 sm:py-24">
        {/* 1 — the digits, middle 0 drawn as the fern spiral. aria-label
            carries "404" so the meaning survives even though the middle
            character is a graphic. */}
        <h1
          aria-label="404"
          className="flex items-center justify-center gap-1 leading-[0.9] tracking-display text-ink"
          style={{ fontSize: "clamp(72px, 14vw, 130px)" }}
        >
          <span aria-hidden="true" className="font-semibold">
            4
          </span>
          <svg
            aria-hidden="true"
            className="nf404-spiral"
            viewBox="0 0 68 76"
            fill="none"
            style={{ height: "1em", width: "auto" }}
          >
            <path
              pathLength={1}
              d="M46 12 C 28 3, 8 17, 8 38 C 8 57, 23 70, 39 70 C 54 70, 62 58, 62 46 C 62 34, 52 26, 43 26 C 34 26, 28 33, 28 41 C 28 47, 33 52, 39 52"
              stroke="#1E4D2B"
              strokeWidth={7}
              strokeLinecap="round"
            />
          </svg>
          <span aria-hidden="true" className="font-semibold">
            4
          </span>
        </h1>

        {/* 2 — the site's signature micro-label */}
        <p className="mt-5 text-center text-[10.5px] font-semibold uppercase tracking-[0.16em] text-bark">
          checked just now · 0 results
        </p>

        {/* 3 — the verdict card. perspective lives on the wrapper so the
            tilt has somewhere to project into. */}
        <div className="mt-10" style={{ perspective: "900px" }}>
          <div id="nf404-card" className="nf404-card surface relative overflow-hidden p-7 sm:p-9">
            <span
              aria-hidden="true"
              className="nf404-sheen pointer-events-none absolute inset-0"
            />

            <div className="relative">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-bark">
                the claim
              </p>
              <p className="mt-2 text-[22px] font-semibold leading-snug text-ink sm:text-[26px]">
                &ldquo;This page exists.&rdquo;
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                {/* Same chip treatment as the homepage VerdictChip, but as a
                    real <button> so it's clickable and keyboard operable.
                    Enter/Space come free from the native button. */}
                <button
                  type="button"
                  id="nf404-badge"
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] shadow-[0_2px_6px_rgba(18,32,26,0.08)]"
                  style={{ background: v0.bg, color: v0.text, borderColor: v0.border }}
                >
                  <span aria-hidden="true" id="nf404-glyph" className="text-[13px] leading-none">
                    {v0.glyph}
                  </span>
                  <span id="nf404-label" aria-live="polite">
                    {VERDICT_LABEL[DEFAULT]}
                  </span>
                </button>
                <span className="text-[11px] text-bark">tap the badge</span>
              </div>

              <p
                id="nf404-body"
                aria-live="polite"
                className="mt-5 text-[15.5px] leading-relaxed text-bark"
              >
                {BODY[DEFAULT]}
              </p>

              <div className="mt-7 border-t border-ink/10 pt-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-bark">
                  0 sources cited · status 404
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 — the two ways out */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-primary focus-ring">
            Back to home
          </Link>
          <Link href="/" className="btn-ghost focus-ring">
            Check a claim
          </Link>
        </div>

        {/* 5 — the footer line the previous 404 carried */}
        <p className="mt-14 text-center text-[12px] text-bark">
          © 2026 Bloomscroll. All rights reserved.
        </p>
      </main>

      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </div>
  );
}
