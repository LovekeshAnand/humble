// Problem -> tools matcher. "I need a way to back up my photos without google" -> immich, ente, ...
// ponytail: keyword scoring + tiny synonym map; upgrade to embeddings if vocabulary mismatch hurts.

export type Searchable = {
  name: string;
  fullName: string;
  description: string;
  topics: string[];
  stars: number;
  mentionCount: number;
  mentions: { snippet: string }[];
};

const STOP = new Set("a an the and or but i im i'm me my we our you your to for of in on at by with from without is are was be been being it its this that these those need want looking way some any something tool app software program good best free open source alternative alternatives replace replacement instead can could should would how what which who do does like use using just also there their so not no".split(" "));

// Common problem words -> what repos call it.
const SYN: Record<string, string[]> = {
  photo: ["image", "gallery", "picture"],
  picture: ["photo", "image"],
  video: ["media", "stream", "movie"],
  movie: ["media", "video", "stream"],
  music: ["audio", "song", "stream"],
  password: ["vault", "secret", "credential"],
  note: ["markdown", "wiki", "knowledge"],
  backup: ["sync", "snapshot", "restore"],
  sync: ["backup", "file"],
  chat: ["messaging", "messenger"],
  email: ["mail", "smtp", "imap"],
  ad: ["adblock", "dns", "blocker"],
  vpn: ["wireguard", "tunnel", "network"],
  monitor: ["monitoring", "uptime", "metric"],
  analytic: ["analytics", "tracking", "metric"],
  pdf: ["document"],
  todo: ["task", "project"],
  budget: ["finance", "money", "expense"],
  money: ["finance", "budget"],
  recipe: ["cooking", "meal"],
  ebook: ["book", "reader", "epub"],
  book: ["ebook", "epub"],
  terminal: ["cli", "shell", "command"],
  diagram: ["drawing", "whiteboard"],
  google: ["self-hosted", "privacy"],
  self: ["self-hosted", "selfhosted"],
  host: ["self-hosted", "selfhosted", "server"],
};

// ponytail: crude suffix stripping, not a real stemmer.
export const stem = (w: string) =>
  (w.length < 4 ? w : w.replace(/'s$/, "").replace(/ies$/, "y").replace(/(ing|ed|s)$/, "").replace(/e$/, "")) || w;

const SYNS = new Map(Object.entries(SYN).map(([k, v]) => [stem(k), v.map(stem)]));

export const terms = (s: string) =>
  [...new Set(s.toLowerCase().split(/[^a-z0-9+#'-]+/).filter((w) => w.length > 1 && !STOP.has(w)).map(stem))];

const has = (hay: Set<string>, t: string) => hay.has(t);
const bag = (s: string) => new Set(terms(s));

export function rank<T extends Searchable>(tools: T[], query: string): T[] {
  const q = terms(query);
  if (!q.length) return tools;
  const scored = tools.map((t) => {
    const name = bag(`${t.name} ${t.fullName.replace("/", " ")}`);
    const topics = bag(t.topics.join(" ").replace(/-/g, " ") + " " + t.topics.join(" "));
    const desc = bag(t.description);
    const said = bag(t.mentions.map((m) => m.snippet).join(" "));
    let score = 0, hits = 0;
    for (const w of q) {
      let s = 6 * +has(name, w) + 4 * +has(topics, w) + 3 * +has(desc, w) + 1 * +has(said, w);
      if (!s) for (const sw of SYNS.get(w) ?? []) { s = Math.max(s, 0.6 * (4 * +has(topics, sw) + 3 * +has(desc, sw) + 1 * +has(said, sw))); }
      if (s) hits++;
      score += s;
    }
    // Reward covering more of the problem, then community trust as a gentle tiebreak.
    score *= hits / q.length;
    if (score) score += Math.log10(1 + t.mentionCount) + Math.log10(1 + t.stars) * 0.3;
    return { t, score };
  });
  return scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.t);
}
