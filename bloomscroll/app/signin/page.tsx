"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import { STRINGS, useLang } from "@/lib/i18n";

const ERRORS: Record<string, string> = {
  OAuthSignin: "Couldn't reach Google. Check the sign in provider setup and try again.",
  OAuthCallback: "Sign in was cancelled or interrupted. Try again.",
  OAuthAccountNotLinked: "That email is already linked to another sign in method.",
  AccessDenied: "Google denied the sign in request.",
  Configuration: "Sign in isn't configured on the server yet.",
  Verification: "The sign in link expired. Try again.",
};

function SignInInner() {
  const [lang] = useLang();
  const t = STRINGS[lang];
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const [busy, setBusy] = useState(false);
  // Required: must be checked before Google button is clickable. Fresh
  // page load resets it — that's intentional, we ask each new session.
  const [tosAccepted, setTosAccepted] = useState(false);
  // Optional: opt-in (never opt-out). Unchecked by default.
  const [emailOptIn, setEmailOptIn] = useState(false);
  const callbackUrl = params.get("callbackUrl") || "/check";
  const errorCode = params.get("error");
  const errorMessage = errorCode ? (ERRORS[errorCode] ?? "Sign in failed. Try again.") : null;

  // If we're already signed in when the page loads, jump straight to the checker.
  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, router, callbackUrl]);

  async function onGoogle() {
    if (!tosAccepted) return;
    setBusy(true);
    // Stash consent flags so a small post-auth sync (ConsentSync) can
    // POST them to /api/consent once the session cookie exists. Cleared
    // by the sync on success. Session-scoped: nothing persists across tabs.
    try {
      sessionStorage.setItem(
        "bloom:pending-consent",
        JSON.stringify({
          tos: true,
          email: emailOptIn,
          at: new Date().toISOString(),
        }),
      );
    } catch {
      // storage may be blocked (private mode) — sign-in still proceeds
    }
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="focus-ring rounded-md">
            <Wordmark className="text-[22px]" />
          </Link>
          <Link
            href="/"
            className="focus-ring text-[14px] font-semibold text-bark transition hover:text-ink"
          >
            ← {t.access.back}
          </Link>
        </div>
      </nav>

      <main className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-lg place-items-center overflow-hidden px-5 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-[360px] w-[360px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #DDE7DA 0%, transparent 70%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-[360px] w-[360px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #E8EDDE 0%, transparent 70%)" }}
        />
        <div className="surface-lg relative w-full p-9 sm:p-11">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
            {t.hero.tagline}
          </p>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.03] tracking-display text-ink sm:text-[42px]">
            {t.signin.title}
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-bark">{t.signin.sub}</p>

          {errorMessage && (
            <p className="mt-5 rounded-xl border border-warn/40 bg-warn/10 p-3 text-[13.5px] leading-relaxed text-warn">
              {errorMessage}
            </p>
          )}

          {/* Consent block — must be checked before Google button becomes
              live. Email opt-in is separate and default-off (opt-in, not
              opt-out). Choices are persisted post-auth by ConsentSync. */}
          <div className="mt-7 flex flex-col gap-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-white/60 p-3.5 text-[13.5px] leading-relaxed text-ink transition hover:border-ink/25">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                className="focus-ring mt-0.5 h-4 w-4 shrink-0 accent-forest"
                aria-required="true"
              />
              <span>
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="focus-ring font-semibold text-forest underline underline-offset-[3px]"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="focus-ring font-semibold text-forest underline underline-offset-[3px]"
                >
                  Privacy Policy
                </Link>
                . <span className="text-bark">Required to sign up.</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-white/40 p-3.5 text-[13.5px] leading-relaxed text-ink transition hover:border-ink/25">
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="focus-ring mt-0.5 h-4 w-4 shrink-0 accent-forest"
              />
              <span>
                Send me occasional product updates and notes about new features.
                <span className="text-bark">
                  {" "}
                  Optional, off by default. You can turn this off any time in the
                  dashboard.
                </span>
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={busy || !tosAccepted}
            aria-disabled={busy || !tosAccepted}
            className="focus-ring mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-ink/12 bg-white px-5 py-3.5 text-[15px] font-semibold text-ink transition hover:-translate-y-0.5 hover:border-ink/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.5l6.6-6.6C35.4 2.7 30 .5 24 .5 14.7.5 6.7 5.8 2.8 13.5l7.7 6C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9.4h12.7c-.5 3-2.2 5.5-4.6 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17.7z" />
              <path fill="#FBBC05" d="M10.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.7-6C1 17.1 0 20.4 0 24s1 6.9 2.8 10.5l7.7-6z" />
              <path fill="#34A853" d="M24 47.5c6.5 0 11.9-2.2 15.9-6l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.7 6C6.7 42.2 14.7 47.5 24 47.5z" />
            </svg>
            {busy ? "…" : t.signin.google}
          </button>

          {!tosAccepted && (
            <p className="mt-3 text-[12.5px] text-bark">
              Tick the Terms box above to unlock the Google button.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
