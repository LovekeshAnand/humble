"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowCounterClockwiseIcon, ArrowLeftIcon, ArrowRightIcon, BookmarkSimpleIcon, QuestionIcon, StarIcon, XIcon } from "@phosphor-icons/react";
import { CATEGORIES } from "@/lib/categories";
import { buildProfile, nextCard, reasonFor, seeded } from "@/lib/recommend";
import { saved, useSaved, type SavedState } from "@/lib/saved";
import { authorName, cleanSnippet, fmtCount, githubUrl, platformOf, toolPath, type LeanTool } from "@/lib/format";
import Avatar from "./avatar";
import CategoryIcon from "./category-icon";
import ExtLink from "./ext-link";

type Kind = "like" | "skip";
const THRESHOLD = 110; // px of drag that counts as a decision
const FLICK = 0.6; // px per ms: a quick short throw also counts
const EXIT_MS = 500;
const TOUR_KEY = "humble:tour-done";

const catName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

// The top card plus two waiting behind it. "pinned" keeps the card that was already
// waiting in place when it moves forward, so the stack never swaps under the visitor.
function dealStack(tools: LeanTool[], state: SavedState, pinned: string | null) {
  const seen = new Set([...state.liked, ...state.skipped]);
  const out: LeanTool[] = [];
  const top = pinned && !seen.has(pinned) ? tools.find((t) => t.fullName === pinned) : undefined;
  if (top) out.push(top);
  let s = { ...state, skipped: [...state.skipped, ...out.map((t) => t.fullName)] };
  const base = state.liked.length + state.skipped.length;
  while (out.length < 3) {
    const c = nextCard(tools, s, seeded(base * 7919 + s.picks.length + out.length * 131));
    if (!c) break;
    out.push(c);
    s = { ...s, skipped: [...s.skipped, c.fullName] };
  }
  return out;
}

