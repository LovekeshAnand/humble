import type { Metadata } from "next";
import Link from "next/link";
import { alternatives } from "@/lib/data";

export const metadata: Metadata = {
  title: "Open source alternatives people actually switched to",
  description: "Products people replaced with free, open source tools, and what they switched to.",
  alternates: { canonical: "/alternatives" },
};

export default function AlternativesIndex() {
  return (
    <main className="shell pt-8 sm:pt-12">
      <div className="text-center">
        <h1 className="text-hero mx-auto max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl">
          What people replaced,
          <br />
          and with what
        </h1>
        <p className="mx-auto mt-6 max-w-[680px] text-lg text-fg-muted">Products people swapped for an open source tool, from their own comments.</p>
      </div>
      {alternatives.length > 0 ? (
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alternatives.map((a) => (
            <li key={a.slug}>
              <Link href={`/alternatives/${a.slug}`} className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-6 transition-colors duration-300 ease-(--ease-soft) hover:border-line-strong hover:bg-raised">
                <span className="text-lg font-semibold">{a.name}</span>
                <span className="font-mono text-sm text-fg-subtle">{a.tools.length} tools</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-line bg-surface p-12 text-center">
          <p className="text-xl font-semibold">No alternatives collected yet</p>
          <p className="mt-2 text-fg-muted">A product gets a page once two tools are named as replacements for it.</p>
          <Link href="/swipe" className="btn btn-primary mt-8">Start swiping</Link>
        </div>
      )}
    </main>
  );
}
