import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import CopyEmail from "@/components/CopyEmail";

export const metadata = {
  title: "Support — bloomscroll",
  description:
    "Questions, bug reports, and feedback for Bloomscroll — the web app and the Chrome extension.",
};

/**
 * Support page. This URL is what goes in the Chrome Web Store's "Support URL"
 * field, so it has to stand on its own for someone arriving from the store
 * listing with no other context.
 *
 * Deliberately a mailto rather than a form: a form would need a new API route,
 * a new KV keyspace, spam handling, and a success/failure state — and it would
 * land in the same inbox a mailto does. The review and feedback flows already
 * cover in-product signal; this is the out-of-product channel, and mail is the
 * lower-effort, more reliable version of it.
 *
 * Static server component — no session read. Someone hitting this from the
 * store listing may not have an account at all.
 */

const CONTACT = "getbloomscroll@gmail.com";

const WHAT_TO_SEND = [
  {
    heading: "Something's broken",
    body:
      "A check that failed, a page that won't load, the extension not opening. Tell us what you clicked and what happened instead — a link or screenshot helps more than anything.",
  },
  {
    heading: "A verdict looks wrong",
    body:
      "Send the claim and what you expected. Every result also has a \"report a mistake\" link on the card itself, which is faster because it carries the claim and verdict with it.",
  },
  {
    heading: "A question about how it works",
    body:
      "What gets searched, how the five evidence grades are decided, what happens to what you check. The FAQ on the homepage covers the common ones.",
  },
  {
    heading: "Feedback or a feature request",
    body:
      "Genuinely read, genuinely useful. If you've used it more than once, what you'd change is worth more than what you'd add.",
  },
];

export default function SupportPage() {
  // Gmail's web compose rather than a mailto: on Windows a mailto hands off
  // to whatever is registered as the default mail client, which for most
  // people is the Mail/Outlook app they've never signed into — so the link
  // appears to do nothing useful. Opening Gmail in a new tab works for the
  // majority who already have it, and the copy button plus the plain address
  // beside it cover everyone who doesn't.
  const gmailCompose =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(CONTACT)}` +
    `&su=${encodeURIComponent("Bloomscroll support")}`;

  return (
    <div className="min-h-screen">
      <nav className="relative z-20 border-b border-ink/5 bg-canvas/85 backdrop-blur">
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

      {/* Same veil as /terms and /privacy so the shared scroll tint never
          darkens far enough to swallow black body copy. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[rgba(246,243,234,0.58)]"
      />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-24 pt-16 sm:px-8 [&_*]:text-black">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -left-24 h-[380px] w-[380px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #DDE7DA 0%, transparent 70%)" }}
        />

        <p className="relative text-[13px] font-semibold uppercase tracking-[0.14em]">
          support
        </p>
        <h1 className="relative mt-3 text-[42px] font-semibold leading-[1.02] tracking-display  sm:text-[56px]">
          Questions, bugs, feedback.
        </h1>
        <p className="relative mt-5 max-w-[60ch] text-[17px] leading-relaxed">
          One person builds Bloomscroll, so mail goes straight to them. Expect a
          reply within a couple of days — sooner if something is actually broken.
        </p>

        <div className="relative mt-9 flex flex-wrap items-center gap-4">
          <a href={gmailCompose} target="_blank" rel="noopener noreferrer" className="btn-primary focus-ring !text-canvas">
            Email {CONTACT}
          </a>
          <CopyEmail email={CONTACT} />
          <span className="text-[13.5px] font-semibold">{CONTACT}</span>
        </div>

        <div className="mt-14 flex flex-col gap-8">
          <h2 className="text-[22px] font-semibold">
            What&apos;s worth sending
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {WHAT_TO_SEND.map((s) => (
              <div
                key={s.heading}
                className="surface rounded-[20px] p-6"
              >
                <h3 className="text-[16px] font-semibold text-ink">{s.heading}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-bark">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <h2 className="text-[22px] font-semibold">
            Before you write
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {[
              <>
                The{" "}
                <Link
                  href="/#faq"
                  className="focus-ring font-semibold text-forest underline underline-offset-[3px]"
                >
                  FAQ
                </Link>{" "}
                answers what Bloomscroll checks, how it differs from asking a
                chatbot, and whether anything is stored.
              </>,
              <>
                Install problems are usually covered by the{" "}
                <Link
                  href="/access"
                  className="focus-ring font-semibold text-forest underline underline-offset-[3px]"
                >
                  install guides
                </Link>{" "}
                — iPhone, Android, and Chrome each take about a minute.
              </>,
              <>
                Bloomscroll explains published evidence. It doesn&apos;t diagnose,
                treat, or give medical advice, and support can&apos;t either — for
                anything clinical, talk to an actual professional.
              </>,
            ].map((node, i) => (
              <li
                key={i}
                className="flex gap-3 text-[15.5px] leading-relaxed"
              >
                <span aria-hidden="true" className="mt-[2px] font-bold text-forest">
                  ·
                </span>
                <span>{node}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink/10 pt-6 text-[13.5px]">
          <Link href="/privacy" className="focus-ring font-semibold hover:text-ink">
            privacy
          </Link>
          <Link href="/terms" className="focus-ring font-semibold hover:text-ink">
            terms of service
          </Link>
          <Link href="/access" className="focus-ring font-semibold hover:text-ink">
            install guides
          </Link>
        </div>

        <p className="mt-10 text-[12px]">
          © 2026 Bloomscroll. All rights reserved.
        </p>
      </main>
    </div>
  );
}
