import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export const metadata = {
  title: "You're in — bloomscroll",
  description: "Your Bloomscroll subscription is active.",
};

// Landing page after a successful Stripe checkout. Session ID lands as
// ?session_id=cs_… but we don't need it here — the webhook is the source of
// truth for actually granting access.
export default function SuccessPage() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="focus-ring rounded-md">
            <Wordmark className="text-[22px]" />
          </Link>
        </div>
      </nav>

      <main className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-2xl place-items-center overflow-hidden px-5 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-[440px] w-[440px] rounded-full opacity-45 blur-3xl"
          style={{ background: "radial-gradient(circle, #DDE7DA 0%, transparent 70%)" }}
        />
        <div className="surface-lg relative w-full p-10 sm:p-14">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
            You&apos;re in
          </p>
          <h1 className="mt-3 text-[38px] font-semibold leading-[1.03] tracking-display text-ink sm:text-[52px]">
            Welcome to Bloomscroll.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-bark">
            Your subscription is active. You&apos;ll get a receipt from Stripe by email in a moment.
            If anything looks off, reply to that email or write to the creator directly and
            we&apos;ll fix it fast.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/check" className="btn-primary focus-ring">
              check a claim →
            </Link>
            <Link href="/access" className="btn-ghost focus-ring">
              install the extension
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
