"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { saved, setRemote } from "@/lib/saved";

const post = (body: { add?: string[]; remove?: string[] }) =>
  fetch("/api/saves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);

// Keeps the browser's saves and the account's saves in step.
// Sign in: upload what this browser saved, pull down everything else. While signed in: mirror every change.
// Sign out: forget the account's saves on this device, so the next person on it starts clean.
export default function AccountSync() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && userId && synced.current !== userId) {
      synced.current = userId;
      (async () => {
        const r = await fetch("/api/saves").catch(() => null);
        if (!r?.ok) return; // keep working locally; sync retries on next load
        const { ids } = (await r.json()) as { ids: string[] };
        const onServer = new Set(ids);
        const local = saved.liked();
        const upload = local.filter((id) => !onServer.has(id));
        if (upload.length) await post({ add: upload });
        saved.addMany(ids);
        setRemote((id, on) => void post(on ? { add: [id] } : { remove: [id] }));
      })();
    }
    if (!isSignedIn && synced.current) {
      synced.current = null;
      setRemote(null);
      saved.clearLiked();
    }
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