export default function Deck({ tools }: { tools: LeanTool[] }) {
  const state = useSaved();
  const [started, setStarted] = useState(false);
  const [picks, setPicks] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; kind: Kind }[]>([]);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<Kind | null>(null);
  const [announce, setAnnounce] = useState("");
  const [tour, setTour] = useState<number | null>(null);
  const [bursts, setBursts] = useState<number[]>([]);
  const drag = useRef({ x: 0, lastX: 0, lastT: 0, vx: 0 });

  const stack = useMemo(() => dealStack(tools, state, pinned), [tools, state, pinned]);
  const top = stack[0] ?? null;
  const seen = state.liked.length + state.skipped.length;
  const onboarding = !started && seen === 0 && state.picks.length === 0;

  const reason = useMemo(() => {
    if (!top) return "";
    const byId = new Map(tools.map((t) => [t.fullName, t] as const));
    const r = reasonFor(top, buildProfile(byId, state.liked, state.skipped, state.picks));
    return r ? `Because you like ${catName(r)}` : "Popular with developers";
  }, [top, tools, state]);

  function decide(kind: Kind) {
    if (!top || leaving || tour !== null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLeaving(kind);
    if (kind === "like") {
      // A GitHub star pops for every save, then clears itself.
      const id = Date.now();
      setBursts((b) => [...b, id]);
      window.setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 1200);
    }
    window.setTimeout(() => {
      if (kind === "like") saved.like(top.fullName);
      else saved.skip(top.fullName);
      setHistory((h) => [...h, { id: top.fullName, kind }]);
      setPinned(stack[1]?.fullName ?? null);
      setAnnounce(`${kind === "like" ? "Saved" : "Skipped"} ${top.name}`);
      setLeaving(null);
      setDx(0);
    }, reduce ? 0 : EXIT_MS);
  }

  function undo() {
    const last = history.at(-1);
    if (!last || leaving) return;
    saved.forget(last.id);
    setHistory((h) => h.slice(0, -1));
    setPinned(last.id);
    setAnnounce(`Brought back ${tools.find((t) => t.fullName === last.id)?.name ?? "the last card"}`);
  }

  function closeTour() {
    setTour(null);
    try { localStorage.setItem(TOUR_KEY, "1"); } catch { /* storage blocked: the tour may show again */ }
  }

  function start() {
    saved.setPicks(picks);
    setStarted(true);
    let done = false;
    try { done = localStorage.getItem(TOUR_KEY) === "1"; } catch { /* storage blocked */ }
    if (!done) setTour(0);
  }

  // ← skips, → saves, Backspace undoes, unless the visitor is typing.
  const keys = useRef({ decide, undo });
  useEffect(() => { keys.current = { decide, undo }; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); keys.current.decide("like"); }
      if (e.key === "ArrowLeft") { e.preventDefault(); keys.current.decide("skip"); }
      if (e.key === "Backspace") { e.preventDefault(); keys.current.undo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (onboarding) {
    return (
      <section aria-labelledby="pick" className="mx-auto mt-12 w-full max-w-xl rounded-3xl border border-line bg-surface p-8 text-left">
        <h2 id="pick" className="text-2xl font-semibold">What are you into?</h2>
        <p className="mt-2 text-fg-muted">Pick a few so your first cards fit. You can also skip this and let your swipes decide.</p>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Interests">
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              className="chip"
              aria-pressed={picks.includes(c.slug)}
              onClick={() => setPicks((p) => (p.includes(c.slug) ? p.filter((x) => x !== c.slug) : [...p, c.slug]))}
            >
              <CategoryIcon slug={c.slug} size={16} />
              {c.name}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary mt-8 w-full" onClick={start}>
          {picks.length ? `Start swiping with ${picks.length} picked` : "Start swiping"}
        </button>
      </section>
    );
  }

  if (!top) {
    return (
      <section className="mx-auto mt-12 w-full max-w-xl rounded-3xl border border-line bg-surface p-8 text-left">
        <h2 className="text-2xl font-semibold">You have seen every tool</h2>
        <p className="mt-2 text-fg-muted">{state.liked.length} saved. New tools arrive every six hours as people recommend them.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/saved" className="btn btn-primary">Open my saved tools</Link>
          <button type="button" className="btn btn-secondary" onClick={() => saved.resetSwipes()}>Show skipped tools again</button>
        </div>
      </section>
    );
  }

  const lean = Math.min(1, Math.abs(dx) / THRESHOLD);
  const place = (i: number) => {
    if (i === 0) {
      // The left and right motion: slide sideways with a tilt, then fly off screen.
      const x = leaving ? (leaving === "like" ? 1 : -1) * Math.max(900, typeof window === "undefined" ? 900 : window.innerWidth) : dx;
      return { transform: `translateX(${x}px) rotate(${Math.max(-18, Math.min(18, x / 18))}deg)` };
    }
    const step = Math.max(0, i - (leaving ? 1 : lean));
    return { transform: `translateY(${step * 16}px) scale(${1 - step * 0.05})`, opacity: 1 - step * 0.3 };
  };

  return (
    <section aria-label="Swipe deck" className="mx-auto mt-10 w-full max-w-xl">
      <p className="visually-hidden" aria-live="polite">{announce}</p>

      <div className="mb-4 flex items-center justify-between gap-3 text-sm">
        <p className="inline-flex items-center gap-2 text-fg-muted">
          <span className="size-2 rounded-full bg-save" aria-hidden="true" />
          {reason}
        </p>
        <button type="button" className="inline-flex items-center gap-1 text-fg-muted transition-colors duration-300 ease-(--ease-soft) hover:text-fg" onClick={() => setTour(0)}>
          <QuestionIcon size={16} aria-hidden="true" />
          How it works
        </button>
      </div>

      <div className="relative">
        {/* Side hints on wide screens: which way does what. */}
        <p aria-hidden="true" className="absolute top-1/2 -left-40 hidden -translate-y-1/2 items-center gap-2 text-sm text-fg-subtle transition-opacity duration-300 lg:flex" style={{ opacity: dx < 0 ? 1 : 0.6 }}>
          <span className="kbd">←</span> Skip
        </p>
        <p aria-hidden="true" className="absolute top-1/2 -right-40 hidden -translate-y-1/2 items-center gap-2 text-sm text-fg-subtle transition-opacity duration-300 lg:flex" style={{ opacity: dx > 0 ? 1 : 0.6 }}>
          Save <span className="kbd">→</span>
        </p>

        {bursts.map((id) => <StarBurst key={id} />)}
        <div className="deck-stack">
          {[...stack].reverse().map((t) => {
            const i = stack.indexOf(t);
            const isTop = i === 0;
            return (
              <article
                key={t.fullName}
                data-tour={isTop ? "card" : undefined}
                aria-labelledby={isTop ? "card-name" : undefined}
                aria-hidden={!isTop}
                inert={!isTop}
                className={`deck-card text-left ${isTop ? "is-top" : ""} ${isTop && dragging ? "is-dragging" : ""}`}
                style={{ ...place(i), zIndex: 3 - i }}
                onPointerDown={isTop ? (e) => {
                  if ((e.target as HTMLElement).closest("a,button") || leaving) return;
                  drag.current = { x: e.clientX, lastX: e.clientX, lastT: e.timeStamp, vx: 0 };
                  setDragging(true);
                  e.currentTarget.setPointerCapture(e.pointerId);
                } : undefined}
                onPointerMove={isTop ? (e) => {
                  if (!dragging) return;
                  const d = drag.current;
                  d.vx = (e.clientX - d.lastX) / Math.max(1, e.timeStamp - d.lastT);
                  d.lastX = e.clientX;
                  d.lastT = e.timeStamp;
                  setDx(e.clientX - d.x);
                } : undefined}
                onPointerUp={isTop ? () => {
                  setDragging(false);
                  const { vx } = drag.current;
                  if (Math.abs(dx) > THRESHOLD || (Math.abs(vx) > FLICK && Math.abs(dx) > 40)) decide(dx > 0 ? "like" : "skip");
                  else setDx(0);
                } : undefined}
                onPointerCancel={isTop ? () => { setDragging(false); setDx(0); } : undefined}
              >
                {isTop && (
                  <>
                    <span aria-hidden="true" className="deck-stamp deck-stamp-save" style={{ opacity: dx > 0 ? lean : leaving === "like" ? 1 : 0 }}>Save</span>
                    <span aria-hidden="true" className="deck-stamp deck-stamp-skip" style={{ opacity: dx < 0 ? lean : leaving === "skip" ? 1 : 0 }}>Skip</span>
                  </>
                )}
                <CardFace tool={t} isTop={isTop} />
              </article>
            );
          })}
        </div>
      </div>

      <div data-tour="controls" className="relative mt-8 flex items-center justify-center gap-6">
        <button type="button" className="action size-16 border border-line-strong bg-surface text-skip hover:bg-raised" onClick={() => decide("skip")} aria-label={`Skip ${top.name}`} aria-keyshortcuts="ArrowLeft">
          <XIcon size={28} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="action size-12 border border-line-strong bg-surface text-fg-muted hover:bg-raised" onClick={undo} disabled={!history.length} aria-label="Undo last swipe" aria-keyshortcuts="Backspace">
          <ArrowCounterClockwiseIcon size={20} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="action size-16 bg-save text-save-ink" onClick={() => decide("like")} aria-label={`Save ${top.name}`} aria-keyshortcuts="ArrowRight">
          <BookmarkSimpleIcon size={28} weight="fill" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-6 text-sm text-fg-muted">
        <span className="hidden items-center justify-center gap-2 sm:inline-flex">
          Use <span className="kbd"><ArrowLeftIcon size={12} aria-label="left arrow" /></span> and{" "}
          <span className="kbd"><ArrowRightIcon size={12} aria-label="right arrow" /></span> on your keyboard to swipe.
        </span>
        <span className="sm:hidden">Drag the card, or tap the buttons.</span>
      </p>

      {tour !== null && <Tour step={tour} onNext={() => (tour < TOUR.length - 1 ? setTour(tour + 1) : closeTour())} onClose={closeTour} />}
    </section>
  );
}

