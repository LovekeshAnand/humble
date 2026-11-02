import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import type { LeanTool } from "@/lib/format";
import CategoryIcon from "./category-icon";

// Every category as a door: icon, name, what's inside, how many tools.
export default function CategoryGrid({ tools }: { tools: LeanTool[] }) {
  const count = (slug: string) => tools.filter((t) => (t.categories as readonly string[]).includes(slug)).length;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map((c) => (
        <li key={c.slug}>
          <Link
            href={`/categories/${c.slug}`}
            className="group flex h-full flex-col gap-4 rounded-3xl border border-line bg-surface p-6 transition-colors duration-300 ease-(--ease-soft) hover:border-line-strong hover:bg-raised"
          >
            <span className="flex items-center justify-between">
              <span className="grid size-12 place-items-center rounded-2xl bg-raised text-save transition-colors duration-300 ease-(--ease-soft) group-hover:bg-hover">
                <CategoryIcon slug={c.slug} size={24} />
              </span>
              <span className="font-mono text-sm text-fg-subtle">{count(c.slug)} tools</span>
            </span>
            <span>
              <span className="block text-lg font-semibold">{c.name}</span>
              <span className="mt-1 block text-sm text-fg-muted">{c.blurb}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
