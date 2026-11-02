import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { rank } from "@/lib/match";
import { alternativesFor, findTool, fmtCount, fmtDate, toLean, toolPath, tools } from "@/lib/data";

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
    title: `${t.name}: recommended on Hacker News`,
    description: `${t.description} Recommended by ${people} on Hacker News. ${t.license}, ${fmtCount(t.stars)} GitHub stars.`.trim(),
    alternates: { canonical: toolPath(t) },
  };
}

export default async function ToolPage({ params }: Props) {
  const { owner, repo } = await params;
  const t = findTool(owner, repo);
  if (!t) notFound();

  const alts = alternativesFor(t);
  const similar = rank(
    tools.filter((x) => x !== t).map(toLean),
    `${t.topics.join(" ")} ${t.description}`,
  ).slice(0, 5);

  const facts = [
    { label: "People recommending", value: String(t.mentionCount), big: true },
    { label: "GitHub stars", value: fmtCount(t.stars) },
    { label: "Licence", value: t.license },
    { label: "Language", value: t.language ?? "Not stated" },
    { label: "Last commit", value: fmtDate(t.pushedAt) },
  ];

  return (
    <main className="shell pt-10 sm:pt-14">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="link">Directory</Link>
        <span aria-hidden="true"> / </span>
        <span>{t.name}</span>
      </nav>

      <h1 className="mt-4 text-3xl sm:text-[2.5rem]">{t.name}</h1>
      <p className="mono mt-2 text-sm text-muted">{t.fullName}</p>
      {t.description && <p className="lead mt-4 text-ink-2">{t.description}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`https://github.com/${t.fullName}`} className="key key--primary" target="_blank" rel="noopener noreferrer">
          Open on GitHub
        </a>
        {t.homepage && (
          <a href={t.homepage} className="key" target="_blank" rel="noopener noreferrer">
            Website
          </a>
        )}
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-5">
        {facts.map((f) => (
          <div key={f.label} className="bg-paper p-5">
            <dt className="label">{f.label}</dt>
            <dd className={f.big ? "figure mt-1 text-3xl" : "num mt-2 font-display font-medium"}>{f.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-14" aria-labelledby="said">
        <h2 id="said" className="text-xl">What Hacker News said</h2>
        <ul className="mt-2">
          {t.mentions.map((m) => (
            <li key={m.url} className="border-b border-rule py-5">
              <blockquote className="quote">
                <p>{m.snippet.length >= 280 ? `${m.snippet}…` : m.snippet}</p>
                <footer className="mt-2 text-sm text-muted">
                  <a href={m.url} className="link" target="_blank" rel="noopener noreferrer">
                    {m.author ?? "A commenter"}, {m.source}, {fmtDate(m.date)}
                  </a>
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      </section>

      {alts.length > 0 && (
        <section className="mt-14" aria-labelledby="alt">
          <h2 id="alt" className="text-xl">Suggested as an alternative to</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {alts.map((a) => (
              <li key={a.slug}>
                <Link href={`/alternatives/${a.slug}`} className="key key--sm">{a.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {similar.length > 0 && (
        <section className="mt-14" aria-labelledby="similar">
          <h2 id="similar" className="text-xl">Similar tools</h2>
          <ul className="mt-2">
            {similar.map((s) => (
              <li key={s.fullName} className="grid gap-x-6 border-b border-rule py-4 sm:grid-cols-[12rem_minmax(0,1fr)_auto]">
                <Link href={toolPath(s)} className="link font-display font-medium">{s.name}</Link>
                <p className="text-sm text-ink-2">{s.description}</p>
                <p className="text-sm text-muted">
                  <span className="num">{s.mentionCount}</span> recommending
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
