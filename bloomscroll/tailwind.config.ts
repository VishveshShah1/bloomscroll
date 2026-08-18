import type { Config } from "tailwindcss";

// Palette rationale (v2 rebrand):
//   canvas — warm off-white base; not stark white
//   moss   — soft sage tint for cards / section bands
//   forest — deep green anchor; primary buttons, wordmark, emphasis
//   sprout — lighter kin of forest; secondary accents, cited badge
//   ink    — very-dark green-black; body + headline text
//   bark   — muted warm gray-green; captions, meta labels
//   warn   — dusty terracotta; safety warnings only, one scoped exception
//
// The old tokens (underleaf, loam, fern, chlorophyll, stone, dopamine…) are
// re-aliased to the closest v2 value so existing components keep rendering
// while the rebrand is in progress. They should be removed once every page
// is on the v2 palette.

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F3EA",
        moss: "#E8EDDE",
        forest: "#1E4D2B",
        sprout: "#4A8B5A",
        ink: "#12201A",
        bark: "#5B6B5E",
        warn: "#B04A44",

        // aliases — old palette → v2
        underleaf: "#F6F3EA", // was #F1F3EC
        card: "#FBFAF3",
        loam: "#12201A", // was #1F2721
        fern: "#5B6B5E", // was #565C52
        chlorophyll: "#1E4D2B", // was #2E6B3F
        olive: "#4A8B5A",
        straw: "#B08A3C",
        stone: "#7B857D",
        lilac: "#7A7A97",
        dopamine: "#B04A44",
      },
      fontFamily: {
        // Single-family stack: real San Francisco on Apple, Source Sans 3
        // everywhere else. Weight + size do the work; no display/body split.
        //
        // `Inter` used to sit in slot 3 but was never loaded — no next/font,
        // no @font-face — so it only applied to the rare visitor who had Inter
        // installed locally, and everyone else silently got Segoe UI or Roboto.
        // --font-fallback-sans is a real self-hosted webfont (see app/layout.tsx),
        // so the non-Apple half of the audience now gets a chosen typeface.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "var(--font-fallback-sans)",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "var(--font-fallback-sans)",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          "var(--font-fallback-sans)",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        display: "-0.03em",
      },
    },
  },
  plugins: [],
};
export default config;
