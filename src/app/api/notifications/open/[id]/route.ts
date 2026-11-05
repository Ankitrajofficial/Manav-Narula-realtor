import { publicUrl } from "@/lib/google-auth";
import { safePath } from "@/lib/safe-path";
import { NextResponse, type NextRequest } from "next/server";
import { getSession, needsNewPin } from "@/lib/auth";
import { markNotificationsRead } from "@/lib/queries/common";

/** Opening a notification (from the list, the pop-up or a push) marks it read and goes to what it is about. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || needsNewPin(user)) return NextResponse.redirect(publicUrl("/login", req.url));
  const href = await markNotificationsRead(user.id, Number((await params).id) || -1);
  const fallback = user.role === "admin" ? "/admin/notifications" : "/employee/notifications";
  return NextResponse.redirect(publicUrl(safePath(href, fallback), req.url));
}
