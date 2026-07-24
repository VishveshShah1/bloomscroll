import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        underleaf: "#F1F3EC",
        card: "#FAFBF7",
        loam: "#1F2721",
        fern: "#565C52",
        chlorophyll: "#2E6B3F",
        olive: "#767F2C",
        straw: "#A9852D",
        stone: "#83887F",
        lilac: "#74719F",
        dopamine: "#E04A62",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
