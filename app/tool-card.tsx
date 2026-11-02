import Link from "next/link";
import Avatar from "./avatar";
import ExtLink from "./ext-link";
import { SaveButton } from "./save-button";
import { authorName, cleanSnippet, fmtCount, platformOf, toolPath, type Mention } from "@/lib/format";

type CardTool = {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  license: string;
  language: string | null;
  mentionCount: number;
};

// A tool in a list: who made it, what it is, what one real person said, how many vouch for it.
export default function ToolCard({ tool, quote }: { tool: CardTool; quote: Mention | null }) {
  return (
    <li className="group relative flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6 transition-colors duration-300 ease-(--ease-soft) hover:border-line-strong">
      <div className="flex items-start gap-4">
        <Avatar fullName={tool.fullName} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold">
            <Link href={toolPath(tool)} className="after:absolute after:inset-0 after:rounded-3xl after:content-['']">
              {tool.name}
            </Link>
          </h3>
          <p className="truncate font-mono text-xs text-fg-subtle">{tool.fullName}</p>
        </div>
        <div className="relative z-10">
          <SaveButton id={tool.fullName} name={tool.name} />
        </div>
      </div>
      {tool.description && <p className="text-fg-muted">{tool.description}</p>}
      {quote && (
        <blockquote className="relative z-10 rounded-2xl bg-raised p-4 text-sm">
          <p className="text-fg">“{cleanSnippet(quote.snippet)}”</p>
          <footer className="mt-2 text-xs text-fg-subtle">
            <ExtLink href={quote.url} className="link hover:text-fg-muted">
              {authorName(quote)} on {platformOf(quote.source)}
            </ExtLink>
          </footer>
        </blockquote>
      )}
      <dl className="mt-auto flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex items-baseline gap-2">
          <dt className="text-fg-subtle">Recommended by</dt>
          <dd className="font-mono font-semibold text-save">{tool.mentionCount}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-fg-subtle">Stars</dt>
          <dd className="font-mono">{fmtCount(tool.stars)}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-fg-subtle">Licence</dt>
          <dd className="font-mono">{tool.license}</dd>
        </div>
      </dl>
    </li>
  );
}
