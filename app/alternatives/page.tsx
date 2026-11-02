import type { Metadata } from "next";
import Link from "next/link";
import { alternatives } from "@/lib/data";

export const metadata: Metadata = {
  title: "Open source alternatives, as recommended on Hacker News",
  description: "Products Hacker News commenters replaced with free, open source tools, and what they switched to.",
  alternates: { canonical: "/alternatives" },
};

export default function AlternativesIndex() {
  return (
    <main className="shell pt-12 sm:pt-16">
      <h1 className="text-3xl sm:text-[2.5rem]">What people replaced, and with what</h1>
      <p className="lead mt-3 text-ink-2">
        Products Hacker News commenters swapped for an open source tool.
      </p>
      {alternatives.length > 0 ? (
        <ul className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {alternatives.map((a) => (
            <li key={a.slug} className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
              <Link href={`/alternatives/${a.slug}`} className="link font-display font-medium">
                {a.name}
              </Link>
              <span className="text-sm text-muted">
                <span className="num">{a.tools.length}</span> tools
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-16">
          <p className="font-display text-lg font-medium">No alternatives collected yet.</p>
          <p className="mt-2 text-ink-2">A product gets a page once two tools are named as replacements for it.</p>
          <Link href="/" className="key mt-5">Browse the directory</Link>
        </div>
      )}
    </main>
  );
}
