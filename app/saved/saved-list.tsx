"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CopyIcon, DownloadSimpleIcon, GithubLogoIcon, GlobeIcon, LinkIcon, TrashIcon } from "@phosphor-icons/react";
import { saved, useSaved } from "@/lib/saved";
import { fmtCount, githubUrl, toolPath, type LeanTool } from "@/lib/format";
import Avatar from "../avatar";
import ExtLink from "../ext-link";

const asMarkdown = (list: LeanTool[]) =>
  `# My open source tools\n\n${list
    .map((t) => `- [${t.name}](${githubUrl(t)})${t.homepage ? ` ([website](${t.homepage}))` : ""}: ${t.description}`)
    .join("\n")}\n\nFound on humble.\n`;

export default function SavedList({ tools }: { tools: LeanTool[] }) {
  const { liked } = useSaved();
  const [shared, setShared] = useState<string[] | null>(null);
  const [status, setStatus] = useState("");

  // A shared link carries its list in ?ids=owner/repo,owner/repo
  useEffect(() => {
    const ids = new URLSearchParams(window.location.search).get("ids");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the shared list from the URL
    if (ids) setShared(ids.split(",").filter(Boolean));
  }, []);

  const byId = useMemo(() => new Map(tools.map((t) => [t.fullName, t] as const)), [tools]);
  const list = (shared ?? liked).map((id) => byId.get(id)).filter((t): t is LeanTool => !!t);

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(done);
    } catch {
      setStatus("Your browser blocked copying. Download the list instead.");
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([asMarkdown(list)], { type: "text/markdown" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "my-open-source-tools.md" });
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Downloaded my-open-source-tools.md");
  }

  const shareUrl = () => `${window.location.origin}/saved?ids=${list.map((t) => t.fullName).join(",")}`;

  if (!list.length) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-line bg-surface p-12 text-center">
        <p className="text-xl font-semibold">{shared ? "This shared list is empty" : "Nothing saved yet"}</p>
        <p className="mt-2 text-fg-muted">Swipe right on a tool, or press Save on any tool, and it lands here with its links.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/swipe" className="btn btn-primary">Start swiping</Link>
          <Link href="/search" className="btn btn-secondary">Search by problem</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {shared && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line-strong bg-raised p-6">
          <p className="font-semibold">Someone shared {list.length} tools with you.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => { saved.addMany(list.map((t) => t.fullName)); setStatus(`Added ${list.length} tools to your saved list`); }}>
              Add all to my saved
            </button>
            <Link href="/saved" className="btn btn-secondary" onClick={() => setShared(null)}>View my own list</Link>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn btn-secondary" onClick={() => copy(asMarkdown(list), "Copied the list as Markdown")}>
          <CopyIcon size={20} aria-hidden="true" /> Copy links
        </button>
        <button type="button" className="btn btn-secondary" onClick={download}>
          <DownloadSimpleIcon size={20} aria-hidden="true" /> Download Markdown
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => copy(shareUrl(), "Copied a link to this list")}>
          <LinkIcon size={20} aria-hidden="true" /> Copy share link
        </button>
      </div>
      <p className="mt-4 min-h-6 text-center text-sm text-save" role="status">{status}</p>

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((t) => (
          <li key={t.fullName} className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6">
            <div className="flex items-start gap-4">
              <Avatar fullName={t.fullName} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold"><Link href={toolPath(t)} className="hover:underline">{t.name}</Link></h2>
                <p className="truncate font-mono text-xs text-fg-subtle">{t.fullName}</p>
              </div>
              {!shared && (
                <button
                  type="button"
                  className="action size-10 text-fg-subtle hover:bg-raised hover:text-skip"
                  onClick={() => { saved.remove(t.fullName); setStatus(`Removed ${t.name}`); }}
                  aria-label={`Remove ${t.name}`}
                >
                  <TrashIcon size={20} aria-hidden="true" />
                </button>
              )}
            </div>
            <p className="text-fg-muted">{t.description}</p>
            <p className="text-sm text-fg-subtle">
              <span className="font-mono text-save">{t.mentionCount}</span> recommending, <span className="font-mono">{fmtCount(t.stars)}</span> stars, {t.license}
            </p>
            <div className="mt-auto flex flex-wrap gap-2">
              <ExtLink href={githubUrl(t)} className="btn btn-secondary btn-sm"><GithubLogoIcon size={16} aria-hidden="true" /> GitHub</ExtLink>
              {t.homepage && <ExtLink href={t.homepage} className="btn btn-secondary btn-sm"><GlobeIcon size={16} aria-hidden="true" /> Website</ExtLink>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
