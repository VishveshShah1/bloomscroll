/**
 * Placeholder art for the landing page. SVG compositions in the forest-green
 * system, standing in for real product screenshots until captures exist.
 * Every visual on the landing page comes from one of these, so nothing sits
 * "broken." When a real PNG lands in public/screenshots/ the ScreenFrame
 * wrapper prefers it and the SVG stays as fallback.
 *
 * The compositions here are intentionally abstract — generic device chrome,
 * generic post shapes, and generic control icons — so they never impersonate
 * real platforms or brands.
 */

const CANVAS = "#F6F3EA";
const MOSS = "#E8EDDE";
const FOREST = "#1E4D2B";
const SPROUT = "#4A8B5A";
const INK = "#12201A";
const BARK = "#5B6B5E";
const WEAK_BG = "#F1E1CE";
const WEAK_BORDER = "#DCC29A";
const WEAK_INK = "#7A4E1B";
const OK_BG = "#DDE7DA";
const OK_BORDER = "#B8CCB8";
const OK_INK = "#204628";

/** Small "supported" chip used inside multiple compositions. Optionally
 *  pulses to feel alive. */
function VerdictBadge({
  x = 0,
  y = 0,
  label = "SUPPORTED",
  variant = "supported" as "supported" | "weak",
  pulse = false,
}) {
  const c =
    variant === "weak"
      ? { bg: WEAK_BG, border: WEAK_BORDER, text: WEAK_INK }
      : { bg: OK_BG, border: OK_BORDER, text: OK_INK };
  const w = label.length * 6.6 + 26;
  return (
    <g transform={`translate(${x} ${y})`}>
      {pulse && (
        <rect
          x="-2"
          y="-2"
          width={w + 4}
          height="30"
          rx="15"
          fill="none"
          stroke={FOREST}
          strokeOpacity="0.35"
        >
          <animate attributeName="stroke-opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="x" values="-2;-6;-2" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="y" values="-2;-6;-2" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="width" values={`${w + 4};${w + 12};${w + 4}`} dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="height" values="30;38;30" dur="2.4s" repeatCount="indefinite" />
        </rect>
      )}
      <rect x="0" y="0" width={w} height="26" rx="13" fill={c.bg} stroke={c.border} />
      <text
        x={w / 2}
        y="17.5"
        textAnchor="middle"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="0.6"
        fill={c.text}
      >
        {label}
      </text>
    </g>
  );
}

/** Mini bar chart of evidence strength — used inside claim/verdict cards. */
function EvidenceBars({ x = 0, y = 0 }) {
  // Heights read as "3 supporting studies, 1 mixed, 1 weak"
  const bars = [
    { h: 34, color: FOREST },
    { h: 28, color: FOREST },
    { h: 22, color: SPROUT },
    { h: 14, color: SPROUT },
    { h: 10, color: BARK },
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={i * 14} y={40 - b.h} width="8" height={b.h} rx="2" fill={b.color} opacity="0.9" />
        </g>
      ))}
      <line x1="-4" y1="42" x2="76" y2="42" stroke={INK} strokeOpacity="0.14" strokeWidth="1" />
    </g>
  );
}

/** Mini illustration per use-case card. Shows what "checking a post" looks
 *  like across formats, without infringing on platform brand marks. */
