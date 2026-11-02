import { auth } from "@clerk/nextjs/server";
import { tools } from "@/lib/data";
import { addSaves, listSaves, removeSaves } from "@/lib/db";

const known = new Set(tools.map((t) => t.fullName));
const noStore = { "Cache-Control": "private, no-store" };

// The signed in visitor's saved tools. Nobody can read or change anyone else's list: the user
// comes from Clerk's verified session, never from the request body.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in first" }, { status: 401, headers: noStore });
  return Response.json({ ids: await listSaves(userId) }, { headers: noStore });
}

// { add?: string[], remove?: string[] } with humble tool names like "immich-app/immich".
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in first" }, { status: 401, headers: noStore });

  const body = await req.json().catch(() => null);
  const clean = (v: unknown) => (Array.isArray(v) ? v.filter((id): id is string => typeof id === "string" && known.has(id)) : []);
  const add = clean(body?.add);
  const remove = clean(body?.remove);
  if (add.length + remove.length === 0 || add.length + remove.length > 2000) {
    return Response.json({ error: "Nothing valid to change" }, { status: 400, headers: noStore });
  }

  await addSaves(userId, add);
  await removeSaves(userId, remove);
  return Response.json({ ok: true }, { headers: noStore });
}
