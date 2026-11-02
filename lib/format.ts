// Types and pure helpers. No data import here: client components use this file,
// and anything importing data/directory.json would ship megabytes of JSON to the browser.
import type { CategorySlug } from "./categories";

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

// What pages ship to the browser: one quote instead of every mention.
export type LeanTool = Omit<Tool, "mentions"> & { quote: Mention | null; said: string; categories: CategorySlug[] };

// humble is open source.
export const REPO_URL = "https://github.com/LovekeshAnand/humble";

export const CONTACT = {
  name: "Lovekesh Anand",
  email: "lovekeshanand6@gmail.com",
  x: "https://x.com/LovekeshAnand07",
  linkedin: "https://www.linkedin.com/in/lovekesh-anand-443138318/",
};

// Suggestions and reports are pre-filled emails, so people without a GitHub account can send them too.
const issue = (subject: string, body: string) =>
  `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
export const SUGGEST_URL = issue(
  "Suggest a tool: ",
  "GitHub link:\n\nWhat problem it solves:\n\nA comment or answer recommending it (optional):\n",
);
export const reportUrl = (fullName: string) =>
  issue(`Report listing: ${fullName}`, `https://github.com/${fullName}\n\nWhat's wrong (not software, abandoned, spam, wrong licence...):\n`);

export const toolPath = (t: { fullName: string }) => `/tool/${t.fullName}`;
export const githubUrl = (t: { fullName: string }) => `https://github.com/${t.fullName}`;

export const slugify = (s: string) => s.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The community a mention came from, for "someone on Lobsters".
export const platformOf = (source: string) =>
  source.startsWith("HN") || source === "Ask HN" || source === "hackernews" ? "Hacker News" : source;

export const SOURCE_NAMES = ["Hacker News", "Stack Exchange", "Lobsters", "Lemmy", "Fosstodon"];

// Quotes are shown as prose: drop footnote links like "[0]: https://..." and bare URLs.
export const cleanSnippet = (s: string) => {
  const cut = s.length >= 280;
  const text = s
    .replace(/\[\d+\]:?\s*https?:\/\/\S+/g, "")
    .replace(/https?:\/\/[^\s)]+/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([.,;:!?)])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cut ? `${text}…` : text;
};

// Authors from non-HN sources are stored as "lobsters:name"; show just the name.
export const authorName = (m: Mention) => (m.author ? m.author.replace(/^[a-z]+:/, "").replace(/^https?:\/\/[^/]+\/u\//, "") : "Someone");

export const fmtCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
