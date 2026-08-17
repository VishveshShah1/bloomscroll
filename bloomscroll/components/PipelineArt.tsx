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
      <path
        d="M62 -7 L74 0 L62 7"
        fill="none"
        stroke={FOREST}
        strokeOpacity="0.75"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  label,
  id,
}: {
  children: React.ReactNode;
  label: string;
  id: string;
}) {
  return (
    // `h-auto` matters: these are no longer wrapped in ScreenFrame's
    // aspect-ratio box, so the SVG has to derive its own height from the
    // viewBox. With `h-full` and an auto-height parent it collapses to nothing.
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden="true">
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
      <text
        x="34"
        y="44"
        fontFamily={FONT}
        fontSize="11.5"
        fontWeight="700"
        letterSpacing="1.8"
        fill={FOREST}
        fillOpacity="1"
      >
        {label}
      </text>
    </svg>
  );
}

/** Stage 1 — reading the source: a post, a share, and the claim landing in
 *  the checker. */
export function PipePasteArt() {
  return (
    <Plate id="paste" label="READING THE SOURCE">
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
            <path
              d="M44 78 L44 96 C44 104 54 106 56.5 100 C58 94.5 51 92.5 48.5 96"
              fill="none"
              stroke={FOREST}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <text x="70" y="96" fontFamily={FONT} fontSize="15" fontWeight="600" fill={FOREST}>
              bloomscroll
            </text>
          </g>
        </g>
        {/* other, greyed share targets */}
        {[0, 1].map((i) => (
          <rect key={i} x="20" y={130 + i * 34} width="190" height="24" rx="12" fill={INK} fillOpacity="0.06" />
        ))}
        {/* tap dot on the bloomscroll row */}
        <circle className="pa-tap" cx="115" cy="90" r="26" fill={FOREST} fillOpacity="0.16" />
        <circle cx="115" cy="90" r="7" fill={FOREST} fillOpacity="0.5" />
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
        <g className="pa-slide">
          <text x="40" y="82" fontFamily={FONT} fontSize="14" fill={INK} fillOpacity="0.85">
            &ldquo;mewing reshapes your
          </text>
          <text x="40" y="103" fontFamily={FONT} fontSize="14" fill={INK} fillOpacity="0.85">
            jawline&rdquo;
          </text>
        </g>
        <rect className="pa-caret" x="150" y="88" width="2" height="18" rx="1" fill={FOREST} />
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
  const chips = [
    { y: 92, w: 300, label: "mewing reshapes the jawline" },
    { y: 168, w: 268, label: "it works on adults too" },
    { y: 244, w: 246, label: "results in 6 months" },
  ];
  return (
    <Plate id="extract" label="FINDING THE REAL CLAIMS">
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
        <g key={c.label} transform={`translate(644 ${c.y})`}>
          <g className="pa-leaf" style={{ animationDelay: `${0.35 + i * 0.45}s` }}>
            <path
              d="M-18 26 C-34 12, -26 -8, -4 -5 C8 -3, 10 12, -2 21 Z"
              fill={SPROUT}
              fillOpacity="0.6"
            />
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

      <g transform="translate(644 314)">
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
  const nodes = [
    { a: -74, r: 96 }, { a: -30, r: 132 }, { a: 12, r: 92 },
    { a: 54, r: 136 }, { a: 98, r: 104 }, { a: 142, r: 130 },
    { a: 180, r: 96 }, { a: 216, r: 134 }, { a: -142, r: 122 },
    { a: -106, r: 142 }, { a: 36, r: 176 }, { a: 156, r: 172 },
    { a: -52, r: 174 }, { a: 116, r: 170 },
  ];
  const cx = 290;
  const cy = 216;
  return (
    <Plate id="search" label="SEARCHING THE LITERATURE">
      {[96, 134, 176].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={FOREST} strokeOpacity="0.24" strokeWidth="1.5" strokeDasharray="3 9" />
      ))}

      <g className="pa-sweep-arm" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <path d={`M${cx} ${cy} L${cx + 182} ${cy - 66} A194 194 0 0 1 ${cx + 182} ${cy + 66} Z`} fill={SPROUT} fillOpacity="0.3" />
        <line x1={cx} y1={cy} x2={cx + 194} y2={cy} stroke={FOREST} strokeOpacity="0.65" strokeWidth="2" />
      </g>

      {nodes.map((n, i) => {
        const rad = (n.a * Math.PI) / 180;
        const x = cx + Math.cos(rad) * n.r;
        const y = cy + Math.sin(rad) * n.r;
        const matched = i % 3 === 0;
        return (
          <g key={i} className="pa-node" style={{ animationDelay: `${(i % 6) * 0.32}s` }}>
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
      <path
        d={`M${cx - 9} ${cy - 18} L${cx - 9} ${cy + 7} C${cx - 9} ${cy + 19} ${cx + 7} ${cy + 21} ${cx + 10} ${cy + 12} C${cx + 12} ${cy + 4} ${cx + 3} ${cy + 1} ${cx} ${cy + 7}`}
        fill="none"
        stroke={FOREST}
        strokeWidth="3.8"
        strokeLinecap="round"
      />

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
  const tiers = [
    { label: "SUPPORTED", fill: "#1E4D2B", text: "#F6F3EA" },
    { label: "MIXED EVIDENCE", fill: "#B78628", text: "#FDF7E6" },
    { label: "WEAK EVIDENCE", fill: "#B45A34", text: "#FBEDDE" },
    { label: "NO EVIDENCE", fill: "#3F5049", text: "#EBEFEB" },
    { label: "NOT TESTABLE", fill: "#615A82", text: "#EEEBF6" },
  ];
  return (
    <Plate id="grade" label="WEIGHING THE EVIDENCE">
      {/* ① the five-tier scale */}
      <g transform="translate(72 82)">
        {tiers.map((t, i) => (
          <g key={t.label} transform={`translate(0 ${i * 56})`}>
            <rect width="286" height="42" rx="21" fill={t.fill} fillOpacity={i === 2 ? 1 : 0.28} />
            <text
              x="22"
              y="27"
              fontFamily={FONT}
              fontSize="12.5"
              fontWeight="700"
              letterSpacing="1.2"
              fill={i === 2 ? t.text : INK}
              fillOpacity={i === 2 ? 1 : 0.6}
            >
              {t.label}
            </text>
          </g>
        ))}
        {/* marker settling on the graded tier (weak, for the mewing claim) */}
        <g transform="translate(300 112)">
          <g className="pa-marker">
            <circle className="pa-glow" cx="14" cy="21" r="24" fill={FOREST} fillOpacity="0.18" />
            <path d="M0 10 L20 21 L0 32 Z" fill={FOREST} />
          </g>
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
        <g transform="translate(24 70)">
          {[52, 84, 64, 104, 38, 74].map((h, i) => (
            <rect
              key={i}
              className="pa-bar"
              style={{ animationDelay: `${i * 0.11}s`, transformOrigin: `${i * 40 + 10}px 116px` }}
              x={i * 40}
              y={116 - h}
              width="20"
              height={h}
              rx="6"
              fill={FOREST}
              fillOpacity={0.5 + i * 0.09}
            />
          ))}
          <line x1="0" y1="120" x2="238" y2="120" stroke={INK} strokeOpacity="0.14" strokeWidth="1.5" />

          {/* climbing trend line over the bar tops */}
          <path
            className="pa-climb"
            d="M10 64 L50 32 L90 52 L130 12 L170 78 L210 42"
            fill="none"
            stroke={SPROUT}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="pa-climb-head">
            <circle cx="210" cy="42" r="7.5" fill={CANVAS} stroke={SPROUT} strokeWidth="3" />
            <path
              d="M222 30 L240 12 M240 12 L226 12 M240 12 L240 26"
              fill="none"
              stroke={SPROUT}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
        <text x="24" y="228" fontFamily={FONT} fontSize="14" fontWeight="600" fill={INK}>
          48 papers weighed
        </text>
        <text x="24" y="248" fontFamily={FONT} fontSize="12.5" fill={BARK}>
          mostly small, none in adults
        </text>
      </g>

      {/* ③ the citations */}
      <g transform="translate(792 96)">
        <rect width="336" height="264" rx="20" fill="white" />
        <rect width="336" height="264" rx="20" fill="none" stroke={INK} strokeOpacity="0.1" />
        <text x="24" y="40" fontFamily={FONT} fontSize="11" fontWeight="700" letterSpacing="1.5" fill={BARK}>
          CITED IN THE ANSWER
        </text>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(24 ${56 + i * 62})`}>
            <g className="pa-cite" style={{ animationDelay: `${0.6 + i * 0.26}s` }}>
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
          every one opens the real paper
        </text>
      </g>

      <Beat x={72} n={1} text="one of five tiers, never true/false" />
      <Beat x={470} n={2} text="how much research is behind it" />
      <Beat x={792} n={3} text="the sources, clickable" />
    </Plate>
  );
}
