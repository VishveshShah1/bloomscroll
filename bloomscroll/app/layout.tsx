import type { Metadata, Viewport } from "next";
import SwRegister from "@/components/SwRegister";
import Splash from "@/components/Splash";
import AuthProvider from "@/components/AuthProvider";
import ScrollBackground from "@/components/ScrollBackground";
import ConsentSync from "@/components/ConsentSync";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://bloomscroll.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    <html lang="en" className="scroll-smooth">
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
