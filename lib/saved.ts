// The visitor's likes, skips and interests, kept in their browser (no accounts, no backend).
import { useSyncExternalStore } from "react";

export type SavedState = { liked: string[]; skipped: string[]; picks: string[] };

const KEY = "humble:v1";
const EMPTY: SavedState = { liked: [], skipped: [], picks: [] };
const listeners = new Set<() => void>();
let cache: SavedState | null = null;

function read(): SavedState {
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    cache = v && Array.isArray(v.liked) ? { ...EMPTY, ...v } : EMPTY;
  } catch {
    cache = EMPTY; // private mode or blocked storage: works for this visit only
  }
  return cache!;
}

function write(next: SavedState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) { cache = null; fn(); } // another tab changed it
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
}

export const useSaved = () => useSyncExternalStore(subscribe, read, () => EMPTY);

const without = (list: string[], id: string) => list.filter((x) => x !== id);

export const saved = {
  like: (id: string) => { const s = read(); write({ ...s, liked: [id, ...without(s.liked, id)], skipped: without(s.skipped, id) }); },
  skip: (id: string) => { const s = read(); write({ ...s, skipped: [id, ...without(s.skipped, id)], liked: without(s.liked, id) }); },
  remove: (id: string) => { const s = read(); write({ ...s, liked: without(s.liked, id) }); },
  toggle: (id: string) => (read().liked.includes(id) ? saved.remove(id) : saved.like(id)),
  forget: (id: string) => { const s = read(); write({ ...s, liked: without(s.liked, id), skipped: without(s.skipped, id) }); },
  addMany: (ids: string[]) => { const s = read(); write({ ...s, liked: [...new Set([...ids, ...s.liked])] }); },
  setPicks: (picks: string[]) => write({ ...read(), picks }),
  resetSwipes: () => write({ ...read(), skipped: [] }),
};
