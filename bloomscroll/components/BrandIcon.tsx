/**
 * Small brand-recognizable icons for the platforms Bloomscroll can check.
 * These are simplified original SVG glyphs in the platforms' publicly known
 * brand colors, used to identify where a piece of content originates —
 * nominative use, same as a "Share to X" button.
 */

type BrandKind = "youtube" | "tiktok" | "reddit" | "articles" | "diet" | "skincare";

export function BrandIcon({ kind, size = 36 }: { kind: BrandKind; size?: number }) {
  const s = size;
  if (kind === "youtube") {
    return (
      <svg viewBox="0 0 32 32" width={s} height={s} aria-hidden="true">
        <rect x="1" y="6" width="30" height="20" rx="6" fill="#FF0033" />
        <polygon points="13,11.5 13,20.5 21,16" fill="#FFFFFF" />
      </svg>
    );
  }
  if (kind === "tiktok") {
    return (
      <svg viewBox="0 0 32 32" width={s} height={s} aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="7" fill="#111" />
        {/* magenta ghost note */}
        <path
          d="M20 8.5 v9.5 a4.2 4.2 0 1 1 -4.2 -4.2 v3 a1.4 1.4 0 1 0 1.4 1.4 v-11 h2.8 z"
          fill="#F41F63"
          transform="translate(-1.2 1.2)"
        />
        {/* cyan ghost note */}
        <path
          d="M20 8.5 v9.5 a4.2 4.2 0 1 1 -4.2 -4.2 v3 a1.4 1.4 0 1 0 1.4 1.4 v-11 h2.8 z"
          fill="#25F4EE"
          transform="translate(1.2 -0.6)"
        />
        {/* white main note on top */}
        <path
          d="M20 8.5 v9.5 a4.2 4.2 0 1 1 -4.2 -4.2 v3 a1.4 1.4 0 1 0 1.4 1.4 v-11 h2.8 z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }
  if (kind === "reddit") {
    return (
      <svg viewBox="0 0 32 32" width={s} height={s} aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="#FF4500" />
        {/* head */}
        <ellipse cx="16" cy="18" rx="9.5" ry="7.5" fill="#FFFFFF" />
        {/* antenna dot */}
        <circle cx="22" cy="9" r="2.4" fill="#FFFFFF" />
        <circle cx="22" cy="9" r="1.2" fill="#FF4500" />
        <line x1="22" y1="10.4" x2="18.5" y2="14" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
        {/* eyes */}
        <circle cx="12" cy="17" r="1.6" fill="#FF4500" />
        <circle cx="20" cy="17" r="1.6" fill="#FF4500" />
        {/* mouth */}
        <path d="M12 21 q4 2 8 0" fill="none" stroke="#111" strokeWidth="1.2" strokeLinecap="round" />
        {/* ears */}
        <circle cx="7" cy="17" r="1.6" fill="#FFFFFF" />
        <circle cx="25" cy="17" r="1.6" fill="#FFFFFF" />
      </svg>
    );
  }
  if (kind === "articles") {
    return (
      <svg viewBox="0 0 32 32" width={s} height={s} aria-hidden="true">
        <rect x="2" y="4" width="28" height="24" rx="4" fill="#1E4D2B" />
        <rect x="5" y="8" width="14" height="3" rx="1" fill="#F6F3EA" />
        <rect x="5" y="14" width="14" height="1.6" rx="0.8" fill="#F6F3EA" opacity="0.75" />
        <rect x="5" y="17.5" width="14" height="1.6" rx="0.8" fill="#F6F3EA" opacity="0.75" />
        <rect x="5" y="21" width="10" height="1.6" rx="0.8" fill="#F6F3EA" opacity="0.75" />
        <rect x="21" y="8" width="7" height="9" rx="1.5" fill="#4A8B5A" />
      </svg>
    );
  }
  if (kind === "diet") {
    return (
      <svg viewBox="0 0 32 32" width={s} height={s} aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#4A8B5A" />
        <circle cx="16" cy="16" r="8.5" fill="#F6F3EA" />
        {/* fork/knife glyph */}
        <path d="M10 10 v6 a2 2 0 0 0 2 2 v4" stroke="#1E4D2B" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <path d="M12 10 v4 M14 10 v4" stroke="#1E4D2B" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M20 10 v12" stroke="#1E4D2B" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M20 10 h2 v6 h-2 z" fill="#1E4D2B" />
      </svg>
    );
  }
  // skincare — droplet
  return (
    <svg viewBox="0 0 32 32" width={s} height={s} aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#DDE7DA" />
      <path
        d="M16 6 C 10 14, 8 18, 12 22 C 15 25, 17 25, 20 22 C 24 18, 22 14, 16 6 Z"
        fill="#1E4D2B"
      />
      <ellipse cx="14.5" cy="17.5" rx="1.6" ry="2.4" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}

/** Resolve i18n use-case tag strings (may vary per language) to the icon kind. */
export function brandKindFor(tag: string): BrandKind {
  const t = tag.toLowerCase();
  if (t === "youtube") return "youtube";
  if (t === "tiktok") return "tiktok";
  if (t === "reddit") return "reddit";
  if (t.startsWith("articl")) return "articles";
  if (t === "diet" || t === "régime") return "diet";
  return "skincare";
}
