import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { alternatives, quoteOf } from "@/lib/data";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import ToolCard from "../../tool-card";

type Props = { params: Promise<{ slug: string }> };

// Cache Components needs at least one param at build; "none" 404s.
export const generateStaticParams = () =>
  alternatives.length ? alternatives.map((a) => ({ slug: a.slug })) : [{ slug: "none" }];

const find = (slug: string) => alternatives.find((a) => a.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = find((await params).slug);
  if (!a) return {};
  return {
    title: `Open source alternatives to ${a.name}`,
    description: `${a.tools.length} free, open source alternatives to ${a.name} that people recommend: ${a.tools
      .slice(0, 4)
      .map((t) => t.name)
      .join(", ")}.`,
    alternates: { canonical: `/alternatives/${a.slug}` },
  };
}

export default async function AlternativePage({ params }: Props) {
  const a = find((await params).slug);
  if (!a) notFound();
  return (
    <main className="shell pt-8 sm:pt-12">
      <nav aria-label="Breadcrumb">
        <Link href="/alternatives" className="inline-flex items-center gap-2 text-sm text-fg-muted transition-colors duration-300 ease-(--ease-soft) hover:text-fg">
          <ArrowLeftIcon size={16} aria-hidden="true" /> All alternatives
        </Link>
      </nav>
      <div className="mt-8 text-center">
        <h1 className="text-hero mx-auto max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl">
          Open source alternatives
          <br />
          to {a.name}
        </h1>
        <p className="mx-auto mt-6 max-w-[680px] text-lg text-fg-muted">{a.tools.length} tools people switched to, most recommended first.</p>
      </div>
      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {a.tools.map((t) => <ToolCard key={t.fullName} tool={t} quote={quoteOf(t, a.name)} />)}
      </ul>
    </main>
  );
}
