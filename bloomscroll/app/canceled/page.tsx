import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export const metadata = {
  title: "No worries — bloomscroll",
  description: "Checkout canceled. Bloomscroll is still free during beta.",
};

export default function CanceledPage() {
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
          className="pointer-events-none absolute -bottom-24 -right-24 h-[440px] w-[440px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #E8EDDE 0%, transparent 70%)" }}
        />
        <div className="surface-lg relative w-full p-10 sm:p-14">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-bark">No charge</p>
          <h1 className="mt-3 text-[38px] font-semibold leading-[1.03] tracking-display text-ink sm:text-[52px]">
            Checkout canceled.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-bark">
            Nothing was charged. Bloomscroll&apos;s free tier stays free. Come back to upgrade
            whenever you want.
          </p>
          <Link href="/" className="btn-primary focus-ring mt-8">
            back to bloomscroll →
          </Link>
        </div>
      </main>
    </div>
  );
}
