"use client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { rank } from "@/lib/match";
import { CATEGORIES } from "@/lib/categories";
import type { LeanTool } from "@/lib/data";
import ToolRow from "./tool-row";

const EXAMPLES = [
  "back up my photos without Google",
  "block ads on my whole network",
  "replace Notion for my notes",
  "self-host my own password manager",
  "stream my movies at home",
];

const SORTS = {
  mentions: (a: LeanTool, b: LeanTool) => b.mentionCount - a.mentionCount || b.stars - a.stars,
  recent: (a: LeanTool, b: LeanTool) => b.lastMentioned.localeCompare(a.lastMentioned),
  stars: (a: LeanTool, b: LeanTool) => b.stars - a.stars,
};
type Sort = keyof typeof SORTS;
const PAGE = 40;

export default function Directory({ tools }: { tools: LeanTool[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [lang, setLang] = useState("");
  const [sort, setSort] = useState<Sort>("mentions");
  const [limit, setLimit] = useState(PAGE);
  const query = useDeferredValue(q);

  // State lives in the URL so a search can be shared. Read once on load, write on change.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from the URL */
    setQ(p.get("q") ?? "");
    setCat(p.get("c") ?? "");
    setLang(p.get("lang") ?? "");
    const s = p.get("sort");
    if (s && s in SORTS) setSort(s as Sort);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (cat) p.set("c", cat);
    if (lang) p.set("lang", lang);
    if (sort !== "mentions") p.set("sort", sort);
    window.history.replaceState(null, "", p.size ? `?${p}` : window.location.pathname);
  }, [q, cat, lang, sort]);

  const langs = useMemo(() => [...new Set(tools.map((t) => t.language).filter(Boolean))].sort() as string[], [tools]);
  const rising = useMemo(
    () => tools.filter((t) => (t.recentCount ?? 0) >= 2).sort((a, b) => (b.recentCount ?? 0) - (a.recentCount ?? 0)).slice(0, 4),
    [tools],
  );

  const searching = query.trim().length > 0;
  const shown = useMemo(() => {
    const pool = tools
      .filter((t) => !cat || (t.categories as string[]).includes(cat))
      .filter((t) => !lang || t.language === lang);
    return searching ? rank(pool, query) : [...pool].sort(SORTS[sort]);
  }, [tools, cat, lang, sort, query, searching]);

  const reset = (fn: () => void) => { fn(); setLimit(PAGE); };
  const catName = CATEGORIES.find((c) => c.slug === cat)?.name;

  return (
    <>
      <form role="search" className="mt-8" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="problem" className="label">What are you trying to do?</label>
        <input
          id="problem"
          type="search"
          value={q}
          onChange={(e) => reset(() => setQ(e.target.value))}
          placeholder="e.g. back up my photos without Google"
          autoComplete="off"
          className="field mt-2"
        />
      </form>
      <div className="-mx-(--gutter) mt-3 flex items-center gap-2 overflow-x-auto px-(--gutter) pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        <span className="label shrink-0">Try</span>
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="key key--sm shrink-0" onClick={() => reset(() => setQ(ex))}>
            {ex}
          </button>
        ))}
      </div>

      {!searching && !cat && rising.length > 0 && (
        <section className="mt-14" aria-labelledby="rising">
          <h2 id="rising" className="text-xl">Rising this month</h2>
          <ol className="mt-4 grid gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {rising.map((t) => (
              <li key={t.fullName} className="flex min-w-0 flex-col bg-paper p-5">
                <Link href={`/tool/${t.fullName}`} className="link font-display font-medium break-words">{t.name}</Link>
                <p className="mt-1 text-sm text-ink-2">{t.description.length > 80 ? `${t.description.slice(0, 78).trimEnd()}…` : t.description}</p>
                <p className="mt-auto flex items-baseline gap-2 pt-4 text-sm">
                  <span className="figure text-xl">{t.recentCount}</span>{" "}
                  <span className="text-muted">people in the last 30 days</span>
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-14" aria-labelledby="results">
        <h2 id="results" className="visually-hidden">Tools</h2>
        <div className="tray max-sm:flex-nowrap max-sm:overflow-x-auto" role="group" aria-label="Category">
          <button type="button" className="key key--sm" aria-pressed={!cat} onClick={() => reset(() => setCat(""))}>
            Everything
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              className="key key--sm"
              aria-pressed={cat === c.slug}
              onClick={() => reset(() => setCat(cat === c.slug ? "" : c.slug))}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="num font-medium text-ink">{shown.length}</span>{" "}
            {searching ? "tools match, best match first" : catName ? `tools in ${catName}` : "tools"}
          </p>
          <div className="flex flex-wrap gap-2">
            <select value={lang} onChange={(e) => reset(() => setLang(e.target.value))} aria-label="Language" className="select">
              <option value="">Any language</option>
              {langs.map((l) => <option key={l}>{l}</option>)}
            </select>
            {!searching && (
              <select value={sort} onChange={(e) => reset(() => setSort(e.target.value as Sort))} aria-label="Sort" className="select">
                <option value="mentions">Most recommended</option>
                <option value="recent">Recently mentioned</option>
                <option value="stars">Most stars</option>
              </select>
            )}
          </div>
        </div>

        {shown.length > 0 ? (
          <ul>
            {shown.slice(0, limit).map((t) => <ToolRow key={t.fullName} tool={t} quote={t.quote} />)}
          </ul>
        ) : (
          <div className="py-16">
            <p className="font-display text-lg font-medium">
              {tools.length === 0 ? "The directory is still filling up." : "Nothing matches that yet."}
            </p>
            <p className="mt-2 text-ink-2">
              {tools.length === 0
                ? "The scraper adds new tools every six hours."
                : "Try other words for the same problem, or clear the filters."}
            </p>
            {tools.length > 0 && (
              <button type="button" className="key mt-5" onClick={() => reset(() => { setQ(""); setCat(""); setLang(""); })}>
                Clear search and filters
              </button>
            )}
          </div>
        )}

        {shown.length > limit && (
          <div className="mt-8 flex justify-center">
            <button type="button" className="key" onClick={() => setLimit(limit + PAGE)}>
              Show {Math.min(PAGE, shown.length - limit)} more
            </button>
          </div>
        )}
      </section>
    </>
  );
}