export function UseCaseArt({ kind }: { kind: string }) {
  const commonProps = { viewBox: "0 0 300 210", className: "h-full w-full", "aria-hidden": true };

  if (kind === "TikTok") {
    // Vertical video frame with generic side action rail.
    return (
      <svg {...commonProps}>
        <rect x="8" y="8" width="284" height="194" rx="14" fill={MOSS} />
        {/* phone frame */}
        <rect x="102" y="18" width="118" height="176" rx="16" fill="#0F1611" />
        <rect x="106" y="24" width="110" height="164" rx="12" fill="#1A2A20" />
        {/* video content */}
        <circle cx="161" cy="106" r="22" fill="white" opacity="0.92" />
        <polygon points="154,96 154,116 172,106" fill="#0F1611" />
        {/* creator avatar + caption skeleton */}
        <circle cx="118" cy="168" r="7" fill={SPROUT} />
        <rect x="130" y="164" width="50" height="5" rx="2.5" fill="white" opacity="0.85" />
        <rect x="130" y="174" width="34" height="4" rx="2" fill="white" opacity="0.55" />
        {/* right rail action stack */}
        <g fill="white" opacity="0.85">
          <circle cx="234" cy="60" r="7" fill="none" stroke="white" strokeWidth="1.4" />
          <path d="M231 58c1.8-1.6 4.2-1.6 6 0-.2 2.2-3 4.4-3 4.4s-2.8-2.2-3-4.4z" />
          <circle cx="234" cy="90" r="7" fill="none" stroke="white" strokeWidth="1.4" />
          <path d="M232 88h4v3l-2 2-2-2z" />
          <circle cx="234" cy="120" r="7" fill="none" stroke="white" strokeWidth="1.4" />
          <path d="M231 118l3 2 3-2M234 120v4" strokeWidth="1.4" stroke="white" fill="none" />
        </g>
        <VerdictBadge x={18} y={176} pulse />
      </svg>
    );
  }
  if (kind === "YouTube") {
    // Horizontal video card with progress bar + title/meta skeleton.
    return (
      <svg {...commonProps}>
        <rect x="8" y="8" width="284" height="194" rx="14" fill={MOSS} />
        <rect x="22" y="22" width="256" height="118" rx="10" fill="#0F1611" />
        {/* fake play indicator */}
        <circle cx="150" cy="81" r="20" fill="white" opacity="0.94" />
        <polygon points="144,71 144,91 162,81" fill="#0F1611" />
        {/* fake progress bar */}
        <rect x="30" y="132" width="240" height="3" rx="1.5" fill="white" opacity="0.28" />
        <rect x="30" y="132" width="150" height="3" rx="1.5" fill="#E44D42" opacity="0.85" />
        <circle cx="180" cy="133.5" r="4" fill="#E44D42" opacity="0.9" />
        {/* below: avatar, title, meta */}
        <circle cx="34" cy="158" r="10" fill={SPROUT} />
        <rect x="50" y="150" width="150" height="8" rx="4" fill={INK} opacity="0.7" />
        <rect x="50" y="164" width="90" height="6" rx="3" fill={BARK} />
        <VerdictBadge x={188} y={178} pulse />
      </svg>
    );
  }
  if (kind === "Reddit") {
    // Post with vote column, header, and text lines.
    return (
      <svg {...commonProps}>
        <rect x="8" y="8" width="284" height="194" rx="14" fill={MOSS} />
        <rect x="22" y="22" width="256" height="152" rx="10" fill="white" stroke={INK} strokeOpacity="0.08" />
        {/* vote column */}
        <g stroke={BARK} strokeWidth="1.5" fill="none">
          <path d="M40 40 L34 46 L46 46 Z" fill={FOREST} stroke={FOREST} />
          <path d="M40 70 L34 64 L46 64 Z" fill="none" />
        </g>
        <text
          x="40"
          y="60"
          textAnchor="middle"
          fontFamily="-apple-system, Inter, sans-serif"
          fontSize="12"
          fontWeight="700"
          fill={FOREST}
        >
          412
        </text>
        {/* header row */}
        <circle cx="70" cy="42" r="7" fill={SPROUT} />
        <rect x="82" y="38" width="120" height="6" rx="3" fill={INK} opacity="0.6" />
        <rect x="82" y="48" width="72" height="5" rx="2.5" fill={BARK} />
        {/* title line */}
        <rect x="60" y="66" width="190" height="8" rx="4" fill={INK} opacity="0.75" />
        <rect x="60" y="80" width="150" height="8" rx="4" fill={INK} opacity="0.75" />
        {/* body lines */}
        <rect x="60" y="98" width="200" height="6" rx="3" fill={BARK} />
        <rect x="60" y="110" width="180" height="6" rx="3" fill={BARK} />
        <rect x="60" y="122" width="140" height="6" rx="3" fill={BARK} />
        <VerdictBadge x={20} y={180} pulse />
      </svg>
    );
  }
  if (kind === "Articles") {
    // Two-column magazine-style article.
    return (
      <svg {...commonProps}>
        <rect x="8" y="8" width="284" height="194" rx="14" fill={MOSS} />
        <rect x="22" y="22" width="256" height="152" rx="10" fill="white" stroke={INK} strokeOpacity="0.08" />
        {/* section eyebrow */}
        <text
          x="36"
          y="42"
          fontFamily="-apple-system, Inter, sans-serif"
          fontSize="9"
          fontWeight="700"
          letterSpacing="1.4"
          fill={FOREST}
        >
          HEALTH
        </text>
        {/* serif-ish title */}
        <text
          x="36"
          y="66"
          fontFamily="ui-serif, Georgia, serif"
          fontSize="18"
          fontWeight="700"
          fill={INK}
        >
          A new study says…
        </text>
        {/* byline */}
        <rect x="36" y="76" width="110" height="5" rx="2.5" fill={BARK} />
        {/* two columns */}
        <g>
          <rect x="36" y="94" width="110" height="6" rx="3" fill={INK} opacity="0.55" />
          <rect x="36" y="106" width="110" height="6" rx="3" fill={INK} opacity="0.55" />
          <rect x="36" y="118" width="96" height="6" rx="3" fill={INK} opacity="0.55" />
          <rect x="36" y="130" width="110" height="6" rx="3" fill={INK} opacity="0.55" />
          <rect x="36" y="142" width="82" height="6" rx="3" fill={INK} opacity="0.55" />
        </g>
        <g>
          <rect x="158" y="94" width="106" height="6" rx="3" fill={INK} opacity="0.55" />
          <rect x="158" y="106" width="106" height="6" rx="3" fill={INK} opacity="0.55" />
          <rect x="158" y="118" width="80" height="6" rx="3" fill={INK} opacity="0.55" />
          <rect x="158" y="130" width="106" height="6" rx="3" fill={INK} opacity="0.55" />
          <rect x="158" y="142" width="72" height="6" rx="3" fill={INK} opacity="0.55" />
        </g>
        <VerdictBadge x={188} y={178} pulse />
      </svg>
    );
  }
  if (kind === "Diet") {
    return (
      <svg {...commonProps}>
        <rect x="8" y="8" width="284" height="194" rx="14" fill={MOSS} />
        <rect x="22" y="22" width="256" height="152" rx="10" fill="white" stroke={INK} strokeOpacity="0.08" />
        {/* macro ring */}
        <circle cx="68" cy="76" r="26" fill="none" stroke={FOREST} strokeWidth="6" opacity="0.28" />
        <circle
          cx="68"
          cy="76"
          r="26"
          fill="none"
          stroke={FOREST}
          strokeWidth="6"
          strokeDasharray="118 168"
          strokeLinecap="round"
          transform="rotate(-90 68 76)"
        />
        <text x="68" y="80" textAnchor="middle" fontFamily="-apple-system, Inter, sans-serif" fontSize="13" fontWeight="700" fill={INK}>
          73%
        </text>
        <text x="68" y="118" textAnchor="middle" fontFamily="-apple-system, Inter, sans-serif" fontSize="9" fontWeight="600" letterSpacing="0.8" fill={BARK}>
          KCAL
        </text>
        {/* right-side macro table */}
        <g fontFamily="-apple-system, Inter, sans-serif" fontSize="10">
          <text x="118" y="46" fontWeight="700" fill={INK}>Protein</text>
          <rect x="180" y="38" width="70" height="6" rx="3" fill={MOSS} />
          <rect x="180" y="38" width="52" height="6" rx="3" fill={FOREST} />
          <text x="256" y="46" fill={BARK}>78g</text>

          <text x="118" y="66" fontWeight="700" fill={INK}>Carbs</text>
          <rect x="180" y="58" width="70" height="6" rx="3" fill={MOSS} />
          <rect x="180" y="58" width="38" height="6" rx="3" fill={SPROUT} />
          <text x="256" y="66" fill={BARK}>145g</text>

          <text x="118" y="86" fontWeight="700" fill={INK}>Fat</text>
          <rect x="180" y="78" width="70" height="6" rx="3" fill={MOSS} />
          <rect x="180" y="78" width="24" height="6" rx="3" fill={BARK} />
          <text x="256" y="86" fill={BARK}>44g</text>

          <text x="118" y="106" fontWeight="700" fill={INK}>Fiber</text>
          <rect x="180" y="98" width="70" height="6" rx="3" fill={MOSS} />
          <rect x="180" y="98" width="30" height="6" rx="3" fill={SPROUT} opacity="0.8" />
          <text x="256" y="106" fill={BARK}>21g</text>
        </g>
        <rect x="36" y="138" width="220" height="6" rx="3" fill={INK} opacity="0.32" />
        <rect x="36" y="150" width="180" height="6" rx="3" fill={INK} opacity="0.32" />
        <VerdictBadge x={188} y={178} pulse />
      </svg>
    );
  }
  // Skincare (default) — ingredient list + product card.
  return (
    <svg {...commonProps}>
      <rect x="8" y="8" width="284" height="194" rx="14" fill={MOSS} />
      <rect x="22" y="22" width="120" height="152" rx="14" fill="white" stroke={INK} strokeOpacity="0.08" />
      {/* bottle */}
      <rect x="60" y="46" width="44" height="10" rx="4" fill={INK} opacity="0.55" />
      <path d="M50 60 h64 v58 c0 12 -14 22 -32 22 s-32 -10 -32 -22 z" fill={SPROUT} opacity="0.35" />
      <path d="M50 60 h64 v58 c0 12 -14 22 -32 22 s-32 -10 -32 -22 z" fill="none" stroke={FOREST} strokeOpacity="0.4" strokeWidth="1.4" />
      <rect x="60" y="98" width="44" height="30" rx="4" fill="white" />
      <rect x="66" y="106" width="32" height="4" rx="2" fill={INK} opacity="0.7" />
      <rect x="66" y="115" width="26" height="3" rx="1.5" fill={BARK} />
      <rect x="66" y="122" width="20" height="3" rx="1.5" fill={BARK} />
      {/* ingredient list on the right */}
      <g fontFamily="-apple-system, Inter, sans-serif" fontSize="10.5">
        <text x="158" y="42" fontWeight="700" fill={INK}>Ingredients</text>
        {[
          { name: "Niacinamide", pct: "5%" },
          { name: "Retinol", pct: "0.3%" },
          { name: "Peptides", pct: "2%" },
          { name: "Hyaluronic", pct: "1%" },
        ].map((row, i) => (
          <g key={row.name} transform={`translate(158 ${58 + i * 20})`}>
            <circle cx="4" cy="8" r="3" fill={i < 2 ? FOREST : SPROUT} />
            <text x="14" y="12" fill={INK} fontWeight="500">{row.name}</text>
            <text x="94" y="12" fill={BARK}>{row.pct}</text>
          </g>
        ))}
      </g>
      <VerdictBadge x={20} y={180} pulse />
    </svg>
  );
}

