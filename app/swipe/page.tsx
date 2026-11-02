import type { Metadata } from "next";
import Link from "next/link";
import { leanTools } from "@/lib/data";
import Deck from "../deck";

export const metadata: Metadata = {
  title: "Swipe through open source tools",
  description: "Swipe right to save, left to skip. The deck learns what you like and keeps the links of every tool you save.",
  alternates: { canonical: "/swipe" },
};

export default function SwipePage() {
  return (
    <main className="shell text-center">
      <h1 className="visually-hidden">Swipe through open source tools</h1>
      <Deck tools={leanTools} />
      <p className="mt-12 text-sm text-fg-muted">
        Looking for something specific? <Link href="/search" className="link hover:text-fg">Search by problem</Link> or{" "}
        <Link href="/categories" className="link hover:text-fg">browse categories</Link>.
      </p>
    </main>
  );
}
