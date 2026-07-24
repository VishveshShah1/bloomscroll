"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { STRINGS, useLang, type Lang, type Strings } from "@/lib/i18n";
import type { CheckResponse, Verdict } from "@/lib/types";

const VERDICT_COLORS: Record<Verdict, { bg: string; text: string; border: string }> = {
  supported: { bg: "#E4EDE3", text: "#275C36", border: "#BCD3BF" },
  mixed: { bg: "#ECEFD9", text: "#5A6121", border: "#CBD3A6" },
  weak: { bg: "#F4ECD7", text: "#7D5F17", border: "#DCC896" },
  no_evidence: { bg: "#E9EBE6", text: "#565C52", border: "#C9CDC4" },
  not_empirical: { bg: "#E9E8F2", text: "#524F78", border: "#C6C4DC" },
};

const VERDICT_ORDER: Verdict[] = ["supported", "mixed", "weak", "no_evidence", "not_empirical"];

const EXAMPLES: Record<Lang, string[]> = {
  en: ["mewing reshapes your jawline", "bone smashing sharpens your face", "daily sunscreen prevents skin cancer"],
  fr: ["le mewing redessine ta mâchoire", "le bone smashing affine ton visage", "la crème solaire prévient le cancer de la peau"],
};

const CONTACT_EMAIL = "vishvesh380@gmail.com";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chlorophyll";

type Stage =
  | { stage: "reading" }
  | { stage: "claims"; n: number }
  | { stage: "searching" }
  | { stage: "grading" };

function stageText(stage: Stage | null, t: Strings): string {
  if (!stage) return t.status.checking;
  switch (stage.stage) {
    case "reading":
      return t.stages.reading;
    case "claims":
      return t.stages.claims.replace("{n}", String(stage.n));
    case "searching":
      return t.stages.searching;
    case "grading":
      return t.stages.grading;
    default:
      return t.status.checking;
  }
}

/** Captures the browser's install prompt so we can offer a one-tap PWA install. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
function useInstall() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return {
    canInstall: !!deferred,
    installed,
    promptInstall: () => deferred && void deferred.prompt(),
  };
}

function Badge({
  verdict,
  label,
}: {
  verdict: Verdict;
  label: string;
}) {
  const v = VERDICT_COLORS[verdict];
  return (
    <span
      className="inline-block rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.09em]"
      style={{ background: v.bg, color: v.text, borderColor: v.border }}
    >
      {label}
    </span>
  );
}

/** Glass card with a subtle pointer-follow tilt. Never hides its content. */
function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "transform 60ms linear";
    el.style.transform = `perspective(900px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
    el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`glass group relative overflow-hidden rounded-2xl ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.5), transparent 45%)",
        }}
      />
      {children}
    </div>
  );
}

