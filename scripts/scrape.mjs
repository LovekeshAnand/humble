// Collects GitHub repos recommended on Hacker News (comments, Ask HN threads, front page), enriches via GitHub API,
// keeps only OSI-style licensed, non-archived repos, merges into data/tools.json.
// Run: node scripts/scrape.mjs   (set GITHUB_TOKEN for 5000 req/h instead of 60)
import { readFile, writeFile, mkdir } from "node:fs/promises";

const OUT = new URL("../data/tools.json", import.meta.url);
const TOKEN = process.env.GITHUB_TOKEN;
const UA = "hackfree-directory/1.0 (+https://github.com)";
const MAX_ENRICH = TOKEN ? 800 : 50; // GitHub API budget per run
const STALE_MS = 7 * 864e5; // re-fetch repo metadata weekly
const MIN_STARS = 20; // ponytail: crude noise filter, swap for a smarter score if junk slips through

const HN_QUERIES = ["github.com", "open source alternative", "self-hosted", "I recommend"];
// Ask HN threads where the whole thread is people recommending tools.
const ASK_QUERIES = ["self-hosted", "open source", "tools", "software", "favorite", "alternative", "underrated", "what do you use", "homelab", "cli", "app"];
const THREAD_ACTIVE_MS = 14 * 864e5; // keep re-reading a thread until it's two weeks old

// "Recommendation" signal. ponytail: keyword heuristic, upgrade to an LLM classifier if precision matters.
const RECOMMEND = /\b(recommend|i use|i've been using|been using|we use|check out|switched to|alternative|self-?host|love|great|works well|go-to|underrated|try|my favou?rite|replaced)\b/i;

const NOT_REPO_OWNERS = new Set(["orgs", "settings", "features", "sponsors", "marketplace", "topics", "about", "pricing", "collections", "trending", "apps", "login", "site", "readme", "enterprise", "issues", "pulls", "notifications", "explore", "search", "security", "customer-stories", "users", "advisories", "github", "user-attachments"]);

export function extractRepos(text) {
  const out = new Set();
  // HN encodes "/" as &#x2F; in comment HTML
  const t = text.replace(/&#x2F;/g, "/").replace(/&#x2f;/g, "/");
  for (const m of t.matchAll(/github\.com\/([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})/g)) {
    const owner = m[1].toLowerCase();
    const repo = m[2].replace(/\.git$/i, "").replace(/[.]+$/, "").toLowerCase();
    if (!repo || NOT_REPO_OWNERS.has(owner)) continue;
    out.add(`${owner}/${repo}`);
  }
  return [...out];
}

const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&#x2F;/g, "/").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

async function getJSON(url, headers = {}) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, ...headers } });
      if (r.status === 404) return null;
      if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue; }
      if (!r.ok) { console.warn(`  ${r.status} ${url}`); return null; }
      return await r.json();
    } catch (e) { console.warn(`  fetch failed ${url}: ${e.message}`); }
  }
  return null;
}

const HN = "https://hn.algolia.com/api/v1";
const hnLink = (id) => `https://news.ycombinator.com/item?id=${id}`;

// 1. Recent comments that link a repo and read like a recommendation.
async function hnComments() {
  const mentions = [];
  const pages = Number(process.env.HN_PAGES || 1); // >1 walks back in time, for backfills
  for (const q of HN_QUERIES) for (let p = 0, before = ""; p < pages; p++) {
    const d = await getJSON(`${HN}/search_by_date?tags=comment&hitsPerPage=1000&query=${encodeURIComponent(q)}${before}`);
    if (!d?.hits?.length) break;
    before = `&numericFilters=created_at_i<${d.hits.at(-1).created_at_i}`;
    for (const h of d.hits) {
      const html = h.comment_text ?? "";
      const text = strip(html);
      if (!RECOMMEND.test(text)) continue;
      for (const repo of extractRepos(html)) mentions.push({ repo, author: h.author, source: "HN comment", url: hnLink(h.objectID), text, date: h.created_at });
    }
  }
  console.log(`HN comments: ${mentions.length} mentions`);
  return mentions;
}

// 2. Every comment in popular "Ask HN" threads (all-time best + newest). The thread itself is the
//    recommendation context, so no keyword filter. Old threads are read once, then skipped.
async function hnAskThreads(db) {
  const seen = (db.hnThreads ??= {});
  const ids = new Map();
  for (const q of ASK_QUERIES) for (const mode of ["search", "search_by_date"]) {
    const d = await getJSON(`${HN}/${mode}?tags=ask_hn&hitsPerPage=50&numericFilters=num_comments>30&query=${encodeURIComponent(q)}`);
    for (const h of d?.hits ?? []) ids.set(h.objectID, h.created_at_i * 1000);
  }
  const mentions = [];
  let read = 0;
  const todo = [...ids].filter(([id, created]) => !(seen[id] && seen[id] - created > THREAD_ACTIVE_MS));
  const walk = (c) => {
    for (const repo of extractRepos(c.text ?? "")) mentions.push({ repo, author: c.author, source: "Ask HN", url: hnLink(c.id), text: strip(c.text), date: c.created_at });
    c.children?.forEach(walk);
  };
  // 8 threads at a time; first run reads hundreds, later runs only new/active ones.
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (let job; (job = todo.pop()); ) {
      const story = await getJSON(`${HN}/items/${job[0]}`);
      if (!story) continue;
      read++;
      seen[job[0]] = Date.now();
      story.children?.forEach(walk);
    }
  }));
  console.log(`Ask HN: ${read} threads read, ${mentions.length} mentions`);
  return mentions;
}

