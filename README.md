# hackfree

Self-updating directory of free, open source software that people recommend on Hacker News. Type a problem ("back up my photos without Google") and it shows the best-matching tools (`lib/match.ts`).

## How it works

1. `scripts/scrape.mjs` reads Hacker News through the free Algolia API (no key needed): recent comments, every comment in popular Ask HN threads ("what self-hosted tools do you use?"), and GitHub repos that hit the front page (100+ points).
2. It keeps comments that sound like a recommendation and pulls out `github.com/owner/repo` links.
3. Each repo is checked against the GitHub API. It gets listed only if it has a real OSS licence, isn't archived or a fork, and has 20+ stars.
4. Results build up in `data/tools.json` (full state) and `data/directory.json` (what the site imports).
5. `.github/workflows/scrape.yml` runs this every 6 hours and commits the data. Vercel redeploys on each push.

No backend: the site is fully static Next.js.

## Pages

- `/`: describe a problem, get matching tools. Rising this month, categories, language filter. Searches live in the URL (`/?q=block+ads`), so they can be shared.
- `/tool/<owner>/<repo>`: every tool gets a page with its HN quotes, facts and similar tools.
- `/alternatives/<product>`: "open source alternatives to Notion" pages, built from comments like "I switched from Notion to X". A product gets a page once two tools are named.
- `/feed.xml`: RSS of tools newly added to the directory.
- `/sitemap.xml`, `/robots.txt` for search engines. Set `NEXT_PUBLIC_SITE_URL` once you have a domain; on Vercel it falls back to the production URL.

## Setup

```bash
npm install
npm run dev
node scripts/scrape.mjs --test   # self-check
node scripts/match-check.mjs     # problem-matcher check
node scripts/scrape.mjs          # scrape (set GITHUB_TOKEN locally, otherwise 50 repos/run)
```

Deploy: push to GitHub, import the repo in Vercel. The Action needs no setup or secrets.
First deploy: run the workflow manually with `hn_pages = 5` to backfill.