/** Phone-mockup frame — vertical device, subtle chrome, one notch. Used
 *  as the primary hero graphic since most users check claims on their phone. */
export function PhoneHeroArt() {
  return (
    <svg viewBox="0 0 400 820" className="h-full w-full" aria-hidden="true">
      {/* soft ground shadow */}
      <ellipse cx="200" cy="805" rx="140" ry="10" fill={INK} opacity="0.08" />
      {/* device body */}
      <rect x="10" y="10" width="380" height="800" rx="62" fill={INK} />
      {/* inner glass */}
      <rect x="20" y="20" width="360" height="780" rx="54" fill={CANVAS} />
      {/* notch */}
      <rect x="152" y="26" width="96" height="24" rx="12" fill={INK} />

      {/* status bar */}
      <text
        x="46"
        y="80"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="12"
        fontWeight="600"
        fill={INK}
      >
        9:41
      </text>
      <g transform="translate(310 68)" fill={INK}>
        <rect x="0" y="8" width="3" height="4" rx="0.5" />
        <rect x="5" y="6" width="3" height="6" rx="0.5" />
        <rect x="10" y="4" width="3" height="8" rx="0.5" />
        <rect x="15" y="2" width="3" height="10" rx="0.5" />
        <rect x="26" y="4" width="22" height="10" rx="2.5" fill="none" stroke={INK} strokeWidth="1.2" />
        <rect x="28" y="6" width="16" height="6" rx="1.5" />
      </g>

      {/* content — anti-doomscroll label */}
      <text
        x="40"
        y="122"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="11"
        fontWeight="700"
        letterSpacing="1.5"
        fill={FOREST}
      >
        THE ANTI-DOOMSCROLL
      </text>
      <text
        x="40"
        y="160"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="26"
        fontWeight="600"
        fill={INK}
      >
        What are we
      </text>
      <text
        x="40"
        y="192"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="26"
        fontWeight="600"
        fill={INK}
      >
        checking?
      </text>

      {/* input pill */}
      <rect x="40" y="216" width="320" height="52" rx="14" fill="white" stroke={INK} strokeOpacity="0.08" />
      <text
        x="56"
        y="248"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="13"
        fill={INK}
      >
        Daily sunscreen prevents…
      </text>
      <rect x="288" y="224" width="60" height="36" rx="18" fill={FOREST} />
      <text
        x="318"
        y="247"
        textAnchor="middle"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="12"
        fontWeight="600"
        fill={CANVAS}
      >
        check
      </text>

      {/* result card */}
      <rect x="40" y="288" width="320" height="450" rx="20" fill="white" stroke={INK} strokeOpacity="0.06" />

      <text
        x="60"
        y="316"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1.4"
        fill={BARK}
      >
        THE CLAIM
      </text>
      <text
        x="60"
        y="344"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="17"
        fontWeight="600"
        fontStyle="italic"
        fill={INK}
      >
        &ldquo;Daily sunscreen use
      </text>
      <text
        x="60"
        y="368"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="17"
        fontWeight="600"
        fontStyle="italic"
        fill={INK}
      >
        reduces skin cancer risk.&rdquo;
      </text>

      {/* verdict pill with subtle pulse */}
      <VerdictBadge x={60} y={386} pulse />

      {/* body lines */}
      <rect x="60" y="430" width="280" height="7" rx="3.5" fill={INK} fillOpacity="0.1" />
      <rect x="60" y="444" width="260" height="7" rx="3.5" fill={INK} fillOpacity="0.1" />
      <rect x="60" y="458" width="200" height="7" rx="3.5" fill={INK} fillOpacity="0.1" />

      {/* evidence strength gauge */}
      <text
        x="60"
        y="498"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1.4"
        fill={BARK}
      >
        EVIDENCE STRENGTH
      </text>
      <EvidenceBars x={60} y={510} />
      <text
        x="150"
        y="536"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="11"
        fontWeight="600"
        fill={INK}
      >
        5 studies weighed
      </text>
      <text
        x="150"
        y="550"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="10"
        fill={BARK}
      >
        2 large trials, 1 review, 2 cohorts
      </text>

      {/* cited label */}
      <text
        x="60"
        y="588"
        fontFamily="-apple-system, Inter, sans-serif"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1.4"
        fill={BARK}
      >
        CITED IN THE ANSWER
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(60 ${600 + i * 44})`}>
          <rect
            x="0"
            y="0"
            width="280"
            height="36"
            rx="10"
            fill="#DDE7DA"
            fillOpacity="0.55"
            stroke={FOREST}
            strokeOpacity="0.3"
          />
          {/* citation number chip */}
          <rect x="8" y="8" width="20" height="20" rx="5" fill={FOREST} />
          <text
            x="18"
            y="22"
            textAnchor="middle"
            fontFamily="-apple-system, Inter, sans-serif"
            fontSize="11"
            fontWeight="700"
            fill={CANVAS}
          >
            {i + 1}
          </text>
          <rect x="36" y="8" width={160 + i * 24} height="7" rx="3.5" fill={INK} fillOpacity="0.5" />
          <rect x="36" y="21" width={90 + i * 18} height="6" rx="3" fill={BARK} />
        </g>
      ))}

      {/* home indicator */}
      <rect x="140" y="778" width="120" height="4" rx="2" fill={INK} opacity="0.4" />
    </svg>
  );
}

/** Browser-chrome window that wraps step art in the hero + how-it-works. */
function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 640 460" className="h-full w-full" aria-hidden="true">
      <rect x="6" y="6" width="628" height="448" rx="20" fill={CANVAS} />
      <rect
        x="6"
        y="6"
        width="628"
        height="448"
        rx="20"
        fill="none"
        stroke={INK}
        strokeOpacity="0.08"
      />
      {/* title bar */}
      <rect x="6" y="6" width="628" height="38" rx="20" fill={MOSS} />
      <rect x="6" y="30" width="628" height="14" fill={MOSS} />
      <circle cx="26" cy="25" r="5" fill={INK} fillOpacity="0.18" />
      <circle cx="44" cy="25" r="5" fill={INK} fillOpacity="0.18" />
      <circle cx="62" cy="25" r="5" fill={INK} fillOpacity="0.18" />
      {/* url pill */}
      <rect x="220" y="14" width="200" height="22" rx="11" fill={CANVAS} />
      <rect
        x="220"
        y="14"
        width="200"
        height="22"
        rx="11"
        fill="none"
        stroke={INK}
        strokeOpacity="0.1"
      />
      <text
        x="320"
        y="29"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="10"
        fill={BARK}
      >
        bloomscroll.com/check
      </text>
      {children}
    </svg>
  );
}

/** Hero: a full claim card with verdict + summary + citations. */
export function HeroArt() {
  return (
    <BrowserChrome>
      <g transform="translate(40 72)">
        <rect x="0" y="0" width="560" height="356" rx="18" fill="white" />
        <rect
          x="0"
          y="0"
          width="560"
          height="356"
          rx="18"
          fill="none"
          stroke={INK}
          strokeOpacity="0.06"
        />
        <text
          x="24"
          y="34"
          fontFamily="-apple-system, Inter, sans-serif"
          fontSize="10"
          fontWeight="600"
          letterSpacing="1.4"
          fill={BARK}
        >
          THE CLAIM
        </text>
        <text x="24" y="64" fontFamily="-apple-system, Inter, sans-serif" fontSize="20" fontWeight="600" fontStyle="italic" fill={INK}>
          &ldquo;Daily sunscreen use reduces
        </text>
        <text x="24" y="92" fontFamily="-apple-system, Inter, sans-serif" fontSize="20" fontWeight="600" fontStyle="italic" fill={INK}>
          long-term skin cancer risk.&rdquo;
        </text>
        <VerdictBadge x={24} y={116} pulse />
        <text
          x="152"
          y="134"
          fontFamily="-apple-system, Inter, sans-serif"
          fontSize="12.5"
          fontWeight="500"
          fill={BARK}
        >
          Multiple decent studies point the same way.
        </text>
        <text x="24" y="176" fontFamily="-apple-system, Inter, sans-serif" fontSize="10" fontWeight="600" letterSpacing="1.4" fill={BARK}>
          WHY THIS VERDICT
        </text>
        <rect x="24" y="188" width="512" height="8" rx="4" fill={INK} fillOpacity="0.1" />
        <rect x="24" y="204" width="480" height="8" rx="4" fill={INK} fillOpacity="0.1" />
        <rect x="24" y="220" width="360" height="8" rx="4" fill={INK} fillOpacity="0.1" />
        <text x="24" y="256" fontFamily="-apple-system, Inter, sans-serif" fontSize="10" fontWeight="600" letterSpacing="1.4" fill={BARK}>
          CITED IN THE ANSWER
        </text>
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(24 ${268 + i * 42})`}>
            <rect x="0" y="0" width="512" height="34" rx="10" fill="#DDE7DA" fillOpacity="0.55" stroke={FOREST} strokeOpacity="0.3" />
            <rect x="8" y="8" width="18" height="18" rx="4" fill={FOREST} />
            <text x="17" y="20" textAnchor="middle" fontFamily="-apple-system, Inter, sans-serif" fontSize="10" fontWeight="700" fill={CANVAS}>{i + 1}</text>
            <rect x="34" y="10" width={220 - i * 40} height="7" rx="3.5" fill={INK} fillOpacity="0.5" />
            <rect x="34" y="21" width={120 - i * 20} height="6" rx="3" fill={BARK} />
          </g>
        ))}
      </g>
    </BrowserChrome>
  );
}

