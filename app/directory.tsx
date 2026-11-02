"use client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { rank } from "@/lib/match";
import { CATEGORIES } from "@/lib/categories";
import { SOURCE_NAMES, platformOf, toolPath, type LeanTool } from "@/lib/format";
import Avatar from "./avatar";
import CategoryIcon from "./category-icon";
import ToolCard from "./tool-card";

const EXAMPLES = [
  "back up my photos without Google",
  "replace Notion for my notes",
  "run a local LLM",
  "self host a git server",
  "monitor my servers",
];

const SORTS = {
  mentions: (a: LeanTool, b: LeanTool) => b.mentionCount - a.mentionCount || b.stars - a.stars,
  recent: (a: LeanTool, b: LeanTool) => b.lastMentioned.localeCompare(a.lastMentioned),
  stars: (a: LeanTool, b: LeanTool) => b.stars - a.stars,
};
type Sort = keyof typeof SORTS;
const PAGE = 24;

export default function Directory({ tools, children }: { tools: LeanTool[]; children?: React.ReactNode }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [lang, setLang] = useState("");
  const [src, setSrc] = useState("");
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
    setSrc(p.get("from") ?? "");
    const s = p.get("sort");
    if (s && s in SORTS) setSort(s as Sort);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  // "/" jumps to the search box, as on GitHub.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      e.preventDefault();
      document.getElementById("problem")?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (cat) p.set("c", cat);
    if (lang) p.set("lang", lang);
    if (src) p.set("from", src);
    if (sort !== "mentions") p.set("sort", sort);
    window.history.replaceState(null, "", p.size ? `?${p}` : window.location.pathname);
  }, [q, cat, lang, src, sort]);

  const langs = useMemo(() => [...new Set(tools.map((t) => t.language).filter(Boolean))].sort() as string[], [tools]);
  const rising = useMemo(
    () => tools.filter((t) => (t.recentCount ?? 0) >= 2).sort((a, b) => (b.recentCount ?? 0) - (a.recentCount ?? 0)).slice(0, 4),
    [tools],
  );

  const searching = query.trim().length > 0;
  const shown = useMemo(() => {
    const pool = tools
      .filter((t) => !cat || (t.categories as readonly string[]).includes(cat))
      .filter((t) => !lang || t.language === lang)
      .filter((t) => !src || t.sources.some((s) => platformOf(s) === src));
    return searching ? rank(pool, query) : [...pool].sort(SORTS[sort]);
  }, [tools, cat, lang, src, sort, query, searching]);

  const reset = (fn: () => void) => { fn(); setLimit(PAGE); };
  const catName = CATEGORIES.find((c) => c.slug === cat)?.name;

  return (
    <>
      <form role="search" className="mx-auto mt-10 max-w-3xl" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="problem" className="visually-hidden">What are you trying to do?</label>
        <div className="relative">
          <MagnifyingGlassIcon size={24} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
          <input
            id="problem"
            type="search"
            value={q}
            onChange={(e) => reset(() => setQ(e.target.value))}
            placeholder="What are you trying to do?"
            autoComplete="off"
            className="field py-4 pr-16 pl-12"
          />
          <span className="kbd absolute top-1/2 right-4 -translate-y-1/2 max-sm:hidden" aria-hidden="true">/</span>
        </div>
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="chip shrink-0" onClick={() => reset(() => setQ(ex))}>
              {ex}
            </button>
          ))}
        </div>
      </form>

      {!searching && !cat && rising.length > 0 && (
        <section className="mt-16" aria-labelledby="rising">
          <h2 id="rising" className="text-2xl font-semibold tracking-tight">Rising this month</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rising.map((t) => (
              <li key={t.fullName} className="relative flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6 transition-colors duration-300 ease-(--ease-soft) hover:border-line-strong">
                <Avatar fullName={t.fullName} />
                <Link href={toolPath(t)} className="text-lg font-semibold after:absolute after:inset-0 after:rounded-3xl after:content-['']">
                  {t.name}
                </Link>
                <p className="text-sm text-fg-muted">{t.description.length > 90 ? `${t.description.slice(0, 88).trimEnd()}…` : t.description}</p>
                <p className="mt-auto text-sm text-fg-subtle">
                  <span className="font-mono font-semibold text-save">{t.recentCount}</span> people this month
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!searching && !cat && children}

      <section className="mt-16" aria-labelledby="results">
        <h2 id="results" className="visually-hidden">Tools</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Category">
          <button type="button" className="chip shrink-0" aria-pressed={!cat} onClick={() => reset(() => setCat(""))}>
            Everything
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.slug} type="button" className="chip shrink-0" aria-pressed={cat === c.slug} onClick={() => reset(() => setCat(cat === c.slug ? "" : c.slug))}>
              <CategoryIcon slug={c.slug} size={16} />
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-fg-muted" aria-live="polite">
            <span className="font-mono font-semibold text-fg">{shown.length}</span>{" "}
            {searching ? "tools match, best match first" : catName ? `tools in ${catName}` : "tools"}
          </p>
          <div className="flex flex-wrap gap-2">
            <select value={src} onChange={(e) => reset(() => setSrc(e.target.value))} aria-label="Recommended on" className="select">
              <option value="">Any community</option>
              {SOURCE_NAMES.map((n) => <option key={n}>{n}</option>)}
            </select>
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
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {shown.slice(0, limit).map((t) => <ToolCard key={t.fullName} tool={t} quote={t.quote} />)}
          </ul>
        ) : (
          <div className="mt-6 rounded-3xl border border-line bg-surface p-12 text-center">
            <p className="text-xl font-semibold">{tools.length === 0 ? "The directory is still filling up" : "Nothing matches that yet"}</p>
            <p className="mt-2 text-fg-muted">
              {tools.length === 0 ? "New tools arrive every six hours." : "Try other words for the same problem, or clear the filters."}
            </p>
            {tools.length > 0 && (
              <button type="button" className="btn btn-secondary mt-6" onClick={() => reset(() => { setQ(""); setCat(""); setLang(""); setSrc(""); })}>
                Clear search and filters
              </button>
            )}
          </div>
        )}

        {shown.length > limit && (
          <div className="mt-8 flex justify-center">
            <button type="button" className="btn btn-secondary" onClick={() => setLimit(limit + PAGE)}>
              Show {Math.min(PAGE, shown.length - limit)} more
            </button>
          </div>
        )}
      </section>
    </>
  );
}
