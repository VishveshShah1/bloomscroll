"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /check used to host the checker. The checker now lives on /dashboard,
 * which is the single page for everything, so this route only forwards.
 *
 * Kept rather than deleted because it's a published entry point: the PWA
 * share target hops through here, the extension and bookmarklet hand off
 * ?q=…, and people have the URL bookmarked. Dropping it would 404 all of
 * those. The ?q= payload is carried across so a shared claim still
 * auto-runs once it lands on the dashboard.
 */
function CheckRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const q = params.get("q");
    router.replace(q ? `/dashboard?q=${encodeURIComponent(q)}` : "/dashboard");
  }, [params, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-[13px] text-bark">opening bloomscroll…</p>
    </main>
  );
}

export default function CheckPage() {
  return (
    <Suspense fallback={null}>
      <CheckRedirect />
    </Suspense>
  );
}
