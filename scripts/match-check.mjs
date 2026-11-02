// Self-check for lib/match.ts. Run: node scripts/match-check.mjs
import assert from "node:assert";
import { rank, stem, terms } from "../lib/match.ts";

assert.equal(stem("images"), stem("image"));
assert.equal(stem("shared"), stem("share"));
assert.equal(stem("self-hosted"), stem("self-host"));
assert.deepEqual(terms("I need a way to back up my photos"), ["backup", "photo"]);
assert.deepEqual(terms("block ads now"), ["adblock", "now"]);

const tool = (name, description, topics, extra = {}) => ({ name, fullName: `x/${name}`, description, topics, stars: 100, mentionCount: 1, said: "", ...extra });
const tools = [
  tool("immich", "High performance self-hosted photo and video management", ["photos", "self-hosted", "google-photos-alternative"]),
  tool("jellyfin", "The Free Software Media System", ["media-server", "movies"]),
  tool("bitwarden", "Password manager", ["password-manager"]),
  tool("pigallery", "A fast directory-first image gallery", ["gallery"]),
];
const names = (q) => rank(tools, q).map((t) => t.name);
assert.equal(names("I want to back up my photos without google")[0], "immich");
assert.ok(!names("stream my movies at home").includes("bitwarden"), "no match on unrelated tools");
const chatty = tool("chatty", "A terminal emulator", ["terminal"], { said: "I use this to stream logs while watching movies" });
assert.ok(!rank([chatty], "stream movies").length, "words only in a comment are not enough");
assert.ok(names("where do I store pictures").includes("pigallery"), "synonym photo->image/gallery");
assert.equal(names("stream my movies at home")[0], "jellyfin");
assert.deepEqual(names("password"), ["bitwarden"]);
assert.equal(names("").length, 4, "empty query returns everything");
console.log("ok");
