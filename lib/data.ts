// Server-only: imports the full dataset. Client components import from ./format instead.
import raw from "@/data/directory.json";
import { categoriesOf } from "./categories";
import { slugify, type LeanTool, type Mention, type Tool } from "./format";

export * from "./format";

const data = raw as unknown as { updatedAt: string; tools: Tool[] };
export const updatedAt = data.updatedAt;
export const tools = data.tools;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const findTool = (owner: string, repo: string) =>
  tools.find((t) => t.fullName.toLowerCase() === `${owner}/${repo}`.toLowerCase());

// Comments read better than front-page headlines, and ones naming the tool (or the product it replaces) best.
export const quoteOf = (t: Tool, prefer?: string) => {
  const comments = t.mentions.filter((m) => m.source !== "HN front page");
  const names = (m: Mention, w: string) => m.snippet.toLowerCase().includes(w.toLowerCase());
  return (
    (prefer && comments.find((m) => names(m, prefer))) ||
    comments.find((m) => names(m, t.name)) ||
    comments[0] ||
    t.mentions[0] ||
    null
  );
};

export const toLean = (t: Tool): LeanTool => {
  const { mentions, ...rest } = t;
  return {
    ...rest,
    quote: quoteOf(t),
    said: mentions.map((m) => m.snippet).join(" ").slice(0, 600),
    categories: categoriesOf(t),
  };
};

export const leanTools = tools.map(toLean);

export type Alternative = { slug: string; name: string; tools: Tool[] };

// "Alternative to X" pages exist once two or more tools are named as one; a single claim is too often noise.
export const alternatives: Alternative[] = (() => {
  const bySlug = new Map<string, { names: Map<string, number>; tools: Tool[] }>();
  for (const t of tools)
    for (const name of t.alternativeTo ?? []) {
      const slug = slugify(name);
      if (!slug) continue;
      const e = bySlug.get(slug) ?? { names: new Map<string, number>(), tools: [] as Tool[] };
      e.names.set(name, (e.names.get(name) ?? 0) + 1);
      if (!e.tools.includes(t)) e.tools.push(t);
      bySlug.set(slug, e);
    }
  return [...bySlug]
    .filter(([, e]) => e.tools.length >= 2)
    .map(([slug, e]) => ({
      slug,
      name: [...e.names].sort((a, b) => b[1] - a[1])[0][0],
      tools: e.tools.sort((a, b) => b.mentionCount - a.mentionCount || b.stars - a.stars),
    }))
    .sort((a, b) => b.tools.length - a.tools.length || a.name.localeCompare(b.name));
})();

export const alternativesFor = (t: Tool) => alternatives.filter((a) => a.tools.includes(t));