// Eight small stars fly out around the big one.
const BITS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { dx: `${Math.round(Math.cos(a) * 120)}px`, dy: `${Math.round(Math.sin(a) * 120)}px`, r: `${i * 45}deg`, size: i % 2 ? 16 : 24 };
});

function StarBurst() {
  return (
    <div className="star-burst" aria-hidden="true">
      {BITS.map((b, i) => (
        <StarIcon key={i} size={b.size} weight="fill" className="star-bit" style={{ "--dx": b.dx, "--dy": b.dy, "--r": b.r } as React.CSSProperties} />
      ))}
      <StarIcon size={120} weight="fill" className="star-main" />
    </div>
  );
}

export function CardFace({ tool: t, isTop, links = true }: { tool: LeanTool; isTop: boolean; links?: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4">
        <Avatar fullName={t.fullName} size={48} />
        <div className="min-w-0">
          <h2 id={isTop ? "card-name" : undefined} className="truncate text-3xl font-semibold tracking-tight">{t.name}</h2>
          <p className="truncate font-mono text-xs text-fg-subtle">{t.fullName}</p>
        </div>
      </div>

      {t.categories.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {t.categories.slice(0, 3).map((c) => (
            <li key={c} className="inline-flex items-center gap-1 rounded-full bg-raised px-3 py-1 text-xs font-medium text-fg-muted">
              <CategoryIcon slug={c} size={12} />
              {catName(c)}
            </li>
          ))}
        </ul>
      )}

      {t.description && <p className="mt-4 text-lg text-fg">{clip(t.description, 150)}</p>}

      {t.quote && (
        <blockquote className="mt-4 rounded-2xl bg-raised p-4 text-sm">
          <p className="text-fg-muted">“{clip(cleanSnippet(t.quote.snippet), 170)}”</p>
          <footer className="mt-2 text-xs text-fg-subtle">{authorName(t.quote)} on {platformOf(t.quote.source)}</footer>
        </blockquote>
      )}

      <div className="mt-auto pt-4">
        <dl className="grid grid-cols-3 gap-2 rounded-2xl border border-line p-4 text-sm">
          <div>
            <dt className="text-xs text-fg-subtle">Recommended by</dt>
            <dd className="mt-1 font-mono text-xl font-semibold text-save">{t.mentionCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-subtle">Stars</dt>
            <dd className="mt-1 font-mono text-xl font-semibold">{fmtCount(t.stars)}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-subtle">Licence</dt>
            <dd className="mt-1 truncate font-mono text-xl font-semibold">{t.license}</dd>
          </div>
        </dl>
        {links && <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href={toolPath(t)} className="link text-fg-muted hover:text-fg">Details and every quote</Link>
          <ExtLink href={githubUrl(t)} className="link text-fg-muted hover:text-fg">GitHub</ExtLink>
        </p>}
      </div>
    </div>
  );
}

