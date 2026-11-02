// Collects GitHub repos recommended on Hacker News (comments, Ask HN threads, front page), enriches via GitHub API,
// keeps only OSI-style licensed, non-archived repos, merges into data/tools.json.
// Run: node scripts/scrape.mjs   (set GITHUB_TOKEN for 5000 req/h instead of 60)
import { readFile, writeFile, mkdir } from "node:fs/promises";

const OUT = new URL("../data/tools.json", import.meta.url);
const TOKEN = process.env.GITHUB_TOKEN;
const UA = "humble-directory/1.0 (+https://github.com)";
const MAX_ENRICH = TOKEN ? 800 : 50; // GitHub API budget per run
const STALE_MS = 7 * 864e5; // re-fetch repo metadata weekly
const MIN_STARS = 20; // ponytail: crude noise filter, swap for a smarter score if junk slips through

// Reported junk: one "owner/repo" per line in data/blocklist.txt, "#" starts a comment.
const BLOCKED = new Set(
  (await readFile(new URL("../data/blocklist.txt", import.meta.url), "utf8").catch(() => ""))
    .split(/\r?\n/).map((l) => l.replace(/#.*/, "").trim().toLowerCase()).filter(Boolean),
);

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

// "an alternative to Google Photos", "switched from Notion" -> ["Google Photos", "Notion"].
// ponytail: capitalised-name regex; misses lowercase names, an NER model would catch more.
const NOT_NAMES = new Set("I The It It's This That These Those My Our Your Their His Her We You They A An Something Anything Everything Them Using Other Most Some All Any What Which There Here One Just Even When If So Then Also Both Each Many Much More Free Open Self Every".split(" "));
export function extractAlternatives(text) {
  const out = new Set();
  for (const m of text.matchAll(/\b(?:alternatives? to|replacements? for|replaced|replacing|replace|instead of|switched (?:away )?from|moved (?:away )?from|migrated (?:away )?from|ditched|got rid of)\s+([A-Z][A-Za-z0-9.+&-]*(?: [A-Z][A-Za-z0-9.+&-]*)?)/g)) {
    const [first, second] = m[1].split(" ");
    const keepSecond = second && !NOT_NAMES.has(second) && !first.endsWith("."); // "Notion. It" is a sentence break
    const name = (keepSecond ? `${first} ${second}` : first).replace(/[.]+$/, "");
    if (NOT_NAMES.has(first) || name.length < 2) continue;
    out.add(name);
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

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// Stack Exchange "Software Recommendations": a Q&A site built for exactly this. Upvoted answers only.
// Official API, no key needed (300 requests/day); set STACKEXCHANGE_KEY for 10,000.
async function stackExchange() {
  const mentions = [];
  const key = process.env.STACKEXCHANGE_KEY ? `&key=${process.env.STACKEXCHANGE_KEY}` : "";
  const pages = [["softwarerecs", "votes", 1], ["softwarerecs", "votes", 2], ["softwarerecs", "votes", 3], ["softwarerecs", "creation", 1], ["superuser", "votes", 1], ["superuser", "creation", 1]];
  for (const [site, sort, page] of pages) {
    const d = await getJSON(`https://api.stackexchange.com/2.3/answers?site=${site}&order=desc&sort=${sort}&page=${page}&filter=withbody&pagesize=100${key}`);
    for (const a of d?.items ?? []) {
      if (a.score < 1) continue;
      for (const repo of extractRepos(a.body ?? "")) mentions.push({ repo, author: `se:${a.owner?.display_name ?? a.owner?.user_id}`, source: "Stack Exchange", url: `https://${site}.stackexchange.com/a/${a.answer_id}`.replace("superuser.stackexchange.com", "superuser.com"), text: strip(a.body), date: new Date(a.creation_date * 1000).toISOString() });
    }
    if (d?.backoff) await pause(d.backoff * 1000);
  }
  console.log(`Stack Exchange: ${mentions.length} mentions`);
  return mentions;
}

// Lobsters: invite-only, HN-like. GitHub stories (a submission is an endorsement) plus comments on the hottest stories.
async function lobsters() {
  const mentions = [];
  const stories = [...((await getJSON("https://lobste.rs/hottest.json")) ?? []), ...((await getJSON("https://lobste.rs/newest.json")) ?? [])];
  for (const tag of ["show", "linux", "unix", "devops", "web", "programming"]) stories.push(...((await getJSON(`https://lobste.rs/t/${tag}.json`)) ?? []));
  for (const s of stories) for (const repo of extractRepos(s.url ?? "")) mentions.push({ repo, author: `lobsters:${s.submitter_user}`, source: "Lobsters", url: s.short_id_url, text: s.title, date: s.created_at });
  for (const s of stories.filter((x) => x.comment_count > 2).slice(0, 25)) {
    const full = await getJSON(`https://lobste.rs/s/${s.short_id}.json`);
    for (const c of full?.comments ?? []) {
      if (c.is_deleted || !RECOMMEND.test(c.comment_plain ?? "")) continue;
      for (const repo of extractRepos(c.comment ?? "")) mentions.push({ repo, author: `lobsters:${c.commenting_user}`, source: "Lobsters", url: c.short_id_url, text: c.comment_plain, date: c.created_at });
    }
    await pause(500); // small site, be gentle
  }
  console.log(`Lobsters: ${mentions.length} mentions`);
  return mentions;
}

// Lemmy: federated Reddit alternative with active self-hosting and open source communities.
const LEMMY = [["lemmy.world", "selfhosted"], ["lemmy.world", "opensource"], ["lemmy.ml", "linux"], ["lemmy.ml", "opensource"], ["programming.dev", "programming"]];
async function lemmy() {
  const mentions = [];
  for (const [host, community] of LEMMY) {
    // Newest comments for freshness, all-time top comments and posts for depth.
    for (const sort of ["New", "Top"]) { // comments take "Top"; posts take "TopAll"
      const d = await getJSON(`https://${host}/api/v3/comment/list?community_name=${community}&sort=${sort}&limit=50&type_=All`);
      for (const { comment: c, creator } of d?.comments ?? []) {
        if (c.removed || c.deleted || !RECOMMEND.test(c.content ?? "")) continue;
        for (const repo of extractRepos(c.content)) mentions.push({ repo, author: `lemmy:${creator.actor_id ?? creator.name}`, source: "Lemmy", url: c.ap_id, text: c.content.replace(/\s+/g, " "), date: c.published });
      }
    }
    const posts = await getJSON(`https://${host}/api/v3/post/list?community_name=${community}&sort=TopAll&limit=50&type_=All`);
    for (const { post: p, creator, counts } of posts?.posts ?? []) {
      if (p.removed || p.deleted || (counts?.score ?? 0) < 10) continue; // a shared repo the community upvoted
      for (const repo of extractRepos(`${p.url ?? ""} ${p.body ?? ""}`)) mentions.push({ repo, author: `lemmy:${creator.actor_id ?? creator.name}`, source: "Lemmy", url: p.ap_id, text: `${p.name}${p.body ? `: ${p.body}` : ""}`.replace(/\s+/g, " "), date: p.published });
    }
  }
  console.log(`Lemmy: ${mentions.length} mentions`);
  return mentions;
}

// Fosstodon: the Mastodon server for free and open source software. Hashtag timelines, recommendation-filtered.
async function fosstodon() {
  const mentions = [];
  for (const tag of ["opensource", "foss", "selfhosted", "selfhosting", "linux"]) {
    for (const p of (await getJSON(`https://fosstodon.org/api/v1/timelines/tag/${tag}?limit=40`)) ?? []) {
      const text = strip(p.content ?? "");
      if (!RECOMMEND.test(text) || mentions.some((m) => m.url === p.url)) continue;
      for (const repo of extractRepos(p.content)) mentions.push({ repo, author: `mastodon:${p.account?.acct}`, source: "Fosstodon", url: p.url, text, date: p.created_at });
    }
  }
  console.log(`Fosstodon: ${mentions.length} mentions`);
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

  // Each source is independent: one being down never stops the others.
  const safe = (name, fn) => fn().catch((e) => { console.warn(`${name} failed: ${e.message}`); return []; });
  const mentions = [
    ...(await safe("HN comments", hnComments)),
    ...(await safe("Ask HN", () => hnAskThreads(db))),
    ...(await safe("HN front page", hnFrontPage)),
    ...(await safe("Stack Exchange", stackExchange)),
    ...(await safe("Lobsters", lobsters)),
    ...(await safe("Lemmy", lemmy)),
    ...(await safe("Fosstodon", fosstodon)),
  ];

  for (const m of mentions) {
    const t = (db.tools[m.repo] ??= { mentions: [] });
    if (t.mentions.some((x) => x.url === m.url)) continue;
    t.mentions.push({ source: m.source, author: m.author, url: m.url, date: m.date, snippet: m.text.slice(0, 280) });
  }

  // Older mentions were stored before authors were; look them up, a few hundred per run.
  const nameless = Object.values(db.tools).filter(isListed).flatMap((t) => t.mentions.filter((m) => !m.author)).slice(0, 300);
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (let m; (m = nameless.pop()); ) {
      const id = m.url.match(/item\?id=(\d+)/)?.[1];
      const item = id && (await getJSON(`${HN}/items/${id}`));
      if (item?.author) m.author = item.author;
    }
  }));

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
    if (isListed(t)) t.listedAt ??= new Date().toISOString();
  }
  db.updatedAt = new Date().toISOString();
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await writeFile(OUT, JSON.stringify(db, null, 1));
  // Public, trimmed list the site imports.
  const people = (ms) => new Set(ms.map((m) => m.author ?? m.url)).size; // distinct people, not raw spam count
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();
  const listed = Object.values(db.tools).filter(isListed).map((t) => {
    // Only trust an "alternative to X" claim when the comment names this tool itself.
    const own = t.mentions.filter((m) => m.snippet.toLowerCase().includes(t.meta.name.toLowerCase()));
    return {
      ...t.meta,
      mentionCount: people(t.mentions),
      recentCount: people(t.mentions.filter((m) => m.date >= monthAgo)),
      sources: [...new Set(t.mentions.map((m) => m.source))],
      lastMentioned: t.mentions[0].date,
      listedAt: t.listedAt,
      alternativeTo: [...new Set(own.flatMap((m) => extractAlternatives(m.snippet)))],
      mentions: [...own, ...t.mentions.filter((m) => !own.includes(m))].slice(0, 8),
    };
  });
  await writeFile(new URL("../data/directory.json", import.meta.url), JSON.stringify({ updatedAt: db.updatedAt, tools: listed }));
  console.log(`Saved. ${Object.keys(db.tools).length} repos tracked, ${listed.length} listed.`);
}