/** Step 1: input being filled, with a blinking caret + suggestion chips. */
export function StepInputArt() {
  return (
    <BrowserChrome>
      <g transform="translate(40 96)">
        <text x="0" y="0" fontFamily="-apple-system, Inter, sans-serif" fontSize="11" fontWeight="600" letterSpacing="1.5" fill={FOREST}>
          THE ANTI-DOOMSCROLL
        </text>
        <text x="0" y="34" fontFamily="-apple-system, Inter, sans-serif" fontSize="24" fontWeight="600" fill={INK}>
          What are we checking?
        </text>
        <rect x="0" y="72" width="560" height="70" rx="16" fill="white" stroke={INK} strokeOpacity="0.08" />
        <text x="20" y="112" fontFamily="-apple-system, Inter, sans-serif" fontSize="15" fill={INK}>
          Daily sunscreen use reduces long-term skin cancer risk
        </text>
        {/* blinking cursor */}
        <rect x="420" y="98" width="2" height="20" fill={FOREST}>
          <animate attributeName="opacity" values="1;0;1" dur="1.05s" repeatCount="indefinite" />
        </rect>
        <rect x="440" y="86" width="102" height="42" rx="21" fill={FOREST} />
        <text x="491" y="112" textAnchor="middle" fontFamily="-apple-system, Inter, sans-serif" fontSize="13" fontWeight="600" fill={CANVAS}>
          check
        </text>

        {/* try-one chips row */}
        <g transform="translate(0 168)">
          <text x="0" y="10" fontFamily="-apple-system, Inter, sans-serif" fontSize="11" fontWeight="500" letterSpacing="1" fill={BARK}>
            TRY ONE
          </text>
          {[
            { x: 62, w: 158, label: "mewing reshapes jaw" },
            { x: 230, w: 174, label: "cold plunges burn fat" },
            { x: 414, w: 138, label: "retinol at 22?" },
          ].map((c) => (
            <g key={c.label}>
              <rect x={c.x} y="0" width={c.w} height="26" rx="13" fill="white" stroke={INK} strokeOpacity="0.1" />
              <text x={c.x + c.w / 2} y="17" textAnchor="middle" fontFamily="-apple-system, Inter, sans-serif" fontSize="11" fill={INK}>
                {c.label}
              </text>
            </g>
          ))}
        </g>

        {/* mini source-source hint */}
        <g transform="translate(0 210)">
          <circle cx="6" cy="8" r="4" fill={SPROUT} />
          <text x="18" y="12" fontFamily="-apple-system, Inter, sans-serif" fontSize="11" fill={BARK}>
            we&apos;ll search Europe PMC — 45M+ peer-reviewed papers.
          </text>
        </g>
      </g>
    </BrowserChrome>
  );
}

