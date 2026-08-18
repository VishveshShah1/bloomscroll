import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import SwRegister from "@/components/SwRegister";
import Splash from "@/components/Splash";
import AuthProvider from "@/components/AuthProvider";
import ScrollBackground from "@/components/ScrollBackground";
import ConsentSync from "@/components/ConsentSync";
import "./globals.css";

import { SITE_URL } from "@/lib/site";

/**
 * The non-Apple half of the type stack.
 *
 * Apple devices resolve `-apple-system` to San Francisco and never reach this.
 * Everyone else previously fell through `Inter` — which was listed in the
 * stack but never actually loaded — and landed on Segoe UI or Roboto. So the
 * brand had no considered typography off Apple at all.
 *
 * Source Sans 3 is humanist, like SF: open apertures, generous x-height, warm.
 * That matters more than it sounds — a neo-grotesque fallback (Inter, Geist)
 * makes Windows visitors see a visibly colder, more corporate site than Mac
 * visitors, which is the mismatch this stack has always had.
 *
 * next/font self-hosts at build time: no request to Google at runtime, no
 * layout shift, no third-party privacy surface.
 */
const fallbackSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-fallback-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "bloomscroll · keep scrolling, start growing",
  description:
    "Bloomscroll checks health and appearance claims from your feed against real scientific literature and shows how strong the evidence actually is.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "bloomscroll · keep scrolling, start growing",
    description:
      "Check the health claims in your feed against millions of peer reviewed papers. Evidence, graded.",
    siteName: "bloomscroll",
    type: "website",
    images: [
      { url: "/brand/og.png", width: 1200, height: 630, alt: "bloomscroll — keep scrolling, start growing" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "bloomscroll · keep scrolling, start growing",
    description: "Check the health claims in your feed against millions of peer reviewed papers.",
    images: ["/brand/og.png"],
  },
  icons: {
    icon: [
      // .ico first and declared explicitly: Google's crawler and a few older
      // clients probe /favicon.ico directly, and until this file existed that
      // request 404'd — leaving the search result with a blank icon even
      // though the browser tab looked fine off the SVG.
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F3EA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variable goes on <html>, not <body>: Tailwind's preflight sets
    // font-family on html too, and a var defined only on body wouldn't
    // resolve there.
    <html lang="en" className={`${fallbackSans.variable} scroll-smooth`}>
      {/* No bg-canvas here — the body background is driven by
          ScrollBackground via the `--bg-color` CSS var (see globals.css).
          A hardcoded class would win by specificity and freeze the tint. */}
      <body className="font-sans text-ink antialiased">
        <AuthProvider>
          <SwRegister />
          <ScrollBackground />
          <ConsentSync />
          <Splash />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
