import { requireExporter } from "@/lib/export-guard";
import { csvResponse, toCsv } from "@/lib/csv";
import { listCampaigns, listMessages } from "@/lib/queries/campaigns";
import { formatDateTime } from "@/lib/format";

export async function GET(req: Request) {
  const auth = await requireExporter(req); if (auth instanceof Response) return auth;
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  if (sp.campaign) {
    const rows = await listMessages(Number(sp.campaign));
    return csvResponse(toCsv(rows, [
      { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "status", label: "Status" },
      { key: "sent_at", label: "Sent at", value: (r) => formatDateTime(r.sent_at) }, { key: "error", label: "Error" }, { key: "body", label: "Message" },
    ]), `campaign-${sp.campaign}-delivery.csv`);
  }
  const { rows } = await listCampaigns({ ...sp, page: "1" });
  return csvResponse(toCsv(rows, [
    { key: "name", label: "Campaign" }, { key: "status", label: "Status" }, { key: "total", label: "Recipients" }, { key: "sent_count", label: "Sent" }, { key: "failed_count", label: "Failed" },
    { key: "scheduled_at", label: "Scheduled", value: (r) => formatDateTime(r.scheduled_at) }, { key: "sent_at", label: "Sent at", value: (r) => formatDateTime(r.sent_at) }, { key: "message", label: "Message" },
  ]), "campaigns.csv");
}
