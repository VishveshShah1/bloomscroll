"use client";

import { useEffect, useState } from "react";

/**
 * The hero phone. What it shows, in order, is exactly the real-world use
 * case: you're scrolling short-form video, someone makes a health claim,
 * you tap Share → Bloomscroll, and the graded verdict lands on top.
 *
 *   1. video-post plays with a claim in the caption
 *   2. a tap dot lands on the Share icon
 *   3. a share sheet slides up with Bloomscroll highlighted
 *   4. the checking state slides in from the bottom
 *   5. the verdict card resolves, badge glows briefly
 *   6. a long hold so the whole card is actually readable
 *   7. fade, next sample
 *
 * No API call, no video file. Pure React state driving CSS. The action
 * icons on the right are intentionally generic silhouettes so we're not
 * imitating a specific platform's mark. `prefers-reduced-motion` skips
 * straight to the final verdict frame with no loop.
 */

type Phase = "post" | "share" | "checking" | "verdict" | "hold";

type VerdictKey = "supported" | "weak" | "mixed";

interface Sample {
  handle: string;
  caption: string;
  /** Which stylized background to render for this "video" */
  scene: "sunscreen" | "mewing" | "cold";
  claim: string;
  verdict: VerdictKey;
  verdictLabel: string;
  meaning: string;
  summary: string;
  citations: { title: string; meta: string }[];
}

const SAMPLES: Sample[] = [
  {
    handle: "@holistic.md",
    caption: "your dermatologist won't say this but daily spf > every serum 🌞",
    scene: "sunscreen",
    claim: "Daily sunscreen use reduces long-term skin cancer risk.",
    verdict: "supported",
    verdictLabel: "SUPPORTED",
    meaning: "Multiple decent studies point the same way.",
    summary:
      "Randomized trials and large cohorts show daily broad-spectrum sunscreen lowers melanoma and squamous-cell risk.",
    citations: [
      { title: "Reduced melanoma after regular sunscreen use", meta: "J Clin Oncol · 5000+ citations" },
      { title: "Prolonged prevention of squamous cell carcinoma", meta: "Cancer Epidemiol · long follow-up" },
    ],
  },
  {
    handle: "@jaw.doc",
    caption: "day 47 of mewing — real doctors dont want you to know this 💪",
    scene: "mewing",
    claim: "Mewing reshapes the adult jawline.",
    verdict: "weak",
    verdictLabel: "WEAK EVIDENCE",
    meaning: "Something exists, but it's thin.",
    summary:
      "Only small observational papers. No controlled trials in adults measured lasting jaw-shape change.",
    citations: [
      { title: "Tongue posture and craniofacial morphology", meta: "Angle Orthod · 42 subjects" },
    ],
  },
  {
    handle: "@wellness.rn",
    caption: "3-min ice bath is basically a fat burner, no gym needed 🥶",
    scene: "cold",
    claim: "Cold plunges accelerate fat loss.",
    verdict: "mixed",
    verdictLabel: "MIXED EVIDENCE",
    meaning: "Real studies exist, and they disagree.",
    summary:
      "Cold exposure boosts brown-fat activity modestly. Total-fat outcomes are inconsistent across trials.",
    citations: [
      { title: "Cold exposure and brown adipose activation", meta: "J Clin Endocrinol Metab" },
      { title: "Cold-water immersion and body composition", meta: "Sports Med · systematic review" },
    ],
  },
];

const VERDICT_TONE: Record<
  VerdictKey,
  { bg: string; text: string; border: string; glow: string; glyph: string }
> = {
  supported: {
    bg: "#1E4D2B",
    text: "#F6F3EA",
    border: "#1E4D2B",
    glow: "rgba(30,77,43,0.55)",
    glyph: "✓",
  },
  weak: {
    bg: "#B45A34",
    text: "#FBEDDE",
    border: "#8B4322",
    glow: "rgba(180,90,52,0.55)",
    glyph: "△",
  },
  mixed: {
    bg: "#B78628",
    text: "#FDF7E6",
    border: "#8F6712",
    glow: "rgba(183,134,40,0.55)",
    glyph: "≈",
  },
};

