import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Spline_Sans_Mono, STIX_Two_Text } from "next/font/google";
import SwRegister from "@/components/SwRegister";
import "./globals.css";

const display = STIX_Two_Text({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
});

const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "bloomscroll — keep scrolling, start growing",
  description:
    "Bloomscroll checks health and appearance claims from your feed against real scientific literature and shows how strong the evidence actually is.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "bloomscroll — keep scrolling, start growing",
    description:
      "Check the health claims in your feed against 45M+ real scientific papers. Evidence, graded — never a bare true/false.",
    siteName: "bloomscroll",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "bloomscroll — keep scrolling, start growing",
    description:
      "Check the health claims in your feed against 45M+ real scientific papers.",
  },
};

export const viewport: Viewport = {
  themeColor: "#F1F3EC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} bg-underleaf font-body text-loam antialiased`}
      >
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