// 3. GitHub repos that reached the front page (100+ points = community endorsement).
async function hnFrontPage() {
  const mentions = [];
  const pages = Number(process.env.HN_PAGES || 1);
  for (let p = 0, before = ""; p < pages; p++) {
    const d = await getJSON(`${HN}/search_by_date?tags=story&hitsPerPage=1000&query=github.com&numericFilters=points>=100${before}`);
    if (!d?.hits?.length) break;
    before = `,created_at_i<${d.hits.at(-1).created_at_i}`;
    for (const h of d.hits) for (const repo of extractRepos(h.url ?? "")) mentions.push({ repo, author: h.author, source: "HN front page", url: hnLink(h.objectID), text: `${h.title} (${h.points} points)`, date: h.created_at });
  }
  console.log(`HN front page: ${mentions.length} mentions`);
  return mentions;
}

async function enrich(fullName) {
  const headers = { Accept: "application/vnd.github+json", ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }) };
  const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers: { "User-Agent": UA, ...headers } }).catch(() => null);
  if (res?.status === 404 || res?.status === 451) return { missing: true };
  if (!res?.ok) return null; // rate limit / transient: leave unchecked, retry next run
  const r = await res.json();
  return {
    name: r.name,
    fullName: r.full_name,
    description: r.description ?? "",
    homepage: r.homepage || null,
    stars: r.stargazers_count,
    language: r.language,
    topics: r.topics ?? [],
    license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : null,
    archived: r.archived,
    fork: r.fork,
    pushedAt: r.pushed_at,
  };
}

async function main() {
  let db = { updatedAt: null, tools: {} };
  try { db = JSON.parse(await readFile(OUT, "utf8")); } catch { /* first run */ }

  const mentions = [...(await hnComments()), ...(await hnAskThreads(db)), ...(await hnFrontPage())];

  for (const m of mentions) {
    const t = (db.tools[m.repo] ??= { mentions: [] });
    if (t.mentions.some((x) => x.url === m.url)) continue;
    t.mentions.push({ source: m.source, author: m.author, url: m.url, date: m.date, snippet: m.text.slice(0, 280) });
  }

  // GitHub redirects renamed repos; key by canonical name so mentions merge.
  const queue = Object.entries(db.tools)
    .filter(([, t]) => !t.checkedAt || Date.now() - Date.parse(t.checkedAt) > STALE_MS)
    .sort((a, b) => b[1].mentions.length - a[1].mentions.length)
    .slice(0, MAX_ENRICH);
  console.log(`Enriching ${queue.length} repos`);
  for (const [key, t] of queue) {
    const info = await enrich(key);
    if (!info) { console.warn("GitHub API limit hit, rest next run"); break; }
    t.checkedAt = new Date().toISOString();
    if (info.missing) { t.meta = null; continue; }
    const canon = info.fullName.toLowerCase();
    if (canon !== key) {
      const target = (db.tools[canon] ??= { mentions: [] });
      for (const m of t.mentions) if (!target.mentions.some((x) => x.url === m.url)) target.mentions.push(m);
      target.meta = info; target.checkedAt = t.checkedAt;
      delete db.tools[key];
    } else t.meta = info;
  }

  for (const t of Object.values(db.tools)) {
    t.mentions.sort((a, b) => b.date.localeCompare(a.date));
    t.mentions = t.mentions.slice(0, 50);
  }
  db.updatedAt = new Date().toISOString();
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await writeFile(OUT, JSON.stringify(db, null, 1));
  // Public, trimmed list the site imports.
  const listed = Object.values(db.tools).filter(isListed).map((t) => ({
    ...t.meta,
    mentionCount: new Set(t.mentions.map((m) => m.author ?? m.url)).size, // distinct people, not raw spam count
    sources: [...new Set(t.mentions.map((m) => m.source))],
    lastMentioned: t.mentions[0].date,
    mentions: t.mentions.slice(0, 5),
  }));
  await writeFile(new URL("../data/directory.json", import.meta.url), JSON.stringify({ updatedAt: db.updatedAt, tools: listed }));
  console.log(`Saved. ${Object.keys(db.tools).length} repos tracked, ${listed.length} listed.`);
}

// Same rule the site uses: real OSS license, maintained-ish, some traction.
export const isListed = (t) => t.meta && t.meta.license && !t.meta.archived && !t.meta.fork && t.meta.stars >= MIN_STARS;

if (process.argv[2] === "--test") {
  const assert = (await import("node:assert")).default;
  assert.deepEqual(extractRepos('see <a href="https:&#x2F;&#x2F;github.com&#x2F;Immich-App&#x2F;immich">x</a>'), ["immich-app/immich"]);
  assert.deepEqual(extractRepos("https://github.com/foo/bar.git and github.com/orgs/x and github.com/a/b."), ["foo/bar", "a/b"]);
  assert.ok(RECOMMEND.test("I've been using Jellyfin for years"));
  assert.ok(!isListed({ meta: { license: null, stars: 999 } }));
  console.log("ok");
} else await main();