// Meaningfully slower — each state gets time to actually be read.
const TIMING: Record<Phase, number> = {
  post: 3200,
  share: 2200,
  checking: 2600,
  verdict: 5500,
  hold: 2800,
};
const PHASE_ORDER: Phase[] = ["post", "share", "checking", "verdict", "hold"];

export default function HeroPhoneAnimation() {
  const [reduced, setReduced] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("post");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) {
      setPhase("verdict");
      return;
    }
    setPhase("post");
    const timers: number[] = [];
    let acc = 0;
    for (let i = 0; i < PHASE_ORDER.length - 1; i++) {
      acc += TIMING[PHASE_ORDER[i]];
      const next = PHASE_ORDER[i + 1];
      timers.push(window.setTimeout(() => setPhase(next), acc));
    }
    // Finally, after the hold, advance the sample.
    acc += TIMING.hold;
    timers.push(
      window.setTimeout(
        () => setSampleIndex((n) => (n + 1) % SAMPLES.length),
        acc,
      ),
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [reduced, sampleIndex]);

  const sample = SAMPLES[sampleIndex];
  const tone = VERDICT_TONE[sample.verdict];

  const showShareSheet = phase === "share";
  const showTapOnShare = !reduced && phase === "share";
  const showVerdictLayer =
    reduced || phase === "checking" || phase === "verdict" || phase === "hold";
  const verdictSlide = phase === "checking" ? "slide-in" : "settled";

  return (
    <div className="hero-phone" aria-hidden="true">
      <div className="hp-body">
        <div className="hp-glass">
          <div className="hp-notch" />

          {/* Status bar — sits in its own dedicated strip; content below
              starts under a padding that clears the notch entirely. */}
          <div className="hp-status">
            <span className="hp-time">9:41</span>
            <span className="hp-status-right">
              <span className="hp-signal">
                <i /><i /><i /><i />
              </span>
              <span className="hp-battery"><span /></span>
            </span>
          </div>

          {/* Video-post scene (background) */}
          <div className="hp-post">
            <VideoBackground scene={sample.scene} />
            {/* progress bars up top like a story/reel */}
            <div className="hp-story-progress">
              <span />
              <span />
              <span className="is-current" />
            </div>
            {/* REC pill — reinforces "this is a live video someone
                is watching" without needing real footage. */}
            <span className="hp-rec">
              <span className="hp-rec-dot" />
              LIVE
            </span>
            {/* right-side action rail (generic silhouettes, non-branded) */}
            <div className="hp-actions">
              <ActionIcon kind="heart" label="12.4k" />
              <ActionIcon kind="comment" label="892" />
              <ActionIcon
                kind="share"
                label="share"
                highlight={showTapOnShare}
              >
                {showTapOnShare && <span className="hp-tap-dot" />}
              </ActionIcon>
              <ActionIcon kind="save" label="save" />
            </div>
            {/* Caption + author. Small audio-bars next to the handle
                signal "they're talking right now" — the third visual cue
                (with REC + progress bar) that this is a live video. */}
            <div className="hp-caption">
              <div className="hp-caption-head">
                <span className="hp-avatar">{sample.handle[1]?.toUpperCase() ?? "•"}</span>
                <span className="hp-handle">{sample.handle}</span>
                <span className="hp-audio" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="hp-follow">Follow</span>
              </div>
              <p key={`cap-${sampleIndex}`} className="hp-caption-text hp-fade">
                {sample.caption}
              </p>
            </div>
          </div>

          {/* Share sheet (slides up during 'share' phase) */}
          <div className={`hp-sheet-scrim ${showShareSheet ? "on" : ""}`} />
          <div className={`hp-sheet ${showShareSheet ? "on" : ""}`}>
            <div className="hp-sheet-handle" />
            <p className="hp-sheet-title">Share to</p>
            <div className="hp-sheet-row">
              <SheetIcon kind="msg" />
              <SheetIcon kind="mail" />
              <SheetIcon kind="bloom" highlight />
              <SheetIcon kind="copy" />
            </div>
            <div className="hp-sheet-labels">
              <span>Messages</span>
              <span>Mail</span>
              <span className="is-active">Bloomscroll</span>
              <span>Copy</span>
            </div>
          </div>

          {/* Verdict panel — slides up from bottom during checking, settles
              through verdict + hold. */}
          <div
            key={`v-${sampleIndex}`}
            className={`hp-verdict-layer ${
              showVerdictLayer ? "in" : ""
            } ${verdictSlide}`}
          >
            {phase === "checking" && !reduced ? (
              <div className="hp-checking">
                <div className="hp-checking-head">
                  <span className="hp-spinner" />
                  <span className="hp-checking-title">Checking the literature…</span>
                </div>
                <div className="hp-checking-rows">
                  <span>reading the caption</span>
                  <span className="delay-1">searching europe pmc</span>
                  <span className="delay-2">weighing the evidence</span>
                </div>
              </div>
            ) : (
              <div className="hp-verdict">
                <p className="hp-verdict-label">THE CLAIM</p>
                <p className="hp-verdict-claim">&ldquo;{sample.claim}&rdquo;</p>
                <div className="hp-verdict-row">
                  <span
                    className={`hp-badge ${
                      phase === "verdict" && !reduced ? "is-resolving" : ""
                    }`}
                    style={
                      {
                        background: tone.bg,
                        color: tone.text,
                        borderColor: tone.border,
                        // exposed for the pulse keyframe
                        ["--verdict-glow"]: tone.glow,
                      } as React.CSSProperties
                    }
                  >
                    <span aria-hidden="true">{tone.glyph}</span>
                    {sample.verdictLabel}
                  </span>
                  <span className="hp-verdict-meaning">{sample.meaning}</span>
                </div>
                <p className="hp-verdict-summary">{sample.summary}</p>
                <p className="hp-cited-label">CITED IN THE ANSWER</p>
                <ul className="hp-cited-list">
                  {sample.citations.map((c, i) => (
                    <li key={c.title} className="hp-cited-item">
                      <span className="hp-cited-num">{i + 1}</span>
                      <span className="hp-cited-body">
                        <span className="hp-cited-title">{c.title}</span>
                        <span className="hp-cited-meta">{c.meta}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="hp-home" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components — the video background and the icon silhouettes.    */

function VideoBackground({ scene }: { scene: Sample["scene"] }) {
  if (scene === "sunscreen") {
    return (
      <svg viewBox="0 0 400 720" className="hp-video-bg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hv-sun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7B67C" />
            <stop offset="60%" stopColor="#E68B58" />
            <stop offset="100%" stopColor="#6C3A24" />
          </linearGradient>
          <radialGradient id="hv-sun-glow" cx="0.75" cy="0.15" r="0.55">
            <stop offset="0%" stopColor="#FFE8B5" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFE8B5" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="720" fill="url(#hv-sun)" />
        <rect width="400" height="720" fill="url(#hv-sun-glow)" />
        {/* silhouette shoulders / face */}
        <ellipse cx="200" cy="430" rx="150" ry="180" fill="#3A1F14" opacity="0.6" />
        <circle cx="200" cy="300" r="90" fill="#2C1810" opacity="0.7" />
        <circle cx="278" cy="126" r="34" fill="#FFF3CE" opacity="0.85" />
      </svg>
    );
  }
  if (scene === "mewing") {
    return (
      <svg viewBox="0 0 400 720" className="hp-video-bg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hv-mew" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D3844" />
            <stop offset="70%" stopColor="#1B2129" />
            <stop offset="100%" stopColor="#0B0E12" />
          </linearGradient>
        </defs>
        <rect width="400" height="720" fill="url(#hv-mew)" />
        {/* side-profile silhouette — bathroom-mirror selfie vibe */}
        <path
          d="M120 720 L120 300 C120 220 170 160 240 160 L290 160 Q310 175 300 210 L280 260 Q270 300 250 320 L235 360 Q225 400 250 430 Q265 445 260 470 L260 720 Z"
          fill="#0D1116"
          opacity="0.85"
        />
        {/* mirror shine */}
        <rect x="20" y="80" width="4" height="560" fill="#8FA6C0" opacity="0.25" />
      </svg>
    );
  }
  // cold plunge
  return (
    <svg viewBox="0 0 400 720" className="hp-video-bg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="hv-cold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7DB6C6" />
          <stop offset="60%" stopColor="#3E6C7A" />
          <stop offset="100%" stopColor="#122229" />
        </linearGradient>
      </defs>
      <rect width="400" height="720" fill="url(#hv-cold)" />
      {/* torso silhouette in ice water */}
      <ellipse cx="200" cy="260" r="70" fill="#0D1E24" opacity="0.75" />
      <path
        d="M100 720 L100 460 C120 400 180 380 200 380 C220 380 280 400 300 460 L300 720 Z"
        fill="#0D1E24"
        opacity="0.85"
      />
      {/* water surface highlights */}
      <ellipse cx="200" cy="470" rx="180" ry="14" fill="#B4D8E4" opacity="0.35" />
      <ellipse cx="130" cy="480" rx="60" ry="4" fill="#E6F1F6" opacity="0.6" />
      <ellipse cx="300" cy="482" rx="45" ry="3" fill="#E6F1F6" opacity="0.5" />
    </svg>
  );
}

function ActionIcon({
  kind,
  label,
  highlight,
  children,
}: {
  kind: "heart" | "comment" | "share" | "save";
  label: string;
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  const paths: Record<typeof kind, React.ReactNode> = {
    heart: (
      <path
        d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z"
        strokeWidth="1.7"
      />
    ),
    comment: (
      <path
        d="M4 5h16v11H8l-4 4V5z"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
    share: (
      <path
        d="M5 12h11M12 6l6 6-6 6"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    save: (
      <path
        d="M6 4h12v18l-6-4-6 4V4z"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
  };
  return (
    <div className={`hp-action ${highlight ? "is-highlight" : ""}`}>
      <div className="hp-action-btn">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor">
          {paths[kind]}
        </svg>
        {children}
      </div>
      <span className="hp-action-label">{label}</span>
    </div>
  );
}

function SheetIcon({ kind, highlight }: { kind: "msg" | "mail" | "bloom" | "copy"; highlight?: boolean }) {
  return (
    <div className={`hp-sheet-icon ${highlight ? "is-active" : ""}`}>
      {kind === "msg" && (
        <svg viewBox="0 0 24 24" fill="#4CD964"><path d="M3 5.5C3 4.7 3.7 4 4.5 4h15c.8 0 1.5.7 1.5 1.5v10c0 .8-.7 1.5-1.5 1.5H8.6L4 21V5.5z" /></svg>
      )}
      {kind === "mail" && (
        <svg viewBox="0 0 24 24" fill="#5AC8FA">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M4 7l8 6 8-6" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {kind === "bloom" && (
        <svg viewBox="0 0 24 24" fill="#F6F3EA">
          <rect width="24" height="24" rx="6" fill="#F6F3EA" />
          <path
            d="M 8 4 L 8 14 C 8 19, 15 20, 16 15 C 16.5 12, 12.5 10, 11 12 C 10 13, 11 15, 12 15"
            stroke="#1E4D2B"
            strokeWidth="1.9"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {kind === "copy" && (
        <svg viewBox="0 0 24 24" fill="#A5AAAD">
          <rect x="4" y="6" width="12" height="14" rx="2" />
          <rect x="8" y="3" width="12" height="14" rx="2" fill="#8E9296" />
        </svg>
      )}
    </div>
  );
}
