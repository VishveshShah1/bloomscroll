"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Android share_target lands here (GET /share?url=...&text=...&title=...).
// We fold whatever arrived into ?q= on the homepage, which auto-runs the check.
function ShareInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const q = params.get("url") || params.get("text") || params.get("title") || "";
    router.replace(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }, [params, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-underleaf">
      <p className="font-mono text-[13px] text-fern">opening bloomscroll…</p>
    </main>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={null}>
      <ShareInner />
    </Suspense>
  );
}
