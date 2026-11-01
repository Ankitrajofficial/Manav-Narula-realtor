import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { metaConfigured, syncFromMeta } from "@/lib/facebook-leads";

export const dynamic = "force-dynamic";

/**
 * Pulls the last `days` (default 7, max 90) of Lead Ads submissions from Meta and creates any lead this server missed.
 * Open it signed in as an admin (https://<site>/api/leads/facebook/sync?days=30), or call it from a cron with header
 * x-cron-secret = CRON_SECRET to have a daily safety net.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const byCron = !!secret && req.headers.get("x-cron-secret") === secret;
  const user = byCron ? null : await getSession();
  if (!byCron && user?.role !== "admin") return NextResponse.json({ ok: false, error: "Admins only" }, { status: 401 });
  if (!metaConfigured()) return NextResponse.json({ ok: false, error: "META_APP_SECRET, META_VERIFY_TOKEN and META_PAGE_ACCESS_TOKEN must be set on the server" }, { status: 503 });
  const days = Number(new URL(req.url).searchParams.get("days")) || 7;
  try {
    const r = await syncFromMeta(days);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("[facebook-lead] sync", error);
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}
export const POST = GET;
