import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { q } from "@/lib/db";

interface Sub { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
const isPushUrl = (u: string) => /^https:\/\/[^\s]+$/.test(u) && u.length < 1000;

/** Saves this browser's push subscription for the signed-in person (a browser moved to another person moves with it). */
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const s = (await req.json().catch(() => ({}))) as Sub;
  if (!s.endpoint || !isPushUrl(s.endpoint) || !s.keys?.p256dh || !s.keys?.auth) return NextResponse.json({ ok: false, error: "Invalid subscription" }, { status: 422 });
  await q(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_agent = EXCLUDED.user_agent`,
    [user.id, s.endpoint, s.keys.p256dh, s.keys.auth, (req.headers.get("user-agent") ?? "").slice(0, 300)],
  );
  return NextResponse.json({ ok: true });
}

/** Turns push off for this browser. */
export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const s = (await req.json().catch(() => ({}))) as Sub;
  if (s.endpoint) await q("DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2", [s.endpoint, user.id]);
  return NextResponse.json({ ok: true });
}
