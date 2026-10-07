import { NextResponse } from "next/server";
import { requireExporter } from "@/lib/export-guard";
import { audienceFor, parseAudience } from "@/lib/queries/campaigns";

/** Live audience count for the campaign editor. */
export async function GET(req: Request) {
  const auth = await requireExporter(req); if (auth instanceof Response) return auth;
  const sp = new URL(req.url).searchParams;
  const a = parseAudience({ kinds: sp.getAll("kinds"), statuses: sp.getAll("statuses"), tags: sp.getAll("tags"), localities: sp.getAll("localities"), interests: sp.getAll("interests"), optInOnly: sp.get("optInOnly") !== "0" });
  // With a project: leads already messaged about it in another campaign are left out (and counted).
  const { recipients, alreadyMessaged } = await audienceFor(a, Number(sp.get("project_id")) || null, Number(sp.get("campaign_id")) || null);
  return NextResponse.json({ n: recipients.length, skipped: alreadyMessaged.length, sample: recipients.slice(0, 5).map((r) => r.name) });
}
