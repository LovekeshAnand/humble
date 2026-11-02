import type { Metadata } from "next";
import Link from "next/link";
import { leanTools } from "@/lib/data";
import CategoryGrid from "../category-grid";
import Directory from "../directory";

export const metadata: Metadata = {
  title: "Search open source tools by the problem you have",
  description: "Describe what you are trying to do and get the open source tools people recommend for it.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <main className="shell pt-8 sm:pt-12">
      <div className="text-center">
        <h1 className="text-hero mx-auto max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl">
          Describe the problem,
          <br />
          get the tools
        </h1>
        <p className="mx-auto mt-6 max-w-[680px] text-lg text-fg-muted">
          Search {leanTools.length} tools by what you need done. Results are ranked by how well they fit and how many people vouch for them.
        </p>
      </div>
      <Directory tools={leanTools}>
        <section className="mt-16" aria-labelledby="browse">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="browse" className="text-2xl font-semibold tracking-tight">Browse by category</h2>
            <Link href="/categories" className="link text-sm text-fg-muted hover:text-fg">All categories</Link>
          </div>
          <div className="mt-6">
            <CategoryGrid tools={leanTools} />
          </div>
        </section>
      </Directory>
    </main>
  );
}
