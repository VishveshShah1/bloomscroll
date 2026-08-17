/**
 * Illustrated diagrams for the four real pipeline stages — the same stages the
 * checker actually streams over SSE: reading → claims → searching → grading.
 *
 * Drawn to the standard set by HeroPhoneAnimation rather than the lighter
 * mockup art in PlaceholderArt.tsx: purpose-built compositions in the brand's
 * forest-green line language, with the wordmark curl carried through as the
 * connective shape.
 *
 * These are built WIDE (1200×480) and are meant to run at full column width as
 * the dominant element of each step — not as a thumbnail beside a paragraph.
 * Each one is annotated in-illustration with a numbered beat and a caption, so
 * the picture explains the stage on its own and the surrounding copy can stay
 * to a short title.
 *
 * Motion lives in globals.css as `pa-*` keyframes so prefers-reduced-motion is
 * handled in one place. All of it is decorative: every composition reads
 * correctly frozen on frame one.
 *
 * SVG gotchas baked in here, both of which cost real debugging time:
 *   - def ids are slugs, never the visible label. `url(#id with spaces)`
 *     silently fails and drops the gradient/clip entirely.
 *   - a CSS keyframe `transform` REPLACES an SVG `transform` attribute rather
 *     than composing with it, so any animated group keeps its positioning
 *     transform on a separate parent <g>.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { B_MARK_PATH } from "./Wordmark";

const CANVAS = "#F6F3EA";
const MOSS = "#E8EDDE";
const FOREST = "#1E4D2B";
const SPROUT = "#4A8B5A";
const INK = "#12201A";
const BARK = "#5B6B5E";
const OK_BG = "#DDE7DA";

const FONT = "-apple-system, Inter, sans-serif";

const W = 1200;
const H = 480;

/** Numbered beat marker + caption, used under each cluster so the diagram
 *  narrates itself without body copy. */
function Beat({ x, n, text }: { x: number; n: number; text: string }) {
  return (
    <g transform={`translate(${x} 424)`}>
      <circle cx="11" cy="11" r="11" fill={FOREST} />
      <text
        x="11"
        y="15.5"
        textAnchor="middle"
        fontFamily={FONT}
        fontSize="11"
        fontWeight="700"
        fill={CANVAS}
      >
        {n}
      </text>
      <text x="30" y="16" fontFamily={FONT} fontSize="14" fontWeight="600" fill={INK}>
        {text}
      </text>
    </g>
  );
}

