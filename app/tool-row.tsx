import Link from "next/link";
import { fmtCount, fmtDate, toolPath, type Mention } from "@/lib/data";

type RowTool = {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  license: string;
  language: string | null;
  mentionCount: number;
};

// The ledger row: what it is, what one real person said, and how many people vouch for it.
export default function ToolRow({ tool, quote }: { tool: RowTool; quote: Mention | null }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 border-b border-rule py-6 sm:grid-cols-[minmax(0,1fr)_9rem]">
      <div className="min-w-0">
        <h3 className="text-lg">
          <Link href={toolPath(tool)} className="link">{tool.name}</Link>
        </h3>
        <p className="mono mt-1 truncate text-xs text-muted">{tool.fullName}</p>
        {tool.description && <p className="mt-2 max-w-[70ch] text-ink-2">{tool.description}</p>}
        {quote && (
          <blockquote className="quote mt-4 max-w-[75ch] text-sm">
            <p>{quote.snippet.length >= 280 ? `${quote.snippet}…` : quote.snippet}</p>
            <footer className="mt-1 text-xs text-muted">
              <a href={quote.url} className="link" target="_blank" rel="noopener noreferrer">
                {quote.author ?? "A commenter"} on HN, {fmtDate(quote.date)}
              </a>
            </footer>
          </blockquote>
        )}
      </div>
      <dl className="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:content-start sm:gap-2 sm:text-right">
        <div>
          <dt className="label">People recommending</dt>
          <dd className="figure">{tool.mentionCount}</dd>
        </div>
        <div>
          <dt className="label">GitHub stars</dt>
          <dd className="num font-display text-sm font-medium">{fmtCount(tool.stars)}</dd>
        </div>
        <div>
          <dt className="label">Licence</dt>
          <dd className="font-display text-sm font-medium">{tool.license}</dd>
        </div>
      </dl>
    </li>
  );
}
