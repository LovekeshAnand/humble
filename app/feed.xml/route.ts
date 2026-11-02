import { SITE_URL, toolPath, tools, updatedAt } from "@/lib/data";


const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Newest tools to enter the directory.
export function GET() {
  const items = [...tools]
    .sort((a, b) => (b.listedAt ?? b.lastMentioned).localeCompare(a.listedAt ?? a.lastMentioned))
    .slice(0, 50)
    .map((t) => {
      const link = `${SITE_URL}${toolPath(t)}`;
      const quote = t.mentions[0]?.snippet ?? "";
      return `<item><title>${esc(t.name)}</title><link>${link}</link><guid>${link}</guid><pubDate>${new Date(
        t.listedAt ?? t.lastMentioned,
      ).toUTCString()}</pubDate><description>${esc(`${t.description} Recommended by ${t.mentionCount} on Hacker News. "${quote}"`)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>hackfree: new on Hacker News</title><link>${SITE_URL}</link><description>Open source tools Hacker News commenters started recommending.</description><lastBuildDate>${new Date(
    updatedAt,
  ).toUTCString()}</lastBuildDate>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
