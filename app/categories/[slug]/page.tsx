import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, HandSwipeRightIcon } from "@phosphor-icons/react/dist/ssr";
import { CATEGORIES, findCategory } from "@/lib/categories";
import { leanTools } from "@/lib/data";
import CategoryIcon from "../../category-icon";
import ToolCard from "../../tool-card";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => CATEGORIES.map((c) => ({ slug: c.slug }));

const inCategory = (slug: string) =>
  leanTools
    .filter((t) => (t.categories as readonly string[]).includes(slug))
    .sort((a, b) => b.mentionCount - a.mentionCount || b.stars - a.stars);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = findCategory((await params).slug);
  if (!c) return {};
  return {
    title: `Best open source ${c.name.toLowerCase()} tools, as people recommend them`,
    description: `${c.blurb} ${inCategory(c.slug).length} tools, ranked by how many people recommend them.`,
    alternates: { canonical: `/categories/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const c = findCategory((await params).slug);
  if (!c) notFound();
  const list = inCategory(c.slug);
  return (
    <main className="shell pt-8 sm:pt-12">
      <nav aria-label="Breadcrumb">
        <Link href="/categories" className="inline-flex items-center gap-2 text-sm text-fg-muted transition-colors duration-300 ease-(--ease-soft) hover:text-fg">
          <ArrowLeftIcon size={16} aria-hidden="true" /> All categories
        </Link>
      </nav>
      <header className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl bg-raised text-save">
            <CategoryIcon slug={c.slug} size={32} />
          </span>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{c.name}</h1>
            <p className="mt-1 text-fg-muted">{c.blurb}</p>
          </div>
        </div>
        <Link href="/swipe" className="btn btn-secondary">
          <HandSwipeRightIcon size={20} aria-hidden="true" /> Swipe instead
        </Link>
      </header>
      <p className="mt-12 text-sm text-fg-muted">
        <span className="font-mono font-semibold text-fg">{list.length}</span> tools, most recommended first
      </p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((t) => <ToolCard key={t.fullName} tool={t} quote={t.quote} />)}
      </ul>
    </main>
  );
}
