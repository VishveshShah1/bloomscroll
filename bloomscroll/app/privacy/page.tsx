import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export const metadata = {
  title: "Privacy — bloomscroll",
  description: "What Bloomscroll collects, what it doesn't, and how the Chrome extension works.",
};

// Plain-language privacy page. Required for the Chrome Web Store listing.
// No lawyer-speak; if you can't explain a policy in short sentences, the
// policy is probably too broad.
const CONTACT = "getbloomscroll@gmail.com";

const GMAIL_COMPOSE =
  "https://mail.google.com/mail/?view=cm&fs=1" +
  `&to=${encodeURIComponent(CONTACT)}` +
  `&su=${encodeURIComponent("Bloomscroll privacy request")}`;

const SECTIONS = [
  {
    heading: "What we collect",
    items: [
      "Your Google account email, when you sign in. Used to sign you in and to keep count of your free checks.",
      "The number of checks you've run this month, tied to your account.",
      "Your plan status (free, Sprout, or Canopy), synced from Stripe when you subscribe.",
      "Rough aggregate spend data on our end (token usage per month), for the monthly circuit breaker. Not per user.",
    ],
  },
  {
    heading: "What we don't collect",
    items: [
      "We don't track which pages you browse, on our site or anywhere else.",
      "We don't read the pages open in your browser. The extension only sees content you actively right click or paste into a check.",
      "We don't sell data. There are no third-party ad pixels, analytics fingerprinting, or resale to data brokers.",
      "We don't store the actual text of your checks after they've been served. Results are cached in memory only, keyed by a hash, and evicted quickly.",
    ],
  },
  {
    heading: "What the Chrome extension does",
    items: [
      "It adds a \"Check with Bloomscroll\" item to your context menu. Clicking it opens a new getbloomscroll.com tab with the highlighted text or the page URL.",
      "It has a toolbar popup where you can paste something or click \"Check current tab.\"",
      "It only reads a page's URL or text when you explicitly trigger a check. It doesn't watch what you're browsing in the background.",
      "It stores a single preference locally (your Bloomscroll origin URL, in case you're running a dev copy). Nothing else.",
    ],
  },
  {
    heading: "Where the data lives",
    items: [
      "Session cookies are JWTs held in an HttpOnly cookie in your browser. We can't read them from any other site.",
      "Usage counts and plan flags live in a hosted key value store (Upstash Redis).",
      "Payments are handled entirely by Stripe. We never see or store card details.",
      "The text you submit is sent to Anthropic's API, which pulls out the checkable claims and grades the evidence. It goes without your email or any account identifier, and Anthropic's API terms don't use it to train models.",
      "The scientific paper searches happen through Europe PMC's free public API, using only the search terms extracted from your claim.",
    ],
  },
  {
    heading: "Deleting your data",
    items: [
      "Sign out and stop using the app. Your monthly counter clears at the end of the month on its own.",
      "For a full erase (counter, plan record, cached sessions), email getbloomscroll@gmail.com and we'll wipe your record within a few days.",
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
    <div className="min-h-screen">
      <nav className="relative z-20 border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="focus-ring rounded-md">
            <Wordmark className="text-[22px]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="focus-ring text-[14px] font-semibold text-bark transition hover:text-ink"
            >
              ← back to bloomscroll
            </Link>
          </div>
        </div>
      </nav>

      {/* Same treatment as /terms: a fixed cream veil softens the shared
          scroll tint so it never reaches the deep-forest end, where black body
          copy measures ~1.8:1. Page-scoped, so the homepage's dark bands —
          which use cream text — are untouched. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[rgba(246,243,234,0.58)]"
      />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-24 pt-16 sm:px-8 [&_*]:text-black">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em]">privacy</p>
        <h1 className="mt-3 text-[42px] font-semibold leading-[1.02] tracking-display sm:text-[60px]">
          What we keep, what we don&apos;t.
        </h1>
        <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed">
          Short version: your email, your monthly check count, your plan status. That&apos;s it.
          No page tracking. No data sold. Detailed version below.
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
            Questions or a deletion request
          </p>
          <p className="mt-2 text-[15px] leading-relaxed">
            Email{" "}
            {/* Gmail web compose, not a mailto: — on Windows a mailto hands
                off to whatever mail client is registered, usually one the
                person has never signed into, so the link looks broken. Same
                treatment as the landing footer and /support. */}
            <a
              href={GMAIL_COMPOSE}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring font-semibold underline underline-offset-[3px]"
            >
              getbloomscroll@gmail.com
            </a>
            , or use the{" "}
            <Link
              href="/support"
              className="focus-ring font-semibold underline underline-offset-[3px]"
            >
              support page
            </Link>
            . Deletion requests are handled within a few days.
          </p>
        </div>

        <p className="mt-8 text-[12.5px]">Last updated: 2026-08-18.</p>
      </main>
    </div>
  );
}
