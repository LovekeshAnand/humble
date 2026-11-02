import raw from "@/data/directory.json";
import { categoriesOf, type CategorySlug } from "./categories";

export type Mention = { source: string; author?: string; url: string; date: string; snippet: string };

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
  recentCount?: number;
  sources: string[];
  lastMentioned: string;
  listedAt?: string;
  alternativeTo?: string[];
  mentions: Mention[];
};

// What the home page ships to the browser: no full mention lists.
export type LeanTool = Omit<Tool, "mentions"> & { quote: Mention | null; said: string; categories: CategorySlug[] };

const data = raw as unknown as { updatedAt: string; tools: Tool[] };
export const updatedAt = data.updatedAt;
export const tools = data.tools;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const REPO_URL = "https://github.com/LovekeshAnand/hackfree";

export const toolPath = (t: { fullName: string }) => `/tool/${t.fullName}`;
export const findTool = (owner: string, repo: string) =>
  tools.find((t) => t.fullName.toLowerCase() === `${owner}/${repo}`.toLowerCase());

export const slugify = (s: string) => s.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The quote that names the tool itself reads best; the scraper already sorts those first.
export const quoteOf = (t: Tool, prefer?: string) =>
  (prefer && t.mentions.find((m) => m.snippet.toLowerCase().includes(prefer.toLowerCase()))) || t.mentions[0] || null;

export const toLean = (t: Tool): LeanTool => {
  const { mentions, ...rest } = t;
  return {
    ...rest,
    quote: quoteOf(t),
    said: mentions.map((m) => m.snippet).join(" ").slice(0, 600),
    categories: categoriesOf(t.topics),
  };
};

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

export const fmtCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