/** Step 2: pipeline in flight — progress rows + source-scan mini-panel. */
export function StepScanArt() {
  const rows = [
    { label: "reading the source", pct: 100 },
    { label: "found 3 claims", pct: 100 },
    { label: "searching europe pmc", pct: 72 },
    { label: "weighing the evidence", pct: 38 },
  ];
  const sources = [
    { name: "Europe PMC", count: 43, done: true },
    { name: "Cochrane", count: 6, done: true },
    { name: "clinical trials", count: 2, done: false },
    { name: "reviews", count: 4, done: false },
  ];
  return (
    <BrowserChrome>
      <g transform="translate(40 88)">
        <text x="0" y="0" fontFamily="-apple-system, Inter, sans-serif" fontSize="11" fontWeight="600" letterSpacing="1.5" fill={FOREST}>
          RUNNING
        </text>
        <text x="0" y="34" fontFamily="-apple-system, Inter, sans-serif" fontSize="24" fontWeight="600" fill={INK}>
          Reading, searching, grading.
        </text>

        {/* progress rows */}
        <g transform="translate(0 60)">
          {rows.map((r, i) => (
            <g key={r.label} transform={`translate(0 ${i * 50})`}>
              {/* status dot */}
              {r.pct === 100 ? (
                <g>
                  <circle cx="12" cy="18" r="9" fill={FOREST} />
                  <path d="M8 18 L11 21 L17 15" stroke={CANVAS} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ) : (
                <g>
                  <circle cx="12" cy="18" r="9" fill="none" stroke={SPROUT} strokeWidth="2" opacity="0.5" />
                  <circle cx="12" cy="18" r="9" fill="none" stroke={SPROUT} strokeWidth="2" strokeDasharray="14 44" strokeLinecap="round" transform="rotate(-90 12 18)">
                    <animateTransform attributeName="transform" type="rotate" from="-90 12 18" to="270 12 18" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                </g>
              )}
              <text x="32" y="22" fontFamily="-apple-system, Inter, sans-serif" fontSize="14" fontWeight="600" fill={INK}>
                {r.label}
              </text>
              <rect x="32" y="30" width="500" height="6" rx="3" fill={MOSS} />
              <rect x="32" y="30" width={(500 * r.pct) / 100} height="6" rx="3" fill={FOREST}>
                {r.pct < 100 && (
                  <animate attributeName="width" values={`${(500 * r.pct) / 100};${(500 * (r.pct + 10)) / 100};${(500 * r.pct) / 100}`} dur="1.8s" repeatCount="indefinite" />
                )}
              </rect>
            </g>
          ))}
        </g>

        {/* sources being scanned */}
        <g transform="translate(0 268)">
          <text x="0" y="0" fontFamily="-apple-system, Inter, sans-serif" fontSize="10" fontWeight="600" letterSpacing="1.4" fill={BARK}>
            SOURCES SCANNED
          </text>
          {sources.map((s, i) => (
            <g key={s.name} transform={`translate(${i * 132} 14)`}>
              <rect x="0" y="0" width="120" height="52" rx="12" fill="white" stroke={INK} strokeOpacity="0.08" />
              <circle cx="16" cy="16" r="6" fill={s.done ? FOREST : SPROUT} opacity={s.done ? 1 : 0.55}>
                {!s.done && (
                  <animate attributeName="opacity" values="0.35;0.85;0.35" dur="1.4s" repeatCount="indefinite" />
                )}
              </circle>
              <text x="28" y="20" fontFamily="-apple-system, Inter, sans-serif" fontSize="12" fontWeight="600" fill={INK}>
                {s.name}
              </text>
              <text x="12" y="42" fontFamily="-apple-system, Inter, sans-serif" fontSize="10" fill={BARK}>
                {s.count} matches
              </text>
            </g>
          ))}
        </g>
      </g>
    </BrowserChrome>
  );
}

