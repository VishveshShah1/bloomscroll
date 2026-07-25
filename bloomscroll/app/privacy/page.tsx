import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export const metadata = {
  title: "Privacy — bloomscroll",
  description: "What Bloomscroll collects, what it doesn't, and how the Chrome extension works.",
};

// Plain-language privacy page. Required for the Chrome Web Store listing.
// No lawyer-speak; if you can't explain a policy in short sentences, the
// policy is probably too broad.
const SECTIONS = [
  {
    heading: "What we collect",
    items: [
      "Your Google account email, when you sign in. Used to sign you in and to keep count of your free checks.",
      "The number of checks you've run this month, tied to your account.",
      "Your plan status (free, Sprout, or Canopy), synced from Stripe when you subscribe.",
      "Rough aggregate spend data on our end (token usage per day), for the daily circuit breaker. Not per-user.",
    ],
  },
  {
    heading: "What we don't collect",
    items: [
      "We don't track which pages you browse, on our site or anywhere else.",
      "We don't read the pages open in your browser. The extension only sees content you actively right-click or paste into a check.",
      "We don't sell data. There are no third-party ad pixels, analytics fingerprinting, or resale to data brokers.",
      "We don't store the actual text of your checks after they've been served. Results are cached in memory only, keyed by a hash, and evicted quickly.",
    ],
  },
  {
    heading: "What the Chrome extension does",
    items: [
      "It adds a \"Check with Bloomscroll\" item to your right-click menu. Clicking it opens a new bloomscroll.com tab with the highlighted text or the page URL.",
      "It has a toolbar popup where you can paste something or click \"Check current tab.\"",
      "It only reads a page's URL or text when you explicitly trigger a check. It doesn't watch what you're browsing in the background.",
      "It stores a single preference locally (your Bloomscroll origin URL, in case you're running a dev copy). Nothing else.",
    ],
  },
  {
    heading: "Where the data lives",
    items: [
      "Sign-in sessions are JWTs held in an HTTP-only cookie in your browser. We can't read them from any other site.",
      "Usage counts and plan flags live in a hosted key-value store (Upstash Redis).",
      "Payments are handled entirely by Stripe. We never see or store card details.",
      "The scientific paper searches happen through Europe PMC's free public API, using only the search terms extracted from your claim.",
    ],
  },
  {
    heading: "Deleting your data",
    items: [
      "Sign out and stop using the app. Your monthly counter clears at the end of the month on its own.",
      "For a full erase (counter, plan record, cached sessions), email the address at the bottom of this page and we'll wipe your record within a few days.",
    ],
  },
  {
    heading: "Changes to this page",
    items: [
      "If we change what we collect or how we store it, we'll update this page and note the date. Big changes will surface in the product itself, not just here.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <nav className="border-b border-ink/5 bg-canvas/85 backdrop-blur">
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

      <main className="relative mx-auto w-full max-w-3xl overflow-hidden px-5 pb-24 pt-16 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -left-24 h-[380px] w-[380px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #DDE7DA 0%, transparent 70%)" }}
        />
        <p className="relative text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">privacy</p>
        <h1 className="relative mt-3 text-[42px] font-semibold leading-[1.02] tracking-display text-ink sm:text-[60px]">
          What we keep, what we don&apos;t.
        </h1>
        <p className="relative mt-5 max-w-[62ch] text-[17px] leading-relaxed text-bark">
          Short version: your email, your monthly check count, your plan status. That&apos;s it.
          No page tracking. No data sold. Detailed version below.
        </p>

        <div className="mt-12 flex flex-col gap-10">
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="text-[22px] font-semibold text-ink">{s.heading}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {s.items.map((i) => (
                  <li key={i} className="flex gap-3 text-[15.5px] leading-relaxed text-bark">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="surface mt-14 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-forest">
            Questions or a deletion request
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">
            Email <a href="mailto:vishvesh380@gmail.com" className="focus-ring font-semibold text-forest underline underline-offset-[3px]">vishvesh380@gmail.com</a>. It goes straight to the person who built this.
          </p>
        </div>

        <p className="mt-8 text-[12.5px] text-bark">Last updated: 2026-07-24.</p>
      </main>
    </div>
  );
}
