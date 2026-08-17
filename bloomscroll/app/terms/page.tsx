import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export const metadata = {
  title: "Terms of Service — bloomscroll",
  description:
    "The plain language terms that govern using Bloomscroll — what's allowed, what's not, and how subscriptions work.",
};

// Plain-language terms of service. Not a substitute for legal counsel; this
// is a starting draft covering the standard SaaS ground for a small tool.
const SECTIONS = [
  {
    heading: "Who this is for",
    items: [
      "These terms cover anyone who uses Bloomscroll — the web app, the Chrome extension, the mobile shortcuts, and any related APIs.",
      "You have to be old enough to enter into a contract where you live. If you're using this through a school or workplace, they may have their own rules on top of these.",
    ],
  },
  {
    heading: "What Bloomscroll does",
    items: [
      "Bloomscroll reads a claim you paste or link to, extracts the checkable parts, searches biomedical literature (via Europe PMC and similar public indexes), and returns a graded verdict with real, retrievable citations.",
      "The verdict is a summary of what the retrieved research says, on a five tier evidence scale. It is not a personal recommendation and not a medical opinion.",
    ],
  },
  {
    heading: "Acceptable use",
    items: [
      "Use Bloomscroll to check claims you or other people are making, for personal or educational reasons.",
      "Don't use it to spam, scrape at industrial scale, resell the output as your own service, or train a competing model on the results.",
      "Don't try to break the rate limits, poke the pipeline for exploits, or attempt to extract paid features without paying.",
      "Don't submit claims you know are illegal to check where you live (for instance content that would be a crime to view or reproduce in your jurisdiction).",
    ],
  },
  {
    heading: "This is not medical advice",
    items: [
      "Bloomscroll explains what the published evidence says about a claim. That is education, not medicine.",
      "It does not diagnose you, does not treat you, and does not replace an actual clinician. Nothing on this site is a clinical relationship.",
      "For any decision about your health, medication, or treatment, talk to a licensed professional who knows your history.",
    ],
  },
  {
    heading: "Accounts",
    items: [
      "The free tier requires a Google account for usage limits. You are responsible for whatever happens under your account.",
      "If we notice patterns that look like abuse (many accounts from one person to dodge limits, obvious automated scraping, targeted harassment via the API), we can suspend or close accounts.",
      "You can sign out at any time. You can request full deletion by emailing the address on the Privacy page.",
    ],
  },
  {
    heading: "Subscriptions and billing",
    items: [
      "Paid tiers (Sprout, Canopy) are billed monthly through Stripe. The price shown at checkout is the price you pay in your local currency plus any applicable tax.",
      "Subscriptions renew automatically each month until you cancel. Cancel from the dashboard or Stripe portal and access continues until the end of the paid period.",
      "Refunds for the current month are granted at our discretion, usually if the service was materially broken for you. Older months are not refunded.",
      "Free tier usage limits are set at Bloomscroll's discretion and may change. We'll surface any change in the product before it affects you.",
    ],
  },
  {
    heading: "Content and citations",
    items: [
      "The papers Bloomscroll cites come from open access indexes (primarily Europe PMC). Their content belongs to their authors and publishers, not to Bloomscroll.",
      "The verdict text, the grader's summary, and the surrounding UI are Bloomscroll's. Don't republish them wholesale without permission. Sharing a verdict card with a link back is fine.",
    ],
  },
  {
    heading: "Availability and warranty",
    items: [
      "Bloomscroll is provided as is. We try hard to keep it correct and up, but we can't guarantee zero downtime or zero mistakes.",
      "If a check returns a verdict that turns out to be wrong, that's a bug we want to hear about — not grounds for legal action.",
      "To the fullest extent allowed by law, we're not liable for indirect or consequential damages that follow from using or being unable to use the service.",
    ],
  },
  {
    heading: "Termination",
    items: [
      "You can stop using Bloomscroll at any time. If you have a paid plan, cancel to stop future billing.",
      "We can suspend or terminate accounts that violate these terms, that abuse the free tier, or that we're compelled to remove by legal process.",
      "Sections that make sense to keep after termination (acceptable use limits, disclaimers, limitation of liability) survive.",
    ],
  },
  {
    heading: "Changes to these terms",
    items: [
      "We can update these terms as the product changes. If a change is material — new limits on how you can use it, new billing rules — we'll surface it in the product before it takes effect.",
      "Continuing to use Bloomscroll after an update means you accept the updated terms.",
    ],
  },
  {
    heading: "Governing law",
    items: [
      "These terms are governed by the laws of the operator's home jurisdiction. Disputes go to the courts there.",
      "If you're a consumer in a jurisdiction that gives you extra protections that can't be waived, those protections still apply.",
    ],
  },
];

export default function TermsPage() {
  return (
    // Transparent — the shared body tint from ScrollBackground (cream at the
    // top, deep forest by the bottom) shows through here exactly like it
    // does on the homepage. Nav is the same sticky/blurred cream bar used
    // everywhere else on the site, so it reads as "normal," not a special
    // dark mode for this one page.
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="focus-ring rounded-md">
            <Wordmark className="text-[22px]" />
          </Link>
          <Link
            href="/"
            className="focus-ring text-[14px] font-semibold text-bark transition hover:text-ink"
          >
            ← back to bloomscroll
          </Link>
        </div>
      </nav>

      {/* Page-scoped cream veil over the shared body tint. The homepage's
          tint ramps all the way to a deep forest (#163C26), where black body
          copy measures ~1.8:1 — unreadable. Softening it here with a fixed
          cream wash keeps the same cream → green scroll transition but tops
          out around a light sage, where pure black holds ~8:1. Scoped to
          this page so the homepage's dark bands (which use cream text) are
          untouched. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[rgba(246,243,234,0.58)]"
      />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-24 pt-16 sm:px-8 [&_*]:text-black">
        {/* Every text node on this page is pure black at all scroll depths —
            no scroll-linked color logic anywhere. */}
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em]">
          terms of service
        </p>
        <h1 className="mt-3 text-[42px] font-semibold leading-[1.02] tracking-display sm:text-[60px]">
          The plain rules for using Bloomscroll.
        </h1>
        <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed">
          Short version: use it to check claims, don&apos;t abuse it, don&apos;t treat
          a verdict as medical advice. Long version below.
        </p>

        <div className="mt-12 flex flex-col gap-10">
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="text-[22px] font-semibold">{s.heading}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {s.items.map((i) => (
                  <li key={i} className="flex gap-3 text-[15.5px] leading-relaxed">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* TODO: wire the real support inbox here once the mailbox exists
            Contact now lives on /support. Never expose a personal address. */}
        <div className="mt-14 rounded-[20px] border border-black/10 bg-[rgba(251,250,243,0.75)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]">
            Questions about these terms
          </p>
          <p className="mt-2 text-[15px] leading-relaxed">
            A dedicated support inbox is coming soon. Until then, questions
            about these terms are collected through the review + feedback flow
            in the app and answered from the same place.
          </p>
        </div>

        <p className="mt-8 text-[12.5px]">Last updated: 2026-07-25.</p>
        <p className="mt-2 text-[12px]">© 2026 Bloomscroll. All rights reserved.</p>
      </main>
    </div>
  );
}
