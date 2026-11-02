// Picks the next card to swipe. Content-based: every like or skip shifts weights on the
// tool's categories, topics and language; the next card is the unseen tool that scores best,
// with a little randomness so the deck doesn't collapse into one niche.
// ponytail: hand-tuned weights, no collaborative filtering (needs accounts and a backend).

export type Swipeable = {
  fullName: string;
  categories: readonly string[];
  topics: string[];
  language: string | null;
  mentionCount: number;
  stars: number;
  recentCount?: number;
};

const features = (t: Swipeable) => [
  ...t.categories.map((c) => `c:${c}`),
  ...t.topics.slice(0, 8).map((x) => `t:${x}`),
  ...(t.language ? [`l:${t.language}`] : []),
];

const GAIN = { like: { c: 1, t: 0.5, l: 0.4 }, skip: { c: -0.35, t: -0.2, l: -0.15 } } as const;

export function buildProfile(byId: Map<string, Swipeable>, liked: string[], skipped: string[], picks: string[]) {
  const w = new Map<string, number>();
  const add = (k: string, v: number) => w.set(k, (w.get(k) ?? 0) + v);
  for (const p of picks) add(`c:${p}`, 2);
  for (const [ids, gain] of [[liked, GAIN.like], [skipped, GAIN.skip]] as const)
    for (const id of ids) {
      const t = byId.get(id);
      if (t) for (const f of features(t)) add(f, gain[f[0] as "c" | "t" | "l"]);
    }
  return w;
}

// How much the community vouches for it, independent of taste.
export const prior = (t: Swipeable) =>
  Math.log10(1 + t.mentionCount) * 0.8 + Math.log10(1 + t.stars) * 0.2 + Math.min(t.recentCount ?? 0, 5) * 0.06;

export const affinity = (t: Swipeable, w: Map<string, number>) =>
  features(t).reduce((sum, f) => sum + (w.get(f) ?? 0) * (f[0] === "t" ? 0.6 : 1), 0);

// The category doing the most work for this card, to show "because you liked X".
export function reasonFor(t: Swipeable, w: Map<string, number>) {
  const best = t.categories.map((c) => [c, w.get(`c:${c}`) ?? 0] as const).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 0.75 ? best[0] : null;
}

// Small seeded RNG so the same swipe history always deals the same next card (undo brings it back).
export const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};

export function nextCard<T extends Swipeable>(
  tools: T[],
  state: { liked: string[]; skipped: string[]; picks: string[] },
  rand: () => number = Math.random,
): T | null {
  const seen = new Set([...state.liked, ...state.skipped]);
  const pool = tools.filter((t) => !seen.has(t.fullName));
  if (!pool.length) return null;
  const byId = new Map(tools.map((t) => [t.fullName, t] as const));
  const w = buildProfile(byId, state.liked, state.skipped, state.picks);
  const score = (t: T) => affinity(t, w) + prior(t);
  const ranked = [...pool].sort((a, b) => score(b) - score(a));
  // Explore 15% of the time: a well-loved tool from anywhere in the top 40.
  if (rand() < 0.15) {
    const wide = [...pool].sort((a, b) => prior(b) - prior(a)).slice(0, 40);
    return wide[Math.floor(rand() * wide.length)];
  }
  return ranked[0];
}