/** Step 3: graded verdict + citation list + evidence-strength graph. */
export function StepGradedArt() {
  return (
    <BrowserChrome>
      <g transform="translate(40 72)">
        <rect x="0" y="0" width="560" height="356" rx="18" fill="white" />
        <rect
          x="0"
          y="0"
          width="560"
          height="356"
          rx="18"
          fill="none"
          stroke={INK}
          strokeOpacity="0.06"
        />
        <text x="24" y="34" fontFamily="-apple-system, Inter, sans-serif" fontSize="10" fontWeight="600" letterSpacing="1.4" fill={BARK}>
          THE CLAIM
        </text>
        <text x="24" y="62" fontFamily="-apple-system, Inter, sans-serif" fontSize="18" fontWeight="600" fontStyle="italic" fill={INK}>
          &ldquo;Mewing reshapes the adult jawline.&rdquo;
        </text>

        <VerdictBadge x={24} y={84} label="WEAK EVIDENCE" variant="weak" />

        {/* fake body lines */}
        <rect x="24" y="132" width="512" height="8" rx="4" fill={INK} fillOpacity="0.1" />
        <rect x="24" y="148" width="490" height="8" rx="4" fill={INK} fillOpacity="0.1" />
        <rect x="24" y="164" width="340" height="8" rx="4" fill={INK} fillOpacity="0.1" />

        {/* evidence bars */}
        <text x="24" y="200" fontFamily="-apple-system, Inter, sans-serif" fontSize="10" fontWeight="600" letterSpacing="1.4" fill={BARK}>
          EVIDENCE
        </text>
        <EvidenceBars x={24} y={212} />
        <text x="118" y="232" fontFamily="-apple-system, Inter, sans-serif" fontSize="10" fill={BARK}>
          mostly small, none in adults
        </text>

        {/* citation list */}
        <text x="24" y="266" fontFamily="-apple-system, Inter, sans-serif" fontSize="10" fontWeight="600" letterSpacing="1.4" fill={BARK}>
          CITED IN THE ANSWER
        </text>
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(24 ${278 + i * 42})`}>
            <rect x="0" y="0" width="512" height="34" rx="10" fill="#DDE7DA" fillOpacity="0.55" stroke={FOREST} strokeOpacity="0.3" />
            <rect x="8" y="8" width="18" height="18" rx="4" fill={FOREST} />
            <text x="17" y="20" textAnchor="middle" fontFamily="-apple-system, Inter, sans-serif" fontSize="10" fontWeight="700" fill={CANVAS}>{i + 1}</text>
            <rect x="34" y="10" width={200 + i * 30} height="7" rx="3.5" fill={INK} fillOpacity="0.5" />
            <rect x="34" y="21" width={110 + i * 20} height="6" rx="3" fill={BARK} />
          </g>
        ))}
      </g>
    </BrowserChrome>
  );
}
