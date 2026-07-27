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
  /** Evidence-strength mini-chart data — 5 bars, 0–1 heights each,
   *  plus a total-papers count and a "check took" seconds figure.
   *  Drives the compact chart + metadata footer at the bottom of the
   *  verdict card so the panel doesn't leave empty white space when
   *  the citation list is short. */
  evidence: {
    /** Five bar heights (0–1) — left-to-right = supported → mixed →
     *  weak → thin → refuting. Roughly how the retrieved set breaks
     *  down for this sample. */
    bars: [number, number, number, number, number];
    /** Total papers surfaced in the pool for the check. */
    papersFound: number;
    /** How long the check took (seconds). */
    checkSeconds: number;
  };
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
    evidence: { bars: [1, 0.85, 0.55, 0.35, 0.15], papersFound: 43, checkSeconds: 8 },
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
    evidence: { bars: [0.2, 0.35, 0.65, 0.85, 0.5], papersFound: 6, checkSeconds: 5 },
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
    evidence: { bars: [0.55, 0.75, 0.7, 0.55, 0.4], papersFound: 22, checkSeconds: 7 },
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

                {/* Evidence strength — 5 tiny bars showing how the pool
                    breaks down (supporting → refuting), so the card
                    doesn't fall to empty space with short citation
                    lists. */}
                <p className="hp-evidence-label">EVIDENCE STRENGTH</p>
                <div className="hp-evidence-row">
                  <span className="hp-bars" aria-hidden="true">
                    {sample.evidence.bars.map((h, i) => (
                      <i
                        key={i}
                        style={{
                          height: `${Math.round(h * 100)}%`,
                          background:
                            i < 2 ? "#1e4d2b" : i < 4 ? "#4a8b5a" : "#b78628",
                        }}
                      />
                    ))}
                  </span>
                  <span className="hp-evidence-copy">
                    {sample.evidence.papersFound} papers weighed
                  </span>
                </div>

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

                {/* Trust footer strip — brand mark + how many sources,
                    how fast. Anchors the bottom of the card so short
                    citation lists don't leave a white gap. */}
                <div className="hp-verdict-footer">
                  <span className="hp-verdict-brand" aria-hidden="true">
                    <svg viewBox="11.4 1 15.2 26" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13.5 3 L13.5 17 C13.5 24.2 22.6 26.1 23.8 20.6 C24.8 16 19.3 13.8 16.9 16.8 C15.3 18.8 16.7 21.4 19 21.1" />
                    </svg>
                    bloomscroll
                  </span>
                  <span className="hp-verdict-meta-strip">
                    checked in ~{sample.evidence.checkSeconds}s · Europe PMC
                  </span>
                </div>
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

/**
 * Renders the "video" behind the phone content. Priority order:
 *   1. `/hero/reel-{scene}.mp4`   → silent looping video
 *   2. `/hero/reel-{scene}.webp`  → real photo (best size/quality)
 *   3. `/hero/reel-{scene}.jpg`   → real photo (fallback)
 *   4. `/hero/reel-{scene}.png`   → real photo (last resort)
 *   5. Hand-built SVG scene       → default until real assets land
 *
 * To upgrade: drop any of the above into `public/hero/` for each of
 * `sunscreen`, `mewing`, `cold`. Vertical 9:16 assets look best.
 * Silent muted-loop is fine for MP4. See the answer alongside this
 * commit for licensing guidance on what photos are safe to use.
 */
type MediaKind = "video" | "image";
interface FoundMedia {
  url: string;
  kind: MediaKind;
}
const MEDIA_CANDIDATES: { ext: string; kind: MediaKind }[] = [
  { ext: "mp4", kind: "video" },
  { ext: "webp", kind: "image" },
  { ext: "jpg", kind: "image" },
  { ext: "png", kind: "image" },
];

