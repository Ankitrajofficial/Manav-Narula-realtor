import { NextResponse } from "next/server";
import { runDueCampaigns } from "@/lib/queries/campaigns";

/** Cron endpoint: call every few minutes with header x-cron-secret = CRON_SECRET to send scheduled campaigns on time. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  const n = await runDueCampaigns(null);
  return NextResponse.json({ ok: true, ran: n });
}
export const GET = POST;
