import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, FlagIcon, GithubLogoIcon, GlobeIcon } from "@phosphor-icons/react/dist/ssr";
import { rank } from "@/lib/match";
import { CATEGORIES, categoriesOf } from "@/lib/categories";
import Avatar from "../../../avatar";
import CategoryIcon from "../../../category-icon";
import ExtLink from "../../../ext-link";
import { SaveButton } from "../../../save-button";
import {
  alternativesFor, authorName, cleanSnippet, findTool, fmtCount, fmtDate, githubUrl, leanTools, platformOf, reportUrl, toolPath, tools,
} from "@/lib/data";

type Props = { params: Promise<{ owner: string; repo: string }> };

export const generateStaticParams = () =>
  tools.map((t) => {
    const [owner, repo] = t.fullName.split("/");
    return { owner, repo };
  });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, repo } = await params;
  const t = findTool(owner, repo);
  if (!t) return {};
  const people = `${t.mentionCount} ${t.mentionCount === 1 ? "person" : "people"}`;
  return {
    title: `${t.name}: recommended by ${people}`,
    description: `${t.description} Recommended by ${people} on ${[...new Set(t.sources.map(platformOf))].join(", ")}. ${t.license}, ${fmtCount(t.stars)} GitHub stars.`.trim(),
    alternates: { canonical: toolPath(t) },
  };
}

export default async function ToolPage({ params }: Props) {
  const { owner, repo } = await params;
  const t = findTool(owner, repo);
  if (!t) notFound();

  const alts = alternativesFor(t);
  const cats = categoriesOf(t);
  const similar = rank(leanTools.filter((x) => x.fullName !== t.fullName), `${t.topics.join(" ")} ${t.description}`).slice(0, 4);
  // Real comments first, front page headlines after.
  const mentions = [...t.mentions].sort((a, b) => +(a.source === "HN front page") - +(b.source === "HN front page"));

  const facts = [
    { label: "Recommended by", value: String(t.mentionCount), accent: true },
    { label: "GitHub stars", value: fmtCount(t.stars) },
    { label: "Licence", value: t.license },
    { label: "Language", value: t.language ?? "Not stated" },
    { label: "Last commit", value: fmtDate(t.pushedAt) },
  ];

  return (
    <main className="shell max-w-5xl pt-8 sm:pt-12">
      <nav aria-label="Breadcrumb">
        <Link href="/search" className="inline-flex items-center gap-2 text-sm text-fg-muted transition-colors duration-300 ease-(--ease-soft) hover:text-fg">
          <ArrowLeftIcon size={16} aria-hidden="true" /> All tools
        </Link>
      </nav>

      <header className="mt-8 rounded-3xl border border-line bg-surface p-8">
        <div className="flex flex-wrap items-start gap-6">
          <Avatar fullName={t.fullName} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.name}</h1>
            <p className="mt-2 font-mono text-sm text-fg-subtle">{t.fullName}</p>
            {cats.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {cats.map((c) => (
                  <li key={c}>
                    <Link href={`/categories/${c}`} className="chip">
                      <CategoryIcon slug={c} size={16} />
                      {CATEGORIES.find((x) => x.slug === c)?.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {t.description && <p className="mt-6 max-w-[680px] text-lg text-fg-muted">{t.description}</p>}
        <div className="mt-8 flex flex-wrap gap-2">
          <ExtLink href={githubUrl(t)} className="btn btn-primary"><GithubLogoIcon size={20} aria-hidden="true" /> Open on GitHub</ExtLink>
          {t.homepage && <ExtLink href={t.homepage} className="btn btn-secondary"><GlobeIcon size={20} aria-hidden="true" /> Website</ExtLink>}
          <SaveButton id={t.fullName} name={t.name} large />
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {facts.map((f) => (
          <div key={f.label} className="rounded-3xl border border-line bg-surface p-6">
            <dt className="text-sm text-fg-subtle">{f.label}</dt>
            <dd className={`mt-2 truncate font-mono text-xl font-semibold ${f.accent ? "text-save" : ""}`}>{f.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-16" aria-labelledby="said">
        <h2 id="said" className="text-2xl font-semibold tracking-tight">What people said</h2>
        <ul className="mt-6 grid gap-4">
          {mentions.map((m) => (
            <li key={m.url}>
              <blockquote className="rounded-3xl border border-line bg-surface p-6">
                <p className="text-lg">“{cleanSnippet(m.snippet)}”</p>
                <footer className="mt-4 text-sm text-fg-subtle">
                  <ExtLink href={m.url} className="link hover:text-fg-muted">
                    {authorName(m)} on {platformOf(m.source)}, {fmtDate(m.date)}
                  </ExtLink>
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      </section>

      {alts.length > 0 && (
        <section className="mt-16" aria-labelledby="alt">
          <h2 id="alt" className="text-2xl font-semibold tracking-tight">People use it instead of</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {alts.map((a) => (
              <li key={a.slug}><Link href={`/alternatives/${a.slug}`} className="chip">{a.name}</Link></li>
            ))}
          </ul>
        </section>
      )}

      {similar.length > 0 && (
        <section className="mt-16" aria-labelledby="similar">
          <h2 id="similar" className="text-2xl font-semibold tracking-tight">Similar tools</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {similar.map((s) => (
              <li key={s.fullName}>
                <Link href={toolPath(s)} className="flex h-full items-start gap-4 rounded-3xl border border-line bg-surface p-6 transition-colors duration-300 ease-(--ease-soft) hover:border-line-strong hover:bg-raised">
                  <Avatar fullName={s.fullName} />
                  <span className="min-w-0">
                    <span className="block font-semibold">{s.name}</span>
                    <span className="mt-1 block text-sm text-fg-muted">{s.description.length > 110 ? `${s.description.slice(0, 108).trimEnd()}…` : s.description}</span>
                    <span className="mt-2 block text-sm text-fg-subtle"><span className="font-mono text-save">{s.mentionCount}</span> recommending</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-16 flex items-center gap-2 text-sm text-fg-subtle">
        <FlagIcon size={16} aria-hidden="true" />
        Not software, abandoned or listed by mistake?{" "}
        <a href={reportUrl(t.fullName)} className="link hover:text-fg-muted">Report this listing</a>
      </p>
    </main>
  );
}