/** Right-pointing connector between clusters. */
function Flow({ x, y = 210, label }: { x: number; y?: number; label?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        className="pa-draw"
        d="M0 0 C24 -14, 44 -14, 68 0"
        fill="none"
        stroke={FOREST}
        strokeOpacity="0.75"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeDasharray="5 7"
      />
      {/* Arrowhead sits ON the curve's endpoint and is rotated to its exit
          tangent, so the barbs are perpendicular to the line instead of the
          old axis-aligned chevron floating past the end. For a cubic, the
          end tangent is 3*(P3-P2) = 3*(24,14) → atan2(14,24) ≈ 30.26°. */}
      <g transform="translate(68 0) rotate(30.26)">
        <path
          d="M-11 -7 L0 0 L-11 7"
          fill="none"
          stroke={FOREST}
          strokeOpacity="0.75"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {label && (
        <text
          x="37"
          y="-22"
          textAnchor="middle"
          fontFamily={FONT}
          fontSize="11"
          fontWeight="600"
          letterSpacing="0.4"
          fill={BARK}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Plate({
  children,
  id,
  title,
}: {
  children: React.ReactNode;
  id: string;
  /** Supply when the plate contains real controls — it then stops being
   *  aria-hidden so the buttons inside are reachable, and this string
   *  becomes the accessible name. Purely decorative plates omit it. */
  title?: string;
}) {
  return (
    // `h-auto` matters: these are no longer wrapped in ScreenFrame's
    // aspect-ratio box, so the SVG has to derive its own height from the
    // viewBox. With `h-full` and an auto-height parent it collapses to nothing.
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full"
      aria-hidden={title ? undefined : "true"}
      role={title ? "group" : undefined}
      aria-label={title}
    >
      <defs>
        <linearGradient id={`pa-sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={MOSS} stopOpacity="1" />
          <stop offset="100%" stopColor={CANVAS} stopOpacity="1" />
        </linearGradient>
        <clipPath id={`pa-clip-${id}`}>
          <rect x="6" y="6" width={W - 12} height={H - 12} rx="24" />
        </clipPath>
      </defs>

      <rect x="6" y="6" width={W - 12} height={H - 12} rx="24" fill={`url(#pa-sky-${id})`} />

      <g clipPath={`url(#pa-clip-${id})`}>
        {/* wordmark curl as faint ground texture */}
        <path
          d="M1090 330 C1090 400 1010 424 968 386 C934 356 950 306 990 308 C1020 310 1032 342 1010 358"
          fill="none"
          stroke={FOREST}
          strokeOpacity="0.10"
          strokeWidth="34"
          strokeLinecap="round"
        />
        {children}
      </g>

      <rect
        x="6"
        y="6"
        width={W - 12}
        height={H - 12}
        rx="24"
        fill="none"
        stroke={INK}
        strokeOpacity="0.1"
      />
      {/* No plate caption here on purpose: each diagram already sits directly
          under its own "Step 0N — <title>" heading, so an in-SVG restatement
          of the same thing was decoration, not information. */}
    </svg>
  );
}

/**
 * Real typewriter: types the string a character at a time, holds, then
 * backspaces, forever. Returns the visible slice plus whether we're mid-
 * keystroke, so the caret can be solid while typing/deleting and blink only
 * during the idle hold.
 *
 * Driven by a chain of timeouts rather than one interval so each phase can
 * have its own cadence, and so the hold is an honest pause instead of a
 * long run of no-op ticks.
 */
function useTypewriter(
  full: string,
  { typeMs = 55, deleteMs = 28, holdMs = 4000, restMs = 700 } = {},
) {
  const [n, setN] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Reduced-motion users get the finished string, no animation.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setN(full.length);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && n < full.length) {
      t = setTimeout(() => setN(n + 1), typeMs);
    } else if (!deleting && n === full.length) {
      t = setTimeout(() => setDeleting(true), holdMs);
    } else if (deleting && n > 0) {
      t = setTimeout(() => setN(n - 1), deleteMs);
    } else {
      t = setTimeout(() => setDeleting(false), restMs);
    }
    return () => clearTimeout(t);
  }, [n, deleting, full, typeMs, deleteMs, holdMs, restMs]);

  const idle = !deleting && n === full.length;
  return { shown: full.slice(0, n), idle };
}

/** Stage 1 — reading the source: a post, a share, and the claim landing in
 *  the checker. */
export function PipePasteArt() {
  const CLAIM = "mewing reshapes your jawline";
  const { shown, idle } = useTypewriter(CLAIM);
  const textRef = useRef<SVGTextElement>(null);
  const [caretX, setCaretX] = useState(40);

  // Measure the rendered run so the caret sits exactly at the end of the
  // text rather than at a guessed character width.
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setCaretX(40 + (el.getComputedTextLength?.() ?? 0));
  }, [shown]);

  return (
    <Plate id="paste">
      {/* ① the post */}
      <g transform="translate(72 82)">
        <rect width="236" height="292" rx="20" fill="white" />
        <rect width="236" height="292" rx="20" fill="none" stroke={INK} strokeOpacity="0.1" />
        <rect x="14" y="14" width="208" height="140" rx="14" fill={FOREST} fillOpacity="0.26" />
        {/* play glyph, so it reads as a clip */}
        <circle cx="118" cy="84" r="22" fill="white" fillOpacity="0.85" />
        <path d="M112 74 L132 84 L112 94 Z" fill={FOREST} fillOpacity="1" />
        <circle cx="34" cy="184" r="14" fill={FOREST} fillOpacity="0.5" />
        <rect x="58" y="176" width="104" height="9" rx="4.5" fill={INK} fillOpacity="0.28" />
        <rect x="58" y="191" width="64" height="7" rx="3.5" fill={INK} fillOpacity="0.16" />
        <rect x="16" y="220" width="196" height="9" rx="4.5" fill={INK} fillOpacity="0.15" />
        <rect x="16" y="238" width="164" height="9" rx="4.5" fill={INK} fillOpacity="0.15" />
        <rect x="16" y="256" width="182" height="9" rx="4.5" fill={INK} fillOpacity="0.15" />
      </g>

      <Flow x={330} label="share" />

      {/* ② the share sheet */}
      <g transform="translate(438 118)">
        <rect width="230" height="220" rx="20" fill="white" />
        <rect width="230" height="220" rx="20" fill="none" stroke={INK} strokeOpacity="0.1" />
        <rect x="99" y="14" width="32" height="4" rx="2" fill={INK} fillOpacity="0.16" />
        <text x="22" y="50" fontFamily={FONT} fontSize="11" fontWeight="700" letterSpacing="1.4" fill={BARK}>
          SHARE TO
        </text>
        <g transform="translate(0 0)">
          <g className="pa-rise">
            <rect x="20" y="64" width="190" height="52" rx="16" fill={OK_BG} stroke={FOREST} strokeOpacity="0.4" />
            {/* the real wordmark curl, not a freehand version of it */}
            <g transform="translate(50 91) scale(1.12) translate(-19 -14)">
              <path
                d={B_MARK_PATH}
                fill="none"
                stroke={FOREST}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <text x="70" y="96" fontFamily={FONT} fontSize="15" fontWeight="600" fill={FOREST}>
              bloomscroll
            </text>
          </g>
        </g>
        {/* other, greyed share targets */}
        {[0, 1].map((i) => (
          <rect key={i} x="20" y={130 + i * 34} width="190" height="24" rx="12" fill={INK} fillOpacity="0.06" />
        ))}
        {/* Tap on the bloomscroll row. Both the ripple AND the fingertip dot
            are keyed to the tap beat and fade out after — the dot used to be
            a permanently visible translucent circle sitting on the label. */}
        <circle className="pa-tap" cx="115" cy="90" r="26" fill={FOREST} fillOpacity="0.16" />
        <circle className="pa-tap-dot" cx="115" cy="90" r="7" fill={FOREST} fillOpacity="0.5" />
      </g>

      <Flow x={690} label="opens" />

      {/* ③ the checker, claim already in it */}
      <g transform="translate(798 96)">
        <rect width="330" height="264" rx="20" fill="white" />
        <rect width="330" height="264" rx="20" fill="none" stroke={INK} strokeOpacity="0.1" />
        <text x="24" y="42" fontFamily={FONT} fontSize="11" fontWeight="700" letterSpacing="1.5" fill={BARK}>
          THE CLAIM
        </text>
        <rect x="24" y="56" width="282" height="62" rx="14" fill={CANVAS} stroke={INK} strokeOpacity="0.09" />
        {/* Typed live, one character at a time, then backspaced. The caret
            tracks the measured end of the text; it holds solid while keys
            are "pressed" and only blinks during the idle hold. */}
        <text
          ref={textRef}
          x="40"
          y="93"
          fontFamily={FONT}
          fontSize="13.5"
          fill={INK}
          fillOpacity="0.85"
        >
          {shown}
        </text>
        <rect
          className={idle ? "pa-caret" : undefined}
          x={caretX + 2}
          y="81"
          width="2"
          height="17"
          rx="1"
          fill={FOREST}
        />
        <rect x="24" y="136" width="282" height="44" rx="22" fill={FOREST} />
        <text x="165" y="164" textAnchor="middle" fontFamily={FONT} fontSize="15" fontWeight="600" fill={CANVAS}>
          check
        </text>
        <text x="24" y="208" fontFamily={FONT} fontSize="11" fontWeight="700" letterSpacing="1.5" fill={BARK}>
          SOURCE READ
        </text>
        <rect x="24" y="220" width="164" height="26" rx="13" fill={MOSS} stroke={FOREST} strokeOpacity="0.28" />
        <text x="40" y="237" fontFamily={FONT} fontSize="12" fontWeight="600" fill={FOREST}>
          video · 42s · captions
        </text>
      </g>

      <Beat x={72} n={1} text="a post from your feed" />
      <Beat x={438} n={2} text="share it to bloomscroll" />
      <Beat x={798} n={3} text="the claim lands in the checker" />
    </Plate>
  );
}

/** Stage 2 — the checkable sentences lift out of the caption and reattach as
 *  leaves on a stem; the opinions are left behind. */
export function PipeExtractArt() {
  // x is solved from the stem curve at each chip's own height so the card's
  // left edge lands ON the line (4px overlap so the stroke tucks under the
  // rounded corner). Curve is M596 366 C596 268 616 178 664 118 — its x at
  // the chip centres is 664 / 622.8 / 603.4.
  const chips = [
    { y: 92, x: 660, w: 300, label: "mewing reshapes the jawline" },
    { y: 168, x: 619, w: 268, label: "it works on adults too" },
    { y: 244, x: 599, w: 246, label: "results in 6 months" },
  ];
  return (
    <Plate id="extract">
      {/* ① the caption, verbatim */}
      <g transform="translate(72 82)">
        <rect width="356" height="292" rx="20" fill="white" />
        <rect width="356" height="292" rx="20" fill="none" stroke={INK} strokeOpacity="0.1" />
        <text x="22" y="40" fontFamily={FONT} fontSize="11" fontWeight="700" letterSpacing="1.5" fill={BARK}>
          THE CAPTION
        </text>
        <rect className="pa-sweep" x="18" y="54" width="320" height="30" rx="9" fill={SPROUT} fillOpacity="0.38" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const isClaim = i === 1 || i === 4 || i === 6;
          return (
            <rect
              key={i}
              x="22"
              y={62 + i * 30}
              width={i % 3 === 2 ? 232 : 312}
              height="11"
              rx="5.5"
              fill={isClaim ? FOREST : INK}
              fillOpacity={isClaim ? 0.8 : 0.18}
            />
          );
        })}
        {/* legend so the highlight reads as intentional */}
        <rect x="22" y="316" width="14" height="9" rx="4.5" fill={FOREST} fillOpacity="0.8" />
        <text x="44" y="325" fontFamily={FONT} fontSize="11.5" fill={BARK}>
          checkable
        </text>
        <rect x="140" y="316" width="14" height="9" rx="4.5" fill={INK} fillOpacity="0.12" />
        <text x="162" y="325" fontFamily={FONT} fontSize="11.5" fill={BARK}>
          opinion, skipped
        </text>
      </g>

      <Flow x={452} label="extract" />

      {/* stem the claims hang from */}
      <path
        d="M596 366 C596 268 616 178 664 118"
        fill="none"
        stroke={FOREST}
        strokeOpacity="0.6"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* ② the extracted claims, as leaves */}
      {chips.map((c, i) => (
        <g key={c.label} transform={`translate(${c.x} ${c.y})`}>
          <g className="pa-leaf" style={{ animationDelay: `${0.35 + i * 0.45}s` }}>
            <rect width={c.w} height="50" rx="16" fill="white" />
            <rect width={c.w} height="50" rx="16" fill="none" stroke={FOREST} strokeOpacity="0.5" />
            <circle cx="27" cy="25" r="9" fill={FOREST} fillOpacity="0.28" />
            <path d="M22.5 25 L26 28.5 L32 21.5" fill="none" stroke={FOREST} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <text x="48" y="30" fontFamily={FONT} fontSize="14.5" fontWeight="600" fill={INK}>
              {c.label}
            </text>
          </g>
        </g>
      ))}

      {/* Badge sits at the foot of the same stem — x tracks the curve at
          y≈329 (597) so the whole stack reads as hanging off one line. */}
      <g transform="translate(593 314)">
        <rect width="180" height="30" rx="15" fill={FOREST} />
        <text x="90" y="20" textAnchor="middle" fontFamily={FONT} fontSize="12.5" fontWeight="700" letterSpacing="0.6" fill={CANVAS}>
          3 CHECKABLE CLAIMS
        </text>
      </g>

      <Beat x={72} n={1} text="what the post actually said" />
      <Beat x={644} n={2} text="only the testable parts survive" />
    </Plate>
  );
}