// Same rule the site uses: real OSS license, maintained-ish, some traction.
// Lists, guides and docs aren't software. ponytail: name/description heuristic, extend the patterns as junk shows up.
export const isSoftware = (m) =>
  !/^awesome/i.test(m.name) &&
  !/curated list|awesome list|list of (awesome|resources)|blocklist/i.test(m.description ?? "") &&
  !(!m.language && /\b(guide|documentation|norms|list|rules|index)\b/i.test(m.description ?? ""));

export const isListed = (t) => t.meta && t.meta.license && !t.meta.archived && !t.meta.fork && t.meta.stars >= MIN_STARS && isSoftware(t.meta) && !BLOCKED.has(t.meta.fullName?.toLowerCase());

if (process.argv[2] === "--test") {
  const assert = (await import("node:assert")).default;
  assert.deepEqual(extractRepos('see <a href="https:&#x2F;&#x2F;github.com&#x2F;Immich-App&#x2F;immich">x</a>'), ["immich-app/immich"]);
  assert.deepEqual(extractRepos("https://github.com/foo/bar.git and github.com/orgs/x and github.com/a/b."), ["foo/bar", "a/b"]);
  assert.ok(RECOMMEND.test("I've been using Jellyfin for years"));
  assert.ok(!isListed({ meta: { license: null, stars: 999 } }));
  assert.ok(!isSoftware({ name: "awesome-shell", description: "A curated list of shell tools", language: null }));
  assert.ok(!isSoftware({ name: "YubiKey-Guide", description: "Community guide to using YubiKey", language: null }));
  assert.ok(isSoftware({ name: "immich", description: "Self-hosted photo management", language: "TypeScript" }));
  assert.ok(isSoftware({ name: "catj", description: "Displays JSON files in a flat format.", language: null }));
  assert.deepEqual(extractAlternatives("Immich is a great alternative to Google Photos. I switched from Dropbox to Syncthing"), ["Google Photos", "Dropbox"]);
  assert.deepEqual(extractAlternatives("I use it instead of The cloud, replacing Notion. It works"), ["Notion"]);
  console.log("ok");
} else await main();
