// Self-check for lib/recommend.ts. Run: node scripts/recommend-check.mjs
import assert from "node:assert";
import { nextCard } from "../lib/recommend.ts";

const t = (fullName, categories, extra = {}) => ({ fullName, categories, topics: [], language: null, mentionCount: 3, stars: 500, ...extra });
const tools = [
  t("a/llm-1", ["ai"]), t("a/llm-2", ["ai"]), t("a/llm-3", ["ai"]),
  t("m/photos", ["media", "self-hosted"]), t("m/music", ["media"]),
  t("c/shell", ["cli"], { mentionCount: 40, stars: 90000 }),
];
const noExplore = () => 0.99;

// Cold start: the most vouched-for tool comes first.
assert.equal(nextCard(tools, { liked: [], skipped: [], picks: [] }, noExplore).fullName, "c/shell");
// Picked interests beat popularity.
assert.deepEqual(nextCard(tools, { liked: [], skipped: [], picks: ["media"] }, noExplore).categories.includes("media"), true);
// Liking AI tools brings more AI tools.
assert.equal(nextCard(tools, { liked: ["a/llm-1", "a/llm-2"], skipped: [], picks: [] }, noExplore).fullName, "a/llm-3");
// Skipping a category pushes it down.
const afterSkips = nextCard(tools, { liked: [], skipped: ["c/shell", "a/llm-1", "a/llm-2"], picks: [] }, noExplore);
assert.ok(afterSkips.categories.includes("media"), "skipped AI twice, should move on");
// Never shows a card twice; empty when everything is seen.
assert.equal(nextCard(tools, { liked: tools.map((x) => x.fullName), skipped: [], picks: [] }), null);
console.log("ok");