const TOUR = [
  { target: "card", title: "Drag the card", body: "Drag right to save a tool, left to skip it. Every card is a tool real people recommended, with what they said about it." },
  { target: "controls", title: "Or tap the buttons", body: "The cross skips, the bookmark saves, the arrow in the middle brings back your last card. On a keyboard: ← skips, → saves, Backspace undoes." },
  { target: "saved", title: "Your saved tools live here", body: "Everything you save lands in Saved, with GitHub and website links you can copy, download or share. The deck learns from every swipe." },
];

// Floating guide: dims the page, lifts the part it explains. Esc, the backdrop or "Skip tour" closes it.
function Tour({ step, onNext, onClose }: { step: number; onNext: () => void; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const s = TOUR[step];
  const last = step === TOUR.length - 1;

  useEffect(() => {
    const el = document.querySelector(`[data-tour="${s.target}"]`);
    const root = el?.closest("[data-tour-root]");
    el?.classList.add("tour-target");
    root?.classList.add("tour-lift");
    if (s.target !== "saved") el?.scrollIntoView({ block: "center", behavior: "smooth" });
    panel.current?.focus();
    return () => { el?.classList.remove("tour-target"); root?.classList.remove("tour-lift"); };
  }, [s.target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="tour-backdrop" aria-hidden="true" onClick={onClose} />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="tour-title" className={`tour-panel text-left ${s.target === "controls" ? "tour-panel-top" : ""}`}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-fg-subtle">Step {step + 1} of {TOUR.length}</p>
          <ol className="flex gap-1" aria-hidden="true">
            {TOUR.map((_, i) => <li key={i} className={`h-1 w-6 rounded-full ${i <= step ? "bg-save" : "bg-line-strong"}`} />)}
          </ol>
        </div>
        <h2 id="tour-title" className="mt-4 text-xl font-semibold">{s.title}</h2>
        <p className="mt-2 text-fg-muted">{s.body}</p>
        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" className="text-sm text-fg-muted transition-colors duration-300 ease-(--ease-soft) hover:text-fg" onClick={onClose}>Skip tour</button>
          <button type="button" className="btn btn-primary" onClick={onNext}>{last ? "Start swiping" : "Next"}</button>
        </div>
      </div>
    </>
  );
}
