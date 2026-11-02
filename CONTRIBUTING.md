# Contributing to humble

Thanks for helping. humble is small on purpose, so most contributions are a few lines: a better keyword, a missing synonym, a new community to read from. This guide gets you from clone to pull request.

## Ways to help

| You want to | Do this |
|---|---|
| Suggest a tool | Open an issue with the GitHub link and a public comment or answer recommending it |
| Remove a listing that is not software, abandoned or spam | Add its `owner/repo` to `data/blocklist.txt` in a pull request, or open an issue |
| Fix a tool in the wrong category | Edit the keyword lists in `lib/categories.ts` |
| Make search understand a phrase | Add a synonym or phrase in `lib/match.ts` (`SYN`, `PHRASES`) and a case to `scripts/match-check.mjs` |
| Add a new community as a source | Add a collector to `scripts/scrape.mjs` (see below) |
| Report a bug | Open an issue with steps to reproduce, what you expected, and your browser |

## Setup

Requirements: Node.js 20.9 or newer, npm.

```bash
git clone https://github.com/LovekeshAnand/humble.git
cd humble
npm install
npm run dev
```

The repo includes a recent dataset, so the site runs without any keys. Sign in, synced saves and analytics are optional and stay off without their environment variables (see the README).

## Before you open a pull request

Run all four checks. CI and reviewers expect them to pass.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` runs the self checks for the scraper, the search matcher and the recommender. If you change one of those, add or update a case in the matching `scripts/*-check.mjs` file.

## Guidelines

**Keep it small.** Prefer a few clear lines over a new abstraction or dependency. If a change needs a new package, explain why in the pull request.

**Do not commit `data/directory.json` or `data/tools.json`.** The scheduled workflow owns them and commits fresh data every six hours, so hand edits cause conflicts. The one exception is `data/blocklist.txt`.

**Only use official APIs** when adding a source, and respect each site's rate limits and terms. No scraping of HTML pages, no getting around blocks or logins. A new collector should:

1. Return mentions shaped like `{ repo, author, source, url, text, date }`.
2. Keep only comments that read like a recommendation (the shared `RECOMMEND` pattern).
3. Prefix authors with the platform (`lemmy:name`) so people are counted once per community.
4. Be added to the `safe(...)` list in `main()`, so one source failing never stops the others.
5. Use the same name in `SOURCE_NAMES` (`lib/format.ts`) so it shows up in filters and attributions.

**Quotes stay verbatim.** Never edit what someone wrote. Cut long comments with `…` instead.

**Accessibility is not optional.** Interactive elements need a visible focus state and a label, animations need a reduced motion fallback, and nothing should depend on colour alone.

**Privacy.** Do not add tracking, third party scripts or new data collection without discussing it in an issue first, and update the Privacy page if behaviour changes.

## Commits and pull requests

- Write commit messages in the imperative, describing the change: `Add Codeberg as a source`, `Fix ripgrep landing in Web`.
- One topic per pull request. Small pull requests get reviewed fastest.
- Describe what changed, why, and how you checked it. Screenshots help for UI changes.
- Link the issue it closes, if there is one.

## Code of conduct

Be kind and assume good intent. Critique code, not people. Harassment or personal attacks lead to removal from the project.

## License

By contributing, you agree that your contributions are licensed under the same license as the project (see [LICENSE](LICENSE)).
