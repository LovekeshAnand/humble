// Server only. Signed in visitors' saves, in Neon Postgres.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL ?? "postgres://missing");

// Created on first use as well as by scripts/db-setup.mjs, so a fresh database branch just works.
let ready: Promise<unknown> | null = null;
const ensure = () =>
  (ready ??= sql`
    CREATE TABLE IF NOT EXISTS saves (
      user_id    text        NOT NULL,
      tool       text        NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, tool)
    )`.catch((e) => { ready = null; throw e; }));

export async function listSaves(userId: string): Promise<string[]> {
  await ensure();
  const rows = await sql`SELECT tool FROM saves WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows.map((r) => r.tool as string);
}

export async function addSaves(userId: string, tools: string[]) {
  if (!tools.length) return;
  await ensure();
  await sql`
    INSERT INTO saves (user_id, tool)
    SELECT ${userId}, unnest(${tools}::text[])
    ON CONFLICT DO NOTHING`;
}

export async function removeSaves(userId: string, tools: string[]) {
  if (!tools.length) return;
  await ensure();
  await sql`DELETE FROM saves WHERE user_id = ${userId} AND tool = ANY(${tools}::text[])`;
}
