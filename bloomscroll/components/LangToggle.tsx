"use client";

import { useLang } from "@/lib/i18n";

/**
 * EN / FR switch.
 *
 * The French dictionary has existed in lib/i18n.ts since early on, but nothing
 * ever rendered a control for it — every caller did `const [lang] = useLang()`
 * and dropped the setter, so the translations were unreachable. This is that
 * control.
 *
 * Two segments rather than a single "FR" button: a lone button that flips
 * gives no indication of which language you're currently in. `aria-pressed`
 * carries the same state for screen readers.
 *
 * `tone` picks the palette — pages sitting on cream chrome use "ink", the ones
 * on the deep-forest end of the scroll tint use "canvas".
 */
export default function LangToggle({
  tone = "ink",
  className = "",
}: {
  tone?: "ink" | "canvas";
  className?: string;
}) {
  const [lang, setLang] = useLang();

  const onCanvas = tone === "canvas";
  const wrap = onCanvas ? "border-canvas/30" : "border-ink/15";
  const active = onCanvas ? "bg-canvas text-forest" : "bg-forest text-canvas";
  const idle = onCanvas
    ? "text-canvas/70 hover:text-canvas"
    : "text-bark hover:text-ink";

  return (
    <div
      className={`inline-flex items-center rounded-full border p-0.5 ${wrap} ${className}`}
      role="group"
      aria-label="Language"
    >
      {(["en", "fr"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          aria-label={code === "en" ? "English" : "Français"}
          className={`focus-ring rounded-full px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] transition ${
            lang === code ? active : idle
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