/** Pure-CSS drifting color fields behind the glass. No JS — cannot break render. */
function Orbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="orb"
        style={{
          position: "absolute", left: "-12vw", top: "-14vh",
          width: "48vw", height: "48vw", minWidth: 340, minHeight: 340,
          background: "rgba(46,107,63,0.30)",
          animation: "drift-a 26s ease-in-out infinite alternate",
        }}
      />
      <div
        className="orb"
        style={{
          position: "absolute", right: "-10vw", top: "26vh",
          width: "40vw", height: "40vw", minWidth: 300, minHeight: 300,
          background: "rgba(116,113,159,0.26)",
          animation: "drift-b 34s ease-in-out infinite alternate",
        }}
      />
      <div
        className="orb"
        style={{
          position: "absolute", left: "18vw", bottom: "-20vh",
          width: "36vw", height: "36vw", minWidth: 280, minHeight: 280,
          background: "rgba(169,133,45,0.20)",
          animation: "drift-c 42s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}

/** Floating example cards that fill the hero's right column on desktop. */
function DemoStack({ t }: { t: Strings }) {
  return (
    <div aria-hidden="true" className="relative hidden h-[420px] lg:block">
      <div className="float-slow absolute right-0 top-6 w-[82%] rotate-[4deg] opacity-80">
        <TiltCard className="p-5">
          <p className="font-display text-[17px] italic leading-snug">
            &ldquo;Daily sunscreen prevents skin cancer.&rdquo;
          </p>
          <div className="mt-3">
            <Badge verdict="supported" label={t.verdictLabels.supported} />
          </div>
        </TiltCard>
      </div>
      <div className="float-slower absolute left-0 top-40 w-[88%] rotate-[-2deg]">
        <TiltCard className="p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-stone">
            {t.hero.demoTag}
          </p>
          <p className="mt-2 font-display text-[19px] italic leading-snug">
            &ldquo;Mewing permanently reshapes your jawline.&rdquo;
          </p>
          <div className="mt-3">
            <Badge verdict="weak" label={t.verdictLabels.weak} />
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-[#39413A]">{t.hero.demoNote}</p>
          <p className="mt-3 font-mono text-[12px] text-chlorophyll">{t.hero.demoCite}</p>
        </TiltCard>
      </div>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useLang();
  const t = STRINGS[lang];
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [stage, setStage] = useState<Stage | null>(null);
  const [data, setData] = useState<CheckResponse | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { canInstall, installed, promptInstall } = useInstall();
  const langRef = useRef(lang);
  langRef.current = lang;
  const runningRef = useRef(false);

  async function runCheck(text: string) {
    const trimmed = text.trim();
    if (!trimmed || runningRef.current) return;
    runningRef.current = true;
    setStatus("checking");
    setStage(null);
    setData(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed, lang: langRef.current }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let settled = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim();
          if (!line) continue;
          const msg = JSON.parse(line) as
            | Stage
            | { stage: "done"; payload: CheckResponse }
            | { stage: "error" };
          if (msg.stage === "done") {
            setData(msg.payload);
            setStatus("done");
            settled = true;
          } else if (msg.stage === "error") {
            setStatus("error");
            settled = true;
          } else {
            setStage(msg);
          }
        }
      }
      if (!settled) setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      runningRef.current = false;
    }
  }

  function clearAll() {
    setInput("");
    setData(null);
    setStatus("idle");
    setStage(null);
    const el = document.getElementById("check-input") as HTMLInputElement | null;
    el?.focus();
  }

  // Share targets and the bookmarklet land here as /?q=…
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setInput(q);
      void runCheck(q);
      window.history.replaceState({}, "", "/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runCheck(input);
  }

  function focusInput() {
    setMenuOpen(false);
    const el = document.getElementById("check-input") as HTMLInputElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  }

  const navLinks = [
    { href: "#how", label: t.nav.how },
    { href: "#verdicts", label: t.nav.verdicts },
    { href: "#pricing", label: t.nav.pricing },
  ];

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.contact.subject)}`;

  return (
    <>
      <Orbs />

      <nav
        aria-label="Main"
        className="sticky top-0 z-40 border-b border-loam/10 bg-[rgba(241,243,236,0.72)] backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Wordmark busy={status === "checking"} className="text-[25px]" />
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden items-center gap-6 md:flex">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className={`text-[14.5px] font-bold text-fern transition hover:text-loam ${FOCUS_RING}`}
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/access"
                className={`text-[14.5px] font-bold text-fern transition hover:text-loam ${FOCUS_RING}`}
              >
                {t.nav.getApp}
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "fr" : "en")}
              aria-label={lang === "en" ? "Passer en français" : "Switch to English"}
              className={`rounded-lg border border-loam/15 px-2.5 py-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-fern transition hover:text-loam ${FOCUS_RING}`}
            >
              {lang === "en" ? "FR" : "EN"}
            </button>
            <button
              type="button"
              onClick={focusInput}
              className={`hidden rounded-lg bg-loam px-4 py-2 text-[14px] font-bold text-underleaf transition hover:-translate-y-0.5 hover:opacity-90 sm:inline-block ${FOCUS_RING}`}
            >
              {t.nav.check}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={t.nav.menu}
              aria-expanded={menuOpen}
              className={`rounded-lg border border-loam/15 px-3 py-1.5 text-[16px] font-bold text-loam md:hidden ${FOCUS_RING}`}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="absolute inset-x-0 top-16 border-b border-loam/10 bg-[rgba(241,243,236,0.95)] px-5 py-5 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`text-[16px] font-bold text-loam ${FOCUS_RING}`}
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/access"
                onClick={() => setMenuOpen(false)}
                className={`text-[16px] font-bold text-loam ${FOCUS_RING}`}
              >
                {t.nav.getApp}
              </Link>
              <a
                href="#contact"
                onClick={() => setMenuOpen(false)}
                className={`text-[16px] font-bold text-loam ${FOCUS_RING}`}
              >
                {t.footer.contactLink}
              </a>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <section className="grid items-center gap-12 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
          <div>
            <h1 className="font-display text-[42px] font-semibold leading-[1.06] sm:text-[56px] xl:text-[64px]">
              <span className="anim-rise3d block" style={{ animationDelay: "60ms" }}>
                {t.hero.line1}
              </span>
              <span className="anim-rise3d block text-chlorophyll" style={{ animationDelay: "180ms" }}>
                {t.hero.line2}
              </span>
            </h1>
            <p className="mt-5 max-w-[54ch] text-[16.5px] leading-relaxed text-fern">{t.hero.sub}</p>

            <form onSubmit={onSubmit} className="mt-8 flex gap-2.5">
              <label htmlFor="check-input" className="sr-only">
                {t.hero.placeholder}
              </label>
              <div className="relative min-w-0 flex-1">
                <input
                  id="check-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.hero.placeholder}
                  autoComplete="off"
                  className={`glass w-full rounded-xl py-3.5 pl-4 pr-10 text-[16px] text-loam placeholder:text-stone ${FOCUS_RING}`}
                />
                {input && (
                  <button
                    type="button"
                    onClick={clearAll}
                    aria-label={t.ui.clear}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[18px] leading-none text-stone transition hover:text-loam ${FOCUS_RING}`}
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={status === "checking"}
                className={`rounded-xl bg-loam px-6 py-3.5 text-[16px] font-bold text-underleaf transition hover:-translate-y-0.5 hover:opacity-90 disabled:translate-y-0 disabled:opacity-60 ${FOCUS_RING}`}
              >
                {t.hero.check}
              </button>
            </form>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-stone">
                {t.hero.tryOne}
              </span>
              {EXAMPLES[lang].map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => {
                    setInput(x);
                    void runCheck(x);
                  }}
                  className={`glass rounded-full px-3.5 py-1.5 text-[13px] text-loam/85 transition hover:-translate-y-0.5 ${FOCUS_RING}`}
                >
                  {x}
                </button>
              ))}
            </div>

            <p className="mt-4 text-[13.5px] text-fern">{t.hero.disclaimer}</p>
          </div>

          <DemoStack t={t} />
        </section>

        <section aria-live="polite" className="mt-12">
          {status === "checking" && (
            <p className="flex items-center gap-2.5 font-mono text-[13.5px] text-fern">
              <span className="h-2 w-2 animate-pulse rounded-full bg-dopamine motion-reduce:animate-none" />
              {stageText(stage, t)}
            </p>
          )}

          {status === "error" && (
            <p className="font-mono text-[13.5px] text-fern">{t.status.error}</p>
          )}

          {status === "done" && data?.resolveError && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearAll}
                  className={`rounded-lg border border-loam/15 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fern transition hover:text-loam ${FOCUS_RING}`}
                >
                  {t.ui.clear}
                </button>
              </div>
              <TiltCard className="max-w-2xl p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-stone">
                  {t.status.couldntRead}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#39413A]">
                  {data.resolveError.message}
                </p>
              </TiltCard>
            </div>
          )}

          {status === "done" && data && !data.resolveError && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {data.source && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-stone">
                      {t.status.read} · {data.source.type}
                      {data.source.title ? ` — ${data.source.title.slice(0, 60)}` : ""}
                      {data.source.chars ? ` · ${data.source.chars} ${t.status.chars}` : ""}
                    </p>
                  )}
                  {data.mock && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-stone">
                      {t.status.sample}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  className={`rounded-lg border border-loam/15 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fern transition hover:text-loam ${FOCUS_RING}`}
                >
                  {t.ui.clear}
                </button>
              </div>

              {data.inputWarning && (
                <div className="rounded-2xl border border-[#F1B7C2] bg-[rgba(251,227,231,0.78)] p-5 backdrop-blur-xl">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A02742]">
                    ⚠ {data.inputWarning.label}
                  </p>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#6E1A2C]">
                    {data.inputWarning.message}
                  </p>
                </div>
              )}

              <div className="grid gap-5 lg:grid-cols-2">
                {data.claims?.map((c) => (
                  <TiltCard key={c.claim} className="p-6">
                    <p className="font-display text-[20px] italic leading-snug">
                      &ldquo;{c.claim}&rdquo;
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <Badge verdict={c.verdict} label={t.verdictLabels[c.verdict]} />
                      <span className="text-[12.5px] font-semibold text-fern">
                        {t.verdictMeanings[c.verdict]}
                      </span>
                    </div>
                    {c.safety && (
                      <p className="mt-3 rounded-lg border border-[#F1B7C2] bg-[#FBE3E7] p-3 text-[13px] leading-relaxed text-[#8F2138]">
                        ⚠ {c.safety.message}
                      </p>
                    )}
                    <p className="mt-3 text-[15px] leading-relaxed text-[#39413A]">{c.summary}</p>
                    {c.citations.length > 0 && (
                      <p className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1">
                        {c.citations.map((cit) => (
                          <a
                            key={cit.url + cit.title}
                            href={cit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-mono text-[13px] text-chlorophyll underline underline-offset-[3px] hover:opacity-80 ${FOCUS_RING}`}
                          >
                            {cit.journal} · {cit.year}
                          </a>
                        ))}
                      </p>
                    )}
                  </TiltCard>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="pt-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.stats.map((s) => (
              <div key={s.label} className="glass h-full rounded-2xl p-5 text-center">
                <p className="font-display text-[34px] font-semibold text-chlorophyll">{s.value}</p>
                <p className="mt-1 text-[13.5px] leading-snug text-fern">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-24" aria-labelledby="how-title">
          <h2 id="how" className="scroll-mt-24 font-display text-[30px] font-semibold sm:text-[36px]">
            <span id="how-title">{t.how.title}</span>
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {t.how.steps.map((s, i) => (
              <TiltCard key={s.title} className="h-full p-6">
                <p className="font-mono text-[12px] font-semibold text-chlorophyll">0{i + 1}</p>
                <h3 className="mt-2.5 text-[17px] font-bold">{s.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-fern">{s.body}</p>
              </TiltCard>
            ))}
          </div>

          <h2 id="verdicts" className="mt-16 scroll-mt-24 font-display text-[30px] font-semibold sm:text-[36px]">
            {t.verdictsTitle}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERDICT_ORDER.map((verdict) => (
              <TiltCard key={verdict} className="h-full p-5">
                <Badge verdict={verdict} label={t.verdictLabels[verdict]} />
                <p className="mt-3 text-[15px] font-bold leading-snug text-loam">
                  {t.verdictMeanings[verdict]}
                </p>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-fern">
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-chlorophyll">
                    {t.verdictExtra.looksLike} ·{" "}
                  </span>
                  {t.verdictDetails[verdict].evidence}
                </p>
                <p className="mt-2.5 border-t border-loam/10 pt-2.5 text-[13px] italic leading-relaxed text-stone">
                  {t.verdictExtra.forExample}: {t.verdictDetails[verdict].example}
                </p>
              </TiltCard>
            ))}
          </div>
        </section>

        <section className="pt-24">
          <div className="glass flex flex-col items-start justify-between gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="font-display text-[26px] font-semibold sm:text-[32px]">{t.ui.installTitle}</h2>
              <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-fern">{t.ui.installBody}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {installed ? (
                <span className="rounded-xl border border-chlorophyll/40 bg-[#E4EDE3] px-5 py-3 font-mono text-[13px] font-semibold text-[#275C36]">
                  {t.ui.installed}
                </span>
              ) : canInstall ? (
                <button
                  type="button"
                  onClick={promptInstall}
                  className={`rounded-xl bg-loam px-6 py-3.5 text-[15px] font-bold text-underleaf transition hover:-translate-y-0.5 hover:opacity-90 ${FOCUS_RING}`}
                >
                  {t.ui.installApp}
                </button>
              ) : null}
              <Link
                href="/access"
                className={`rounded-xl border border-loam/20 px-6 py-3.5 text-[15px] font-bold text-loam transition hover:-translate-y-0.5 hover:border-loam/40 ${FOCUS_RING}`}
              >
                {t.ui.howToInstall} →
              </Link>
            </div>
          </div>
        </section>

        <section className="pt-24" aria-labelledby="pricing-title">
          <h2 id="pricing" className="scroll-mt-24 font-display text-[30px] font-semibold sm:text-[36px]">
            <span id="pricing-title">{t.pricing.title}</span>
          </h2>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-fern">{t.pricing.sub}</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {t.pricing.plans.map((p, i) => (
              <TiltCard key={p.name} className={`h-full p-7 ${i === 1 ? "ring-1 ring-chlorophyll/30" : ""}`}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-[26px] font-semibold">{p.name}</h3>
                  <span className="font-mono text-[15px] font-semibold text-fern">{p.price}</span>
                </div>
                <p className="mt-1 font-mono text-[11.5px] uppercase tracking-[0.1em] text-stone">
                  {p.tagline}
                </p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-[14.5px] leading-relaxed text-fern">
                      <span className="font-bold text-chlorophyll">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled
                  className={`mt-6 w-full cursor-not-allowed rounded-xl border px-4 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] ${
                    p.live
                      ? "border-chlorophyll/40 bg-[#E4EDE3] text-[#275C36]"
                      : "border-loam/15 bg-[rgba(250,251,247,0.5)] text-stone"
                  }`}
                >
                  {p.live ? t.pricing.freeBeta : t.pricing.soon}
                </button>
              </TiltCard>
            ))}
          </div>
        </section>

        <section className="pt-24" aria-labelledby="faq-title">
          <h2 id="faq-title" className="font-display text-[30px] font-semibold sm:text-[36px]">
            {t.faq.title}
          </h2>
          <div className="mt-6 flex flex-col gap-3">
            {t.faq.items.map((item) => (
              <details key={item.q} className="glass group rounded-2xl p-5">
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-bold [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}
                >
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="text-[22px] font-bold leading-none text-chlorophyll transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[75ch] text-[14.5px] leading-relaxed text-fern">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="pt-24" aria-labelledby="contact-title">
          <div id="contact" className="glass scroll-mt-24 rounded-2xl p-8 sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h2 id="contact-title" className="font-display text-[28px] font-semibold sm:text-[34px]">
                  {t.contact.title}
                </h2>
                <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-fern">{t.contact.body}</p>
              </div>
              <div className="lg:text-right">
                <a
                  href={mailto}
                  className={`inline-block rounded-xl bg-loam px-6 py-3.5 text-[15.5px] font-bold text-underleaf transition hover:-translate-y-0.5 hover:opacity-90 ${FOCUS_RING}`}
                >
                  {t.contact.button}
                </a>
                <p className="mt-3 font-mono text-[12px] text-stone">{CONTACT_EMAIL}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-24">
          <div className="glass rounded-2xl p-10 text-center sm:p-14">
            <p className="font-display text-[28px] font-semibold leading-[1.15] sm:text-[38px]">
              {t.cta.title}
            </p>
            <button
              type="button"
              onClick={focusInput}
              className={`mt-6 rounded-xl bg-chlorophyll px-7 py-3.5 text-[16px] font-bold text-underleaf transition hover:-translate-y-0.5 hover:opacity-90 ${FOCUS_RING}`}
            >
              {t.cta.button}
            </button>
          </div>
        </section>

        <footer className="mt-24 border-t border-loam/10 py-12">
          <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Wordmark className="text-[22px]" />
              <p className="mt-2.5 max-w-[36ch] text-[13.5px] leading-relaxed text-fern">
                {t.hero.line1} {t.hero.line2}
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-stone">
                {t.footer.product}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className={`w-fit text-[14px] font-bold text-fern transition hover:text-loam ${FOCUS_RING}`}
                  >
                    {l.label}
                  </a>
                ))}
                <Link
                  href="/access"
                  className={`w-fit text-[14px] font-bold text-fern transition hover:text-loam ${FOCUS_RING}`}
                >
                  {t.nav.getApp}
                </Link>
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-stone">
                {t.footer.about}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href={mailto}
                  className={`w-fit text-[14px] font-bold text-fern transition hover:text-loam ${FOCUS_RING}`}
                >
                  {t.footer.contactLink}
                </a>
                <p className="text-[14px] text-fern">{t.footer.tks}</p>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-2 border-t border-loam/10 pt-6 sm:flex-row">
            <p className="text-[12.5px] text-stone">{t.footer.disclaimer}</p>
            <p className="font-mono text-[11px] text-stone">{t.footer.rights}</p>
          </div>
        </footer>
      </main>
    </>
  );
}
