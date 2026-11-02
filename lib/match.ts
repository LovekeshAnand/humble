// Problem -> tools matcher. "I need a way to back up my photos without google" -> immich, ente, ...
// ponytail: keyword scoring + tiny synonym map; upgrade to embeddings if vocabulary mismatch hurts.

export type Searchable = {
  name: string;
  fullName: string;
  description: string;
  topics: string[];
  stars: number;
  mentionCount: number;
  said: string; // what commenters wrote about it
};

const STOP = new Set("a an the and or but i im i'm me my we our you your to for of in on at by with from without is are was be been being it its this that these those need want looking way some any something tool app software program good best free open source alternative alternatives replace replacement instead can could should would how what which who do does like use using just also there their so not no where when why own whole entire every thing things stuff get make help store keep find manage organise organize save view open create".split(" "));

// Common problem words -> what repos call it.
const SYN: Record<string, string[]> = {
  photo: ["image", "gallery", "picture"],
  picture: ["photo", "image"],
  video: ["media", "stream", "movie"],
  movie: ["media", "video", "stream"],
  music: ["audio", "song", "stream"],
  stream: ["media", "video", "movie", "music"],
  read: ["reader"],
  feed: ["rss", "reader"],
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

// Two-word spellings people type -> the one word repos use.
const PHRASES: [RegExp, string][] = [
  [/\bat home\b/g, " "],
  [/\bback(ing|ed)? up\b/g, "backup"],
  [/\bad ?block(er|ing)?\b|\bblock(ing)? ads\b/g, "adblock"],
  [/\bself[ -]host(ed|ing)?\b/g, "self-hosted"],
  [/\bnote[ -]taking\b/g, "notes"],
  [/\bpassword[ -]manager\b/g, "password-manager"],
  [/\be[ -]?mail\b/g, "email"],
];
// The query takes the joined form; tool text keeps both, so "password" still finds "password manager".
const normalise = (s: string, keep = false) =>
  PHRASES.reduce((acc, [re, to]) => acc.replace(re, (m) => (keep ? `${m} ${to}` : to)), s.toLowerCase());

export const terms = (s: string, keep = false) =>
  [...new Set(normalise(s, keep).split(/[^a-z0-9+#'-]+/).filter((w) => w.length > 1 && !STOP.has(w)).map(stem))];

const has = (hay: Set<string>, t: string) => hay.has(t);
const bag = (s: string) => new Set(terms(s, true));

export function rank<T extends Searchable>(tools: T[], query: string): T[] {
  const q = terms(query);
  if (!q.length) return tools;

  // Pass 1: how well each tool matches each word.
  const per = tools.map((t) => {
    const name = bag(`${t.name} ${t.fullName.replace("/", " ")}`);
    const topics = bag(t.topics.join(" ").replace(/-/g, " ") + " " + t.topics.join(" "));
    const desc = bag(t.description);
    const said = bag(t.said);
    return q.map((w) => {
      let s = 6 * +has(name, w) + 4 * +has(topics, w) + 3 * +has(desc, w) + 1 * +has(said, w);
      if (!s) for (const sw of SYNS.get(w) ?? []) s = Math.max(s, 0.6 * (4 * +has(topics, sw) + 3 * +has(desc, sw) + 1 * +has(said, sw)));
      return s;
    });
  });

  // Rare words carry the meaning ("password-manager"), common ones don't ("self-hosted").
  // A word no tool matches counts as the rarest: better an honest "no match" than filler.
  const weight = q.map((_, i) => Math.log(1 + tools.length / Math.max(1, per.filter((p) => p[i] > 0).length)));
  const total = weight.reduce((a, b) => a + b, 0);

  return tools
    .map((t, ti) => {
      const s = per[ti];
      const covered = s.reduce((a, x, i) => a + (x > 0 ? weight[i] : 0), 0) / total;
      // Must cover most of what matters, and match the tool itself, not only a word in a comment.
      if (covered < 0.6 || !s.some((x) => x > 1)) return { t, score: 0 };
      const score = s.reduce((a, x, i) => a + x * weight[i], 0) * covered;
      return { t, score: score + Math.log10(1 + t.mentionCount) + Math.log10(1 + t.stars) * 0.3 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}
