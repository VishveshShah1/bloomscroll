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
        {/* narrower body — closer to the real 16:11 play-button proportion */}
        <rect x="4" y="7" width="24" height="18" rx="5.5" fill="#FF0033" />
        <polygon points="13.5,11.8 13.5,20.2 20.5,16" fill="#FFFFFF" />
      </svg>
    );
  }
  if (kind === "tiktok") {
    // Official app icon asset rather than a redraw — nominative use, and it
    // avoids the uncanny-valley of an approximated logo.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src="/brand/tiktok.png"
        alt=""
        width={s}
        height={s}
        aria-hidden="true"
        className="block rounded-[22%] object-cover"
        style={{ width: s, height: s }}
      />
    );
  }
  if (kind === "reddit") {
    // Official app icon asset. The source JPEG has white corners outside the
    // orange tile, so the radius here matches the tile's own corner radius
    // and clips them away.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src="/brand/reddit.jpg"
        alt=""
        width={s}
        height={s}
        aria-hidden="true"
        className="block rounded-[22%] object-cover"
        style={{ width: s, height: s }}
      />
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
        {/* No plate — just cutlery, drawn large so it reads at 36px.
            Fork: 4 pointed tines → shoulder → handle.
            Spoon: oval bowl → same handle. */}
        <g fill="#1E4D2B">
          {/* fork tines — three, each tapering to a sharp point at the top */}
          {[8.8, 11.2, 13.6].map((x) => (
            <path key={x} d={`M${x} 3.2 L${x + 1.05} 3.2 L${x + 1.05} 10.6 L${x} 10.6 Z`} />
          ))}
          {[8.8, 11.2, 13.6].map((x) => (
            <path key={`tip${x}`} d={`M${x} 3.6 L${x + 0.52} 2 L${x + 1.05} 3.6 Z`} />
          ))}
          {/* shoulder the tines merge into */}
          <path d="M8.8 10.4 h5.85 v1.9 a2.93 2.93 0 0 1 -2.92 2.93 a2.93 2.93 0 0 1 -2.93 -2.93 z" />
          {/* handle */}
          <rect x="10.92" y="14.8" width="1.6" height="14.8" rx="0.8" />
        </g>
        <g fill="#1E4D2B">
          {/* spoon bowl */}
          <ellipse cx="21.6" cy="7.4" rx="3.75" ry="5.4" />
          {/* handle — same width + radius as the fork's */}
          <rect x="20.8" y="12.2" width="1.6" height="17.4" rx="0.8" />
        </g>
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
