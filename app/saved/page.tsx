import type { Metadata } from "next";
import { leanTools } from "@/lib/data";
import SavedList from "./saved-list";

export const metadata: Metadata = {
  title: "Your saved tools",
  description: "The open source tools you saved, with links to copy, download or share.",
  robots: { index: false },
};

export default function SavedPage() {
  return (
    <main className="shell pt-8 sm:pt-12">
      <div className="text-center">
        <h1 className="text-hero mx-auto max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl">Your saved tools</h1>
        <p className="mx-auto mt-6 max-w-[680px] text-lg text-fg-muted">Kept in this browser. Copy, download or share the links anywhere.</p>
      </div>
      <SavedList tools={leanTools} />
    </main>
  );
}
