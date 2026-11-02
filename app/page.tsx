import Link from "next/link";
import { ArrowRightIcon, BookmarkSimpleIcon, ExportIcon, HandSwipeRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { leanTools, platformOf, SOURCE_NAMES } from "@/lib/data";
import { CardFace } from "./deck";
import TaglineReveal from "./tagline-reveal";

const STEPS = [
  { icon: HandSwipeRightIcon, title: "Swipe", body: "Right saves a tool, left skips it. Arrow keys work too. Every card shows who recommended it and what they said." },
  { icon: BookmarkSimpleIcon, title: "The deck learns", body: "Each save and skip tunes the next cards toward what you like. Pick interests up front to get there faster." },
  { icon: ExportIcon, title: "Take the links", body: "Saved tools keep their GitHub and website links. Copy them, download a Markdown list or share the whole set." },
];

const FAQ = [
  { q: "Where do the tools come from?", a: "From public discussions on Hacker News, Stack Exchange Software Recommendations, Lobsters, Lemmy and Fosstodon. A scraper reads them through each site's official API every six hours and keeps comments that recommend a GitHub project." },
  { q: "Is everything really free and open source?", a: "Every listed project has an open source licence on GitHub, is not archived and has at least 20 stars. Lists, guides and docs are filtered out." },
  { q: "What does \"recommended by\" count?", a: "Distinct people. If one person mentions a tool ten times, it counts once, so self promotion cannot push a tool up." },
  { q: "Do I need an account?", a: "No. Without an account, your saves stay in this browser. Sign in (email, Google or GitHub through Clerk) and they sync to every device you use." },
  { q: "How does the deck pick the next card?", a: "It scores every tool you have not seen by the categories, topics and language of tools you saved or skipped, plus how many people vouch for it. Now and then it shows a well loved tool from outside your taste." },
  { q: "Something is listed that should not be. What now?", a: "Open the tool's page and use Report this listing. Reported projects go on a blocklist and drop out on the next update." },
];

export default function Home() {
  const perSource = SOURCE_NAMES.map((name) => ({
    name,
    count: leanTools.filter((t) => t.sources.some((s) => platformOf(s) === name)).length,
  }));
  // The three most recommended tools, fanned out as a preview of the deck.
  const preview = [...leanTools].sort((a, b) => b.mentionCount - a.mentionCount).slice(0, 3);

  return (
    <main>
      <section className="shell grid items-center gap-16 pt-8 sm:pt-16 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <h1 className="text-hero mx-auto max-w-[680px] text-5xl font-semibold tracking-tight sm:text-6xl lg:mx-0">
            Swipe right on
            <br />
            your next tool
          </h1>
          <p className="mx-auto mt-6 max-w-[680px] text-lg text-fg-muted lg:mx-0">
            humble deals you open source tools that developers recommend in public, one card at a time. Save what you
            like, skip what you don&apos;t, keep every link.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link href="/swipe" className="btn btn-primary">
              Start swiping <ArrowRightIcon size={20} aria-hidden="true" />
            </Link>
            <Link href="/search" className="btn btn-secondary">
              <MagnifyingGlassIcon size={20} aria-hidden="true" /> Search by problem
            </Link>
          </div>
          <p className="mt-8 text-sm text-fg-subtle">
            <span className="font-mono text-fg">{leanTools.length}</span> tools from Hacker News, Stack Exchange, Lobsters, Lemmy and Fosstodon. No account needed.
          </p>
        </div>

        <Link href="/swipe" aria-label="Open the swipe deck" className="group relative mx-auto block h-[32rem] w-full max-w-md">
          {preview.map((t, i) => (
            <div
              key={t.fullName}
              inert
              aria-hidden="true"
              className="deck-card text-left transition-transform duration-500 ease-(--ease-soft)"
              style={{
                zIndex: 3 - i,
                transform: i === 0 ? "rotate(-3deg)" : `translate(${i * 28}px, ${i * 16}px) rotate(${i * 5}deg) scale(${1 - i * 0.05})`,
                opacity: 1 - i * 0.25,
              }}
            >
              <CardFace tool={t} isTop={false} links={false} />
            </div>
          ))}
          <span className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-save px-4 py-2 text-sm font-semibold text-save-ink transition-transform duration-300 ease-(--ease-soft) group-hover:-translate-y-1">
            Tap to start
          </span>
        </Link>
      </section>

      <section className="shell mt-32 py-24 text-center" aria-label="Why humble">
        <TaglineReveal lines={["Every card is a tool", "someone vouched for in public,", "with their words attached."]} />
      </section>

      <section className="shell text-center" aria-labelledby="how">
        <h2 id="how" className="text-3xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-12 grid gap-4 text-left sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-3xl border border-line bg-surface p-8">
              <div className="flex items-center justify-between">
                <s.icon size={28} className="text-save" aria-hidden="true" />
                <span className="font-mono text-sm text-fg-subtle">0{i + 1}</span>
              </div>
              <h3 className="mt-8 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-fg-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="shell mt-24 text-center" aria-labelledby="sources">
        <h2 id="sources" className="text-3xl font-semibold tracking-tight">Where the recommendations come from</h2>
        <p className="mx-auto mt-4 max-w-[680px] text-fg-muted">Communities where people answer &ldquo;what should I use?&rdquo; honestly.</p>
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {perSource.map((s) => (
            <li key={s.name} className="rounded-3xl border border-line bg-surface p-6">
              <p className="font-mono text-3xl font-semibold">{s.count}</p>
              <p className="mt-2 text-sm text-fg-muted">tools from {s.name}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="shell mt-24 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq" className="text-center text-3xl font-semibold tracking-tight">Questions</h2>
        <div className="mt-12 flex flex-col gap-2">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-surface px-6 py-4 open:bg-raised">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span aria-hidden="true" className="text-xl text-fg-subtle transition-transform duration-300 ease-(--ease-soft) group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-fg-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="shell mt-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Your next favourite tool is a swipe away</h2>
        <Link href="/swipe" className="btn btn-primary mt-8">
          Start swiping <ArrowRightIcon size={20} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
