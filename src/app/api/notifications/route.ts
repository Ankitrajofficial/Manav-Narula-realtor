import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { listStoredNotifications, markNotificationsRead, notificationCount } from "@/lib/queries/common";

const noStore = { headers: { "Cache-Control": "private, no-store" } };

/** The console bell polls this: the count, and notifications newer than ?after=<id> (for the pop-up and the sound). */
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ ok: false }, { status: 401, ...noStore });
  // Without ?after only the count is wanted; after=0 is someone whose first notifications are arriving.
  const afterParam = req.nextUrl.searchParams.get("after");
  const after = Math.max(0, Number(afterParam) || 0);
  const [count, items] = await Promise.all([notificationCount(user.id, user.role), afterParam !== null ? listStoredNotifications(user.id, { afterId: after, limit: 10 }) : Promise.resolve([])]);
  return NextResponse.json({ ok: true, count, items }, noStore);
}

/** Marks notifications read: body {id} for one, {} for all. */
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ ok: false }, { status: 401, ...noStore });
  const body = (await req.json().catch(() => ({}))) as { id?: number };
  await markNotificationsRead(user.id, Number(body.id) || undefined);
  return NextResponse.json({ ok: true, count: await notificationCount(user.id, user.role) }, noStore);
}
