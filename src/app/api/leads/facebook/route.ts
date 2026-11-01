import { after, NextResponse } from "next/server";
import { metaConfigured, processPending, storeWebhook, verifySignature } from "@/lib/facebook-leads";

export const dynamic = "force-dynamic";

/**
 * Meta webhook for Facebook / Instagram Lead Ads. Register https://<site>/api/leads/facebook as the callback URL with
 * META_VERIFY_TOKEN as the verify token and subscribe the Page to the "leadgen" field.
 * GET answers Meta's one-time verification; POST receives form submissions (see src/lib/facebook-leads.ts).
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const token = process.env.META_VERIFY_TOKEN;
  if (u.searchParams.get("hub.mode") === "subscribe" && token && u.searchParams.get("hub.verify_token") === token) {
    return new Response(u.searchParams.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ ok: false, error: metaConfigured() ? "Verification failed" : "Facebook leads are not set up on this server" }, { status: 403 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    console.warn("[facebook-lead] delivery with a bad or missing signature rejected");
    return NextResponse.json({ ok: false, error: "Bad signature" }, { status: 401 });
  }
  let payload: { object?: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (payload.object !== "page") return NextResponse.json({ ok: true, ignored: true });
  // Save first, answer Meta, then fetch the answers and create the leads in the background.
  const received = await storeWebhook(payload);
  after(() => processPending().catch((e) => console.error("[facebook-lead] processing", e)));
  return NextResponse.json({ ok: true, received });
}
