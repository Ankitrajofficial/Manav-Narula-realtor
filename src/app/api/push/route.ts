import { NextResponse, type NextRequest } from "next/server";
import { getSession, needsNewPin } from "@/lib/auth";
import { q } from "@/lib/db";

interface Sub { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
const PUSH_HOSTS = /^(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.push\.services\.mozilla\.com|[a-z0-9-]+\.notify\.windows\.com|web\.push\.apple\.com|[a-z0-9-]+\.push\.apple\.com)$/i;
const isPushUrl = (u: string) => {
  if (u.length >= 1000 || !/^https:\/\/[^\s]+$/.test(u)) return false;
  try { return PUSH_HOSTS.test(new URL(u).hostname); } catch { return false; }
};

/** Saves this browser's push subscription for the signed-in person (a browser moved to another person moves with it). */
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || needsNewPin(user)) return NextResponse.json({ ok: false }, { status: 401 });
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
  if (!user || needsNewPin(user)) return NextResponse.json({ ok: false }, { status: 401 });
  const s = (await req.json().catch(() => ({}))) as Sub;
  if (s.endpoint) await q("DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2", [s.endpoint, user.id]);
  return NextResponse.json({ ok: true });
}
