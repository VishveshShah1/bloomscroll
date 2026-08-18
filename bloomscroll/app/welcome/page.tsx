import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export const metadata = {
  title: "You're in — bloomscroll",
  description:
    "The Bloomscroll extension is installed. Here's how to use it, and how to get your checks.",
  // Nothing to index here — this only exists as the extension's post-install
  // landing tab, and it would compete with the real pages in search.
  robots: { index: false, follow: false },
};

/**
 * Opened automatically the moment the Chrome extension is installed
 * (chrome.runtime.onInstalled → tabs.create). For a lot of people this is the
 * first Bloomscroll page they ever see, before the homepage — so it explains
 * the two ways to invoke the extension and gets them to an account, rather
 * than repeating the marketing pitch they already said yes to.
 *
 * Static server component: someone who just installed the extension usually
 * has no session yet, so there's nothing to read.
 */

const STEPS = [
  {
    n: "1",
    title: "Pin it to your toolbar",
    body:
      "Click the puzzle-piece icon in Chrome's toolbar and hit the pin next to bloomscroll. The icon is how you'll use it most.",
  },
  {
    n: "2",
    title: "Click the icon on any page",
    body:
      "It reads the article or video you're already looking at. You can also paste a claim straight into the popup.",
  },
  {
    n: "3",
    title: "Or right-click a claim",
    body:
      'Highlight any sentence and choose "Check with Bloomscroll". Same result — whichever is faster for you.',
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto w-full max-w-4xl px-4 pt-10 sm:px-8">
        <Link href="/" className="focus-ring inline-block rounded-lg">
          <Wordmark className="text-[22px]" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-12 sm:px-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
          extension installed
        </p>
        <h1 className="mt-3 max-w-[18ch] text-[38px] font-semibold leading-[1.03] tracking-display text-ink sm:text-[54px]">
          You&rsquo;re set up.
        </h1>
        <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-bark sm:text-[18px]">
          Bloomscroll is in your browser now. Next time you scroll past a health
          claim that sounds too clean to be true, you can check it against the
          actual literature without leaving the page.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="surface rounded-[20px] p-6">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-forest text-[12px] font-bold text-canvas">
                {s.n}
              </span>
              <h2 className="mt-4 text-[17px] font-semibold leading-snug text-ink">
                {s.title}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-bark">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[22px] border border-forest/25 bg-moss/50 p-7">
          <h2 className="text-[20px] font-semibold tracking-display text-ink sm:text-[24px]">
            Create an account to start checking
          </h2>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-bark">
            Checks run against your account so your monthly allowance and past
            results follow you across the extension, the web app, and your
            phone. The free tier needs no card.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signin" className="btn-primary focus-ring">
              Create a free account →
            </Link>
            <Link
              href="/dashboard"
              className="focus-ring inline-flex items-center rounded-full border border-ink/12 bg-white/70 px-6 py-3 text-[15px] font-semibold text-ink transition hover:-translate-y-0.5 hover:border-ink/25 hover:bg-white"
            >
              I already have one
            </Link>
          </div>
        </div>

        <p className="mt-10 text-[14px] text-bark">
          Something not working?{" "}
          <Link href="/support" className="font-semibold text-forest underline underline-offset-2">
            Tell us
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
