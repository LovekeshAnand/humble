// Creates the saves table in Neon. Run: node --env-file=.env.local scripts/db-setup.mjs
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing: run `vercel env pull --yes` first");
const sql = neon(process.env.DATABASE_URL);
await sql`
  CREATE TABLE IF NOT EXISTS saves (
    user_id    text        NOT NULL,
    tool       text        NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, tool)
  )`;
const [{ n }] = await sql`SELECT count(*)::int AS n FROM saves`;
console.log(`saves table ready (${n} rows)`);