function VideoBackground({ scene }: { scene: Sample["scene"] }) {
  const [media, setMedia] = useState<FoundMedia | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const c of MEDIA_CANDIDATES) {
        try {
          const url = `/hero/reel-${scene}.${c.ext}`;
          const r = await fetch(url, { method: "HEAD" });
          if (cancelled) return;
          if (r.ok) {
            setMedia({ url, kind: c.kind });
            return;
          }
        } catch {
          // network hiccup — keep probing the rest
        }
      }
      if (!cancelled) setMedia(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [scene]);

  if (media?.kind === "video") {
    return (
      <video
        key={media.url}
        className="hp-video-bg"
        src={media.url}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
    );
  }
  if (media?.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={media.url}
        className="hp-video-bg"
        src={media.url}
        alt=""
        aria-hidden="true"
      />
    );
  }
  return <SvgScene scene={scene} />;
}

function SvgScene({ scene }: { scene: Sample["scene"] }) {
  if (scene === "sunscreen") {
    return (
      <svg viewBox="0 0 400 720" className="hp-video-bg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hv-sun-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB782" />
            <stop offset="55%" stopColor="#E68B58" />
            <stop offset="100%" stopColor="#4E2A18" />
          </linearGradient>
          <radialGradient id="hv-sun-glow" cx="0.78" cy="0.18" r="0.55">
            <stop offset="0%" stopColor="#FFF2CB" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFF2CB" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hv-sun-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0BE95" />
            <stop offset="60%" stopColor="#C68A64" />
            <stop offset="100%" stopColor="#6C412A" />
          </linearGradient>
          <radialGradient id="hv-vignette" cx="0.5" cy="0.5" r="0.75">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
          <filter id="hv-blur-1"><feGaussianBlur stdDeviation="12" /></filter>
        </defs>
        {/* sky + sun */}
        <rect width="400" height="720" fill="url(#hv-sun-sky)" />
        <circle cx="312" cy="126" r="42" fill="#FFF3CE" opacity="0.95" />
        <rect width="400" height="720" fill="url(#hv-sun-glow)" />
        {/* bokeh — blurred foliage circles */}
        <g filter="url(#hv-blur-1)" opacity="0.55">
          <circle cx="60" cy="640" r="80" fill="#2E4A2F" />
          <circle cx="340" cy="660" r="70" fill="#3A5D3B" />
          <circle cx="200" cy="700" r="60" fill="#294024" />
          <circle cx="100" cy="250" r="34" fill="#F5D9B3" />
          <circle cx="360" cy="360" r="26" fill="#F7C99A" />
        </g>
        {/* subject: shoulders + head with skin-tone gradient */}
        <ellipse cx="200" cy="620" rx="170" ry="220" fill="url(#hv-sun-skin)" opacity="0.9" />
        <circle cx="200" cy="360" r="115" fill="url(#hv-sun-skin)" opacity="0.95" />
        {/* hair silhouette */}
        <path
          d="M110 340 C 110 240 165 200 200 200 C 235 200 290 240 290 340 C 288 320 260 300 244 305 L 244 260 C 224 260 176 260 156 260 L 156 305 C 140 300 112 320 110 340 Z"
          fill="#2A180E"
          opacity="0.85"
        />
        {/* rim light on left cheek */}
        <ellipse cx="128" cy="380" rx="10" ry="40" fill="#FFEBC7" opacity="0.35" />
        {/* vignette on top */}
        <rect width="400" height="720" fill="url(#hv-vignette)" />
      </svg>
    );
  }
  if (scene === "mewing") {
    return (
      <svg viewBox="0 0 400 720" className="hp-video-bg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hv-mew-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A4753" />
            <stop offset="70%" stopColor="#1F262E" />
            <stop offset="100%" stopColor="#0C0F13" />
          </linearGradient>
          <linearGradient id="hv-mew-skin" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5A4032" />
            <stop offset="50%" stopColor="#B48967" />
            <stop offset="100%" stopColor="#EACCA6" />
          </linearGradient>
          <radialGradient id="hv-vignette-2" cx="0.5" cy="0.5" r="0.75">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
          </radialGradient>
          <filter id="hv-blur-2"><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        <rect width="400" height="720" fill="url(#hv-mew-wall)" />
        {/* bathroom vanity light hint (bokeh) */}
        <g filter="url(#hv-blur-2)" opacity="0.7">
          <circle cx="80" cy="120" r="38" fill="#F0E6C8" />
          <circle cx="320" cy="140" r="30" fill="#F0E6C8" />
          <circle cx="60" cy="560" r="60" fill="#25313D" />
        </g>
        {/* side-profile skin-toned silhouette */}
        <path
          d="M120 720 L120 300 C120 220 170 160 240 160 L290 160 Q312 175 302 210 L282 260 Q272 300 252 320 L235 360 Q225 400 250 430 Q265 445 260 470 L260 720 Z"
          fill="url(#hv-mew-skin)"
          opacity="0.95"
        />
        {/* hair block on top */}
        <path
          d="M170 200 Q 175 130 260 145 Q 300 155 300 195 L 280 208 Q 265 175 220 175 Q 195 180 180 210 Z"
          fill="#141B1F"
          opacity="0.9"
        />
        {/* rim highlight along the jawline */}
        <path
          d="M232 300 Q 250 340 250 400 Q 250 435 246 465"
          fill="none"
          stroke="#FFF2D8"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.35"
        />
        {/* thin mirror strip on the left */}
        <rect x="14" y="60" width="3" height="600" fill="#C3D5E4" opacity="0.35" />
        <rect width="400" height="720" fill="url(#hv-vignette-2)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 720" className="hp-video-bg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="hv-cold-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#98CDDA" />
          <stop offset="45%" stopColor="#3E6C7A" />
          <stop offset="100%" stopColor="#0C1A22" />
        </linearGradient>
        <linearGradient id="hv-cold-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E6BDA0" />
          <stop offset="100%" stopColor="#8A5F45" />
        </linearGradient>
        <radialGradient id="hv-vignette-3" cx="0.5" cy="0.5" r="0.75">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <filter id="hv-blur-3"><feGaussianBlur stdDeviation="10" /></filter>
      </defs>
      <rect width="400" height="720" fill="url(#hv-cold-water)" />
      {/* breath / mist bokeh */}
      <g filter="url(#hv-blur-3)" opacity="0.55">
        <circle cx="80" cy="200" r="42" fill="#EAF2F6" />
        <circle cx="330" cy="240" r="32" fill="#EAF2F6" />
      </g>
      {/* head + torso in cool light */}
      <circle cx="200" cy="250" r="72" fill="url(#hv-cold-skin)" opacity="0.95" />
      {/* wet hair */}
      <path
        d="M132 240 Q 130 165 200 165 Q 270 165 268 245 Q 250 210 200 210 Q 150 210 132 240 Z"
        fill="#1B2126"
        opacity="0.9"
      />
      <path
        d="M100 720 L100 460 C120 400 180 380 200 380 C220 380 280 400 300 460 L300 720 Z"
        fill="url(#hv-cold-skin)"
        opacity="0.9"
      />
      {/* water line + ripples */}
      <ellipse cx="200" cy="470" rx="180" ry="14" fill="#B4D8E4" opacity="0.5" />
      <ellipse cx="130" cy="480" rx="60" ry="4" fill="#E6F1F6" opacity="0.75" />
      <ellipse cx="300" cy="482" rx="45" ry="3" fill="#E6F1F6" opacity="0.6" />
      {/* small ice cubes floating */}
      <rect x="70" y="470" width="18" height="12" rx="2" fill="#F1F7FA" opacity="0.85" />
      <rect x="290" y="466" width="14" height="10" rx="2" fill="#F1F7FA" opacity="0.8" />
      <rect x="230" y="472" width="12" height="8" rx="2" fill="#F1F7FA" opacity="0.7" />
      <rect width="400" height="720" fill="url(#hv-vignette-3)" />
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
