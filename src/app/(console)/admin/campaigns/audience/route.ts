import { NextResponse } from "next/server";
import { requireExporter } from "@/lib/export-guard";
import { parseAudience, resolveAudience } from "@/lib/queries/campaigns";

/** Live audience count for the campaign editor. */
export async function GET(req: Request) {
  const auth = await requireExporter(req); if (auth instanceof Response) return auth;
  const sp = new URL(req.url).searchParams;
  const a = parseAudience({ kinds: sp.getAll("kinds"), statuses: sp.getAll("statuses"), tags: sp.getAll("tags"), localities: sp.getAll("localities"), interests: sp.getAll("interests"), optInOnly: sp.get("optInOnly") !== "0" });
  const list = await resolveAudience(a);
  return NextResponse.json({ n: list.length, sample: list.slice(0, 5).map((r) => r.name) });
}
