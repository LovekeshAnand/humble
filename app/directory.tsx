"use client";
import { useMemo, useState } from "react";
import { rank } from "@/lib/match";

export type Tool = {
  name: string;
  fullName: string;
  description: string;
  homepage: string | null;
  stars: number;
  language: string | null;
  topics: string[];
  license: string;
  pushedAt: string;
  mentionCount: number;
  sources: string[];
  lastMentioned: string;
  mentions: { source: string; author?: string; url: string; date: string; snippet: string }[];
};

const SORTS = {
  mentions: (a: Tool, b: Tool) => b.mentionCount - a.mentionCount || b.stars - a.stars,
  recent: (a: Tool, b: Tool) => b.lastMentioned.localeCompare(a.lastMentioned),
  stars: (a: Tool, b: Tool) => b.stars - a.stars,
};

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export default function Directory({ tools }: { tools: Tool[] }) {
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("");
  const [src, setSrc] = useState("");
  const [sort, setSort] = useState<keyof typeof SORTS>("mentions");

  const langs = useMemo(() => [...new Set(tools.map((t) => t.language).filter(Boolean))].sort() as string[], [tools]);
  const srcs = useMemo(() => [...new Set(tools.flatMap((t) => t.sources))].sort(), [tools]);

  const shown = useMemo(() => {
    const pool = tools
      .filter((t) => !lang || t.language === lang)
      .filter((t) => !src || t.sources.includes(src));
    return q.trim() ? rank(pool, q) : pool.sort(SORTS[sort]);
  }, [tools, q, lang, src, sort]);

  const select = "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20";

  return (
    <>
      <label htmlFor="problem" className="text-sm font-medium">What are you trying to do?</label>
      <input
        id="problem"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="e.g. back up my photos without Google, block ads on my whole network…"
        className="mt-2 w-full rounded-lg border border-black/15 bg-transparent px-4 py-3 text-base dark:border-white/20"
      />
      <div className="sticky top-0 z-10 -mx-4 mt-2 flex flex-wrap gap-2 bg-background/90 px-4 py-3 backdrop-blur">
        <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language" className={select}>
          <option value="">All languages</option>
          {langs.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Source" className={select}>
          <option value="">All of HN</option>
          {srcs.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} aria-label="Sort" className={select} disabled={!!q.trim()} title={q.trim() ? "Sorted by best match" : undefined}>
          <option value="mentions">Most recommended</option>
          <option value="recent">Recently mentioned</option>
          <option value="stars">Most stars</option>
        </select>
      </div>

      <p className="mt-2 text-sm opacity-60">{shown.length} {q.trim() ? "matching tools, best match first" : "tools"}</p>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {shown.map((t) => (
          <li key={t.fullName} className="flex flex-col rounded-lg border border-black/10 p-4 dark:border-white/15">
            <div className="flex items-baseline justify-between gap-3">
              <a href={t.homepage || `https://github.com/${t.fullName}`} target="_blank" rel="noopener noreferrer" className="truncate font-semibold hover:underline">
                {t.name}
              </a>
              <span className="shrink-0 text-xs opacity-60" title="Distinct people recommending it">
                {t.mentionCount} {t.mentionCount === 1 ? "rec" : "recs"} · ★ {fmt(t.stars)}
              </span>
            </div>
            <a href={`https://github.com/${t.fullName}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs opacity-50 hover:underline">
              {t.fullName}
            </a>
            <p className="mt-2 flex-1 text-sm opacity-80">{t.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              {[t.license, t.language].filter(Boolean).map((x) => (
                <span key={x} className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">{x}</span>
              ))}
              {t.sources.map((s) => (
                <span key={s} className="rounded bg-orange-500/10 px-1.5 py-0.5 text-orange-700 dark:text-orange-300">{s}</span>
              ))}
            </div>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer opacity-60">What people said</summary>
              <ul className="mt-2 space-y-2">
                {t.mentions.map((m) => (
                  <li key={m.url} className="border-l-2 border-black/10 pl-3 dark:border-white/15">
                    <p className="opacity-80">“{m.snippet}{m.snippet.length >= 280 ? "…" : ""}”</p>
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 hover:underline">
                      {m.author ? `${m.author} · ` : ""}{m.source} · {m.date.slice(0, 10)}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="mt-10 text-center opacity-60">No tool matches that yet. Try other words; the directory grows every 6 hours.</p>}
    </>
  );
}
