import type { Metadata } from "next";
import { leanTools } from "@/lib/data";
import CategoryGrid from "../category-grid";

export const metadata: Metadata = {
  title: "Browse open source tools by category",
  description: "Fourteen categories of open source tools people recommend, from AI to self hosting.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <main className="shell pt-8 sm:pt-12">
      <div className="text-center">
        <h1 className="text-hero mx-auto max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl">Browse by category</h1>
        <p className="mx-auto mt-6 max-w-[680px] text-lg text-fg-muted">Fourteen shelves of tools real people recommended.</p>
      </div>
      <div className="mt-12">
        <CategoryGrid tools={leanTools} />
      </div>
    </main>
  );
}
