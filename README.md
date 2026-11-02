# humble

Swipe right on your next tool. humble deals you free, open source tools that developers recommend in public, one card at a time. Save what you like, skip what you don't, and keep every link.

## Where the tools come from

`scripts/scrape.mjs` reads public discussions through each site's official API, no keys needed:

- **Hacker News** (Algolia API): recent comments, every comment in popular Ask HN threads, GitHub repos that reached the front page.
- **Stack Exchange**: upvoted answers on Software Recommendations and Super User. Optional `STACKEXCHANGE_KEY` secret raises the daily quota.
- **Lobsters**: GitHub stories plus comments on the hottest stories.
- **Lemmy**: selfhosted, opensource, linux and programming communities.
- **Fosstodon**: Mastodon hashtag timelines for open source and self hosting.

It keeps comments that read like a recommendation, pulls out `github.com/owner/repo` links and checks each repo on GitHub. A repo is listed only if it has an open source licence, isn't archived or a fork, has 20+ stars, and isn't a list, guide or on `data/blocklist.txt`. "Recommended by" counts distinct people.

`.github/workflows/scrape.yml` runs every 6 hours and commits the data; Vercel redeploys on each push. No backend: the site is static Next.js, and saves live in the visitor's browser.

## Pages

- `/`: landing page with a preview of the deck.
- `/swipe`: the deck. Drag or use ← → keys; Backspace undoes. A GitHub star pops on every save. The next card is picked by `lib/recommend.ts` from your saves and skips. First visit gets an interest picker and a short guided tour.
- `/saved`: saved tools with GitHub and website links. Copy as Markdown, download, or share a link.
- `/search`: describe a problem, get matching tools (`lib/match.ts`). Searches live in the URL.
- `/categories` and `/categories/<slug>`: 14 categories from GitHub topics and descriptions (`lib/categories.ts`).
- `/tool/<owner>/<repo>`, `/alternatives/<product>`: a page per tool, and "alternatives to X" pages.
- `/feed.xml`, `/sitemap.xml`, `/robots.txt`. Set `NEXT_PUBLIC_SITE_URL` once you have a domain.

## Setup

```bash
npm install
npm run dev
node scripts/scrape.mjs --test      # scraper self-check
node scripts/match-check.mjs        # search matcher check
node scripts/recommend-check.mjs    # swipe recommender check
node scripts/scrape.mjs             # scrape (set GITHUB_TOKEN locally, otherwise 50 repos per run)
```

"Suggest a tool" and "Report this listing" open a pre-filled email to the maintainer (the repo is private, so visitors cannot open GitHub issues). To drop a reported listing, add its `owner/repo` to `data/blocklist.txt`; the next scrape removes it.