/** Stage 3 — each claim gets its own search; only retrieved papers count. */
export function PipeSearchArt() {
  // Node 8 was at -142° with node 7 at 216° (≡ -144°) — two degrees apart,
  // which is why two bubbles sat on top of each other. Moved to -160°/104
  // so it clears both node 7 and node 6.
  const nodes = [
    { a: -74, r: 96 }, { a: -30, r: 132 }, { a: 12, r: 92 },
    { a: 54, r: 136 }, { a: 98, r: 104 }, { a: 142, r: 130 },
    { a: 180, r: 96 }, { a: 216, r: 134 }, { a: -160, r: 104 },
    { a: -106, r: 142 }, { a: 36, r: 176 }, { a: 156, r: 172 },
    { a: -52, r: 174 }, { a: 116, r: 170 },
  ];
  const cx = 290;
  const cy = 216;
  const SWEEP_SECONDS = 6;
  const R = 194;
  const pt = (deg: number, rad = R) => [
    cx + Math.cos((deg * Math.PI) / 180) * rad,
    cy + Math.sin((deg * Math.PI) / 180) * rad,
  ];
  // Comet tail. A single linear-gradient wedge left a visible hard edge at
  // the trailing side: a linear gradient varies along a straight axis, so
  // opacity near the apex stayed non-zero and the wedge's radial edge showed
  // as a line. A true angular fade needs opacity constant along each radius,
  // which SVG gradients can't express — so this is many thin slices instead.
  // At ~1.3° per slice the stepping is imperceptible, and the trailing slice
  // genuinely reaches zero, so the tail dissolves into the background.
  const TAIL_DEG = 63;
  const SLICES = 48;
  const tail = Array.from({ length: SLICES }, (_, k) => {
    const a1 = -((k + 1) * TAIL_DEG) / SLICES;
    const a2 = -(k * TAIL_DEG) / SLICES;
    const [x1, y1] = pt(a1);
    const [x2, y2] = pt(a2);
    // ease the ramp so it's dense near the head and vanishes well before
    // the trailing edge rather than cutting off
    const o = 0.42 * Math.pow(1 - k / SLICES, 1.7);
    return { k, d: `M${cx} ${cy} L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`, o };
  });
  return (
    <Plate id="search">
      {[96, 134, 176].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={FOREST} strokeOpacity="0.24" strokeWidth="1.5" strokeDasharray="3 9" />
      ))}

      <g className="pa-sweep-arm" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {tail.map((t) => (
          <path key={t.k} d={t.d} fill={SPROUT} fillOpacity={t.o} shapeRendering="crispEdges" />
        ))}
        <line x1={cx} y1={cy} x2={cx + R} y2={cy} stroke={FOREST} strokeOpacity="0.65" strokeWidth="2" />
      </g>

      {nodes.map((n, i) => {
        const rad = (n.a * Math.PI) / 180;
        const x = cx + Math.cos(rad) * n.r;
        const y = cy + Math.sin(rad) * n.r;
        const matched = i % 3 === 0;
        // Phase each bubble to the moment the arm actually crosses it: the
        // arm sweeps 0→360° over SWEEP_SECONDS, so a node at angle θ lights
        // at (θ/360) of the way through. Previously these blinked on an
        // arbitrary i%6 stagger with no relation to the arm's position.
        const norm = ((n.a % 360) + 360) % 360;
        return (
          <g
            key={i}
            className="pa-node"
            style={{ animationDelay: `${((norm / 360) * SWEEP_SECONDS).toFixed(2)}s` }}
          >
            <rect
              x={x - 15}
              y={y - 10}
              width="30"
              height="20"
              rx="5"
              fill={matched ? OK_BG : "white"}
              stroke={matched ? FOREST : INK}
              strokeOpacity={matched ? 0.75 : 0.22}
            />
            <rect x={x - 9} y={y - 4.5} width="18" height="2.6" rx="1.3" fill={INK} fillOpacity="0.3" />
            <rect x={x - 9} y={y + 1} width="11" height="2.6" rx="1.3" fill={INK} fillOpacity="0.18" />
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="46" fill="white" stroke={FOREST} strokeOpacity="0.3" />
      <circle className="pa-pulse" cx={cx} cy={cy} r="46" fill="none" stroke={FOREST} strokeOpacity="0.45" strokeWidth="2" />
      {/* The actual wordmark b-mark, not an approximation of it. Its viewBox
          is "11.4 1 15.2 26", so the centre is (19, 14) — translate that to
          the hub, scaled to sit inside the r=46 disc. */}
      <g transform={`translate(${cx} ${cy}) scale(1.72) translate(-19 -14)`}>
        <path
          d={B_MARK_PATH}
          fill="none"
          stroke={FOREST}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <Flow x={520} y={216} label="matches" />

      {/* the retrieved set */}
      <g transform="translate(628 96)">
        <rect width="500" height="264" rx="20" fill="white" />
        <rect width="500" height="264" rx="20" fill="none" stroke={INK} strokeOpacity="0.1" />
        <text x="26" y="42" fontFamily={FONT} fontSize="11" fontWeight="700" letterSpacing="1.5" fill={BARK}>
          SOURCES SCANNED
        </text>
        {[
          { n: "Europe PMC", v: "43 matches", w: 400, o: 1 },
          { n: "Cochrane reviews", v: "6 matches", w: 190, o: 0.75 },
          { n: "clinical trials", v: "2 matches", w: 86, o: 0.5 },
        ].map((row, i) => (
          <g key={row.n} transform={`translate(26 ${60 + i * 54})`}>
            <circle cx="6" cy="9" r="6" fill={FOREST} fillOpacity={row.o} />
            <text x="22" y="14" fontFamily={FONT} fontSize="14" fontWeight="600" fill={INK}>
              {row.n}
            </text>
            <text x="448" y="14" textAnchor="end" fontFamily={FONT} fontSize="13" fontWeight="700" fill={FOREST}>
              {row.v}
            </text>
            <rect x="22" y="24" width="426" height="7" rx="3.5" fill={INK} fillOpacity="0.07" />
            <rect x="22" y="24" width={row.w} height="7" rx="3.5" fill={FOREST} fillOpacity={0.5 + row.o * 0.4} />
          </g>
        ))}
        <g transform="translate(26 224)">
          <rect width="448" height="30" rx="15" fill={MOSS} stroke={FOREST} strokeOpacity="0.5" />
          <text x="16" y="20" fontFamily={FONT} fontSize="12.5" fontWeight="600" fill={FOREST}>
            only these papers can be cited later
          </text>
        </g>
      </g>

      <Beat x={72} n={1} text="every claim gets its own search" />
      <Beat x={628} n={2} text="45M+ papers, nothing invented" />
    </Plate>
  );
}

/** Stage 4 — the verdict lands on one of five tiers, with the weight behind
 *  it and the citations that back it. */
export function PipeGradeArt() {
  // Each tier carries its own panels. `cites` is deliberately 0 for the two
  // tiers that genuinely can't cite anything — that's the citation gate
  // showing in the illustration, not a gap in the art.
  const tiers = [
    {
      label: "SUPPORTED",
      fill: "#1E4D2B",
      text: "#F6F3EA",
      lines: ["Several independent studies agree, and better", "quality work hasn't overturned them."],
      weighed: "126 papers weighed",
      bars: [0.92, 0.14, 0.26],
      strength: "trials and large reviews, pointing one way",
      cites: 3,
      citeNote: "every one opens the real paper",
    },
    {
      label: "MIXED EVIDENCE",
      fill: "#B78628",
      text: "#FDF7E6",
      lines: ["Real studies exist and they disagree —", "neither side has clearly won."],
      weighed: "74 papers weighed",
      bars: [0.56, 0.52, 0.34],
      strength: "solid studies on both sides of the question",
      cites: 3,
      citeNote: "sources for and against, both shown",
    },
    {
      label: "WEAK EVIDENCE",
      fill: "#B45A34",
      text: "#FBEDDE",
      lines: ["Thin evidence: small samples, animal or lab", "work, or no control group to rule out chance."],
      weighed: "48 papers weighed",
      bars: [0.22, 0.12, 0.42],
      strength: "small samples, no controlled trials",
      cites: 2,
      citeNote: "the few that exist, with their limits",
    },
    {
      label: "NO EVIDENCE",
      fill: "#3F5049",
      text: "#EBEFEB",
      lines: ["Nothing in the literature tests this claim.", "Absence of evidence isn't proof it's false."],
      weighed: "0 papers matched",
      bars: [],
      strength: "searched, nothing addresses the claim",
      cites: 0,
      citeNote: "nothing to cite — so nothing is shown",
    },
    {
      label: "NOT TESTABLE",
      fill: "#615A82",
      text: "#EEEBF6",
      lines: ["An opinion or aesthetic judgment — there", "is nothing here to measure."],
      weighed: "not searched",
      bars: [],
      strength: "no measurable claim to search for",
      cites: 0,
      citeNote: "no search runs, so there are no sources",
    },
  ];
  // Which tier the marker rests on. Defaults to weak (the mewing claim), and
  // stays wherever the visitor last clicked instead of replaying an entrance.
  const [sel, setSel] = useState(2);
  const ROW = 56;

  return (
    <Plate
      id="grade"
      title="The five evidence tiers — select one to see what it means"
    >
      {/* Affordance hint. The rows below are real buttons, but nothing about a
          static scale says so — same problem the 404 badge had, same fix. */}
      <text x="72" y="70" fontFamily={FONT} fontSize="11.5" fill={BARK}>
        tap to change evidence
      </text>

      {/* ① the five-tier scale — each row is a real control */}
      <g transform="translate(72 82)">
        {tiers.map((t, i) => {
          const on = i === sel;
          return (
            <g
              key={t.label}
              transform={`translate(0 ${i * ROW})`}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={`${t.label}: ${t.lines.join(" ")}`}
              onClick={() => setSel(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSel(i);
                }
              }}
              className="pa-tier"
            >
              <rect
                width="286"
                height="42"
                rx="21"
                fill={t.fill}
                fillOpacity={on ? 1 : 0.28}
                style={{ transition: "fill-opacity 0.25s ease" }}
              />
              <text
                x="22"
                y="27"
                fontFamily={FONT}
                fontSize="12.5"
                fontWeight="700"
                letterSpacing="1.2"
                fill={on ? t.text : INK}
                fillOpacity={on ? 1 : 0.6}
              >
                {t.label}
              </text>
            </g>
          );
        })}

        {/* Marker. Positioned purely via a CSS transform (an SVG transform
            attribute would be replaced by it, per the note up top) so it can
            glide between rows. No looping entrance — it lands and stays put
            until another tier is chosen. The glow is concentric with the
            triangle: the triangle spans x 0–20 / y 10–32, so its centre is
            (10, 21), which is where the circle sits. */}
        <g
          style={{
            transform: `translate(300px, ${sel * ROW}px)`,
            transition: "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <circle cx="10" cy="21" r="22" fill={FOREST} fillOpacity="0.14" />
          <path
            d="M1 10 L21 21 L1 32 Z"
            fill={FOREST}
            strokeLinejoin="round"
            strokeLinecap="round"
            stroke={FOREST}
            strokeWidth="2"
          />
        </g>

        {/* tailored copy for the selected tier */}
        <g transform="translate(0 300)">
          {tiers[sel].lines.map((line, k) => (
            <text
              key={line}
              x="2"
              y={k * 22}
              fontFamily={FONT}
              fontSize="13.5"
              fill={INK}
              fillOpacity="0.72"
            >
              {line}
            </text>
          ))}
        </g>
      </g>

      {/* ② how much evidence sits behind it, with a trend line climbing
             across the bars toward the verdict — the "building up to it"
             beat. The line draws left-to-right and the head lands last. */}
      <g transform="translate(470 96)">
        <rect width="286" height="264" rx="20" fill="white" />
        <rect width="286" height="264" rx="20" fill="none" stroke={INK} strokeOpacity="0.1" />
        <text x="24" y="40" fontFamily={FONT} fontSize="11" fontWeight="700" letterSpacing="1.5" fill={BARK}>
          EVIDENCE STRENGTH
        </text>
        {/* The chart now measures ONE stated thing: how the retrieved papers
            split between supporting the claim, conflicting with it, and being
            inconclusive. That's the quantity that actually decides the tier,
            which is why the shape differs per tier — tall-and-lopsided for
            supported, near-even for mixed, all-short for weak, and absent for
            the two tiers where no papers were retrieved at all. */}
        <text x="24" y="58" fontFamily={FONT} fontSize="11.5" fill={BARK} fillOpacity="0.85">
          how the retrieved papers split
        </text>
        <g transform="translate(24 74)">
          {[0, 36, 72].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="238"
              y2={y}
              stroke={INK}
              strokeOpacity="0.07"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          ))}
          <line x1="0" y1="108" x2="238" y2="108" stroke={INK} strokeOpacity="0.16" strokeWidth="1.5" />

          {tiers[sel].bars.length === 0 ? (
            <text x="119" y="62" textAnchor="middle" fontFamily={FONT} fontSize="12.5" fill={BARK} fillOpacity="0.75">
              no papers to split
            </text>
          ) : (
            tiers[sel].bars.map((v, k) => {
              const barW = 46;
              const gap = 38;
              const x = 14 + k * (barW + gap);
              const h = Math.max(3, v * 100);
              const colors = [FOREST, "#B45A34", BARK];
              const labels = ["supports", "conflicts", "unclear"];
              return (
                <g key={labels[k]}>
                  <rect
                    x={x}
                    y={108 - h}
                    width={barW}
                    height={h}
                    rx="7"
                    fill={colors[k]}
                    fillOpacity="0.85"
                    style={{ transition: "y 0.4s ease, height 0.4s ease" }}
                  />
                  <text
                    x={x + barW / 2}
                    y="126"
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontSize="11"
                    fontWeight="600"
                    fill={BARK}
                  >
                    {labels[k]}
                  </text>
                </g>
              );
            })
          )}
        </g>
        <text x="24" y="228" fontFamily={FONT} fontSize="14" fontWeight="600" fill={INK}>
          {tiers[sel].weighed}
        </text>
        <text x="24" y="248" fontFamily={FONT} fontSize="12" fill={BARK}>
          {tiers[sel].strength}
        </text>
      </g>

      {/* ③ the citations */}
      <g transform="translate(792 96)">
        <rect width="336" height="264" rx="20" fill="white" />
        <rect width="336" height="264" rx="20" fill="none" stroke={INK} strokeOpacity="0.1" />
        <text x="24" y="40" fontFamily={FONT} fontSize="11" fontWeight="700" letterSpacing="1.5" fill={BARK}>
          CITED IN THE ANSWER
        </text>
        {/* Tiers that can't cite anything show an explicit empty state rather
            than a shorter list of the same rows — that IS the point of those
            two verdicts. */}
        {tiers[sel].cites === 0 && (
          <g transform="translate(24 56)">
            <rect
              width="288"
              height="112"
              rx="14"
              fill={INK}
              fillOpacity="0.03"
              stroke={INK}
              strokeOpacity="0.12"
              strokeDasharray="6 6"
            />
            <text x="144" y="52" textAnchor="middle" fontFamily={FONT} fontSize="13.5" fontWeight="600" fill={BARK}>
              no citations
            </text>
            <text x="144" y="74" textAnchor="middle" fontFamily={FONT} fontSize="12" fill={BARK} fillOpacity="0.8">
              nothing was retrieved to cite
            </text>
          </g>
        )}
        {Array.from({ length: tiers[sel].cites }, (_, i) => i).map((i) => (
          // Key includes `sel` on purpose: changing tier remounts these rows,
          // which restarts the one-shot roll-in. Without it React would reuse
          // the nodes and the new tier's citations would just pop in.
          <g key={`${sel}-${i}`} transform={`translate(24 ${56 + i * 62})`}>
            {/* No animation-delay: with fill-mode omitted, a delay would show
                the resting state first and then snap to the from-state, which
                reads as a flicker. All rows roll in together instead. */}
            <g className="pa-cite">
              <rect width="288" height="50" rx="14" fill={OK_BG} stroke={FOREST} strokeOpacity="0.45" />
              <rect x="12" y="13" width="24" height="24" rx="7" fill={FOREST} />
              <text x="24" y="30" textAnchor="middle" fontFamily={FONT} fontSize="12" fontWeight="700" fill={CANVAS}>
                {i + 1}
              </text>
              <rect x="48" y="14" width={196 - i * 34} height="8" rx="4" fill={INK} fillOpacity="0.45" />
              <rect x="48" y="29" width={128 - i * 22} height="7" rx="3.5" fill={BARK} fillOpacity="0.8" />
              {/* the external-link tick, so it reads as clickable */}
              <path
                d={`M266 20 L276 20 L276 30`}
                fill="none"
                stroke={FOREST}
                strokeOpacity="0.9"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M276 20 L262 34" fill="none" stroke={FOREST} strokeOpacity="0.9" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          </g>
        ))}
        <text x="24" y="248" fontFamily={FONT} fontSize="12.5" fill={BARK}>
          {tiers[sel].citeNote}
        </text>
      </g>

      <Beat x={72} n={1} text="one of five tiers, never true/false" />
      <Beat x={470} n={2} text="how much research is behind it" />
      <Beat x={792} n={3} text="the sources, clickable" />
    </Plate>
  );
}
