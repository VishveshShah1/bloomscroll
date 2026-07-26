"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Wordmark from "@/components/Wordmark";

interface Review {
  email: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  timestamp: string;
  bonusGranted: number;
}

/**
 * Admin-only view of submitted reviews. Gated at the API level by the
 * ADMIN_EMAIL env var — this page will just render "forbidden" for
 * anyone else. Reviews are never surfaced on the public site; this is
 * a private tool for the operator to eyeball submissions and pick
 * quotes to feature manually with the reviewer's permission.
 */
export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "reviews"; reviews: Review[] }
    | { kind: "forbidden" }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/admin/reviews", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 403) {
          setState({ kind: "forbidden" });
          return;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as { reviews: Review[] };
        setState({ kind: "reviews", reviews: data.reviews });
      })
      .catch((e) =>
        setState({
          kind: "error",
          message: e instanceof Error ? e.message : "load failed",
        }),
      );
  }, [status]);

  if (status === "loading" || state.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-bark">
        <p className="text-[14px]">Loading…</p>
      </div>
    );
  }
  if (status !== "authenticated" || state.kind === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="surface max-w-md p-6 text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
            admin only
          </p>
          <h1 className="mt-2 text-[22px] font-semibold text-ink">
            Not for this account.
          </h1>
          <p className="mt-2 text-[14px] text-bark">
            This view is limited to the operator email set in
            ADMIN_EMAIL. Signed in as{" "}
            {session?.user?.email ?? "no one"}.
          </p>
          <Link
            href="/"
            className="focus-ring mt-4 inline-block text-[13px] font-semibold text-forest underline underline-offset-[3px]"
          >
            back to home
          </Link>
        </div>
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[13px] text-warn">Couldn&apos;t load: {state.message}</p>
      </div>
    );
  }

  const { reviews } = state;
  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;

  return (
    <div className="min-h-screen">
      <nav className="border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="focus-ring rounded-md">
            <Wordmark className="text-[22px]" />
          </Link>
          <Link
            href="/dashboard"
            className="focus-ring text-[13px] font-semibold text-bark transition hover:text-ink"
          >
            ← dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-4xl px-5 pb-24 pt-14 sm:px-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
          admin · reviews
        </p>
        <h1 className="mt-3 text-[36px] font-semibold leading-tight tracking-display text-ink">
          Submitted reviews
        </h1>
        <p className="mt-3 text-[15px] text-bark">
          {reviews.length} review{reviews.length === 1 ? "" : "s"} ·{" "}
          {reviews.length === 0
            ? "no ratings yet"
            : `average ${avg.toFixed(2)} / 5`}
          . Private — never rendered on the public site. Ask the reviewer
          before quoting any of these.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {reviews.length === 0 && (
            <div className="surface p-6">
              <p className="text-[14px] text-bark">
                No reviews yet. Once people submit through the dashboard, they
                land here.
              </p>
            </div>
          )}
          {reviews.map((r) => (
            <article
              key={`${r.email}-${r.timestamp}`}
              className="surface p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="inline-flex items-center gap-2"
                  aria-label={`${r.stars} out of 5 stars`}
                >
                  {"★".repeat(r.stars)}
                  <span className="text-[12px] font-medium text-bark">
                    {r.stars}/5
                  </span>
                </span>
                <span className="text-[12px] text-bark">
                  {new Date(r.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-[13px] font-semibold text-forest">
                {r.email}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
                {r.comment}
              </p>
              <p className="mt-3 text-[11.5px] text-bark">
                bonus granted: +{r.bonusGranted} checks
              </p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
