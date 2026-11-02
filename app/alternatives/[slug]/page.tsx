import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { alternatives, quoteOf } from "@/lib/data";
import ToolRow from "../../tool-row";

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
    description: `${a.tools.length} free, open source alternatives to ${a.name} that Hacker News commenters recommend: ${a.tools
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
    <main className="shell pt-10 sm:pt-14">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/alternatives" className="link">Alternatives</Link>
        <span aria-hidden="true"> / </span>
        <span>{a.name}</span>
      </nav>
      <h1 className="mt-4 text-3xl sm:text-[2.5rem]">Open source alternatives to {a.name}</h1>
      <p className="lead mt-3 text-ink-2">
        {a.tools.length} tools Hacker News commenters use instead, most recommended first.
      </p>
      <ul className="mt-8 border-t border-rule">
        {a.tools.map((t) => <ToolRow key={t.fullName} tool={t} quote={quoteOf(t, a.name)} />)}
      </ul>
    </main>
  );
}
