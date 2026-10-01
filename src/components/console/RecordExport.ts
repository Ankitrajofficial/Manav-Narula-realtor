import "server-only";
import { requireExporter } from "@/lib/export-guard";
import { csvResponse, toCsv } from "@/lib/csv";
import { buildPdf, pdfResponse } from "@/lib/pdf";
import { formatDateTime, formatShortDate } from "@/lib/format";
import { allLeads, type LeadRow, type SP } from "@/lib/queries/leads";
import { allProspects, type ProspectRow } from "@/lib/queries/prospects";

/** Shared GET handler body for /admin/leads|prospects/export. Admins only; employees get 403 and the attempt is logged. */
export async function exportRecords(kind: "lead" | "prospect", req: Request) {
  const user = await requireExporter(req);
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const sp: SP = Object.fromEntries(url.searchParams.entries());
  const format = sp.format === "pdf" ? "pdf" : "csv";
  const scope = {};
  const stamp = new Date().toISOString().slice(0, 10);
  if (kind === "lead") {
    const { rows, meta } = await allLeads(sp, scope);
    if (format === "csv") {
      return csvResponse(toCsv(rows as unknown as Record<string, unknown>[], [
        { key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" }, { key: "interest", label: "Interest" }, { key: "budget", label: "Budget" },
        { key: "locality", label: "Locality" }, { key: "property_title", label: "Property" }, { key: "project_name", label: "Project" }, { key: "source", label: "Source" }, { key: "status", label: "Status" },
        { key: "assigned_name", label: "Assigned to" }, { key: "tags", label: "Tags" }, { key: "whatsapp_opt_in", label: "WhatsApp opt-in", value: (r) => (r.whatsapp_opt_in ? "Yes" : "No") },
        { key: "next_follow_up_at", label: "Next follow-up", value: (r) => formatDateTime(r.next_follow_up_at as Date | null) }, { key: "created_at", label: "Created", value: (r) => formatDateTime(r.created_at as Date) }, { key: "notes", label: "Notes" },
      ]), `leads-${stamp}.csv`);
    }
    const pdf = buildPdf({ title: "Leads report", subtitle: `${rows.length} leads`, meta, table: {
      columns: [{ label: "Name", width: 120 }, { label: "Phone", width: 90 }, { label: "Interest", width: 50 }, { label: "Locality", width: 110 }, { label: "Source", width: 70 }, { label: "Status", width: 75 }, { label: "Assigned", width: 100 }, { label: "Created", width: 75 }, { label: "Follow-up", width: 80 }],
      rows: (rows as LeadRow[]).map((r) => [r.name, r.phone, r.interest ?? "", r.locality ?? "", r.source, r.status, r.assigned_name ?? "Unassigned", formatShortDate(r.created_at), r.next_follow_up_at ? formatShortDate(r.next_follow_up_at) : ""]),
    } });
    return pdfResponse(pdf, `leads-${stamp}.pdf`);
  }
  const { rows, meta } = await allProspects(sp, scope);
  if (format === "csv") {
    return csvResponse(toCsv(rows as unknown as Record<string, unknown>[], [
      { key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" }, { key: "locality", label: "Locality" }, { key: "budget", label: "Budget" }, { key: "interest", label: "Interest" },
      { key: "tags", label: "Tags" }, { key: "whatsapp_opt_in", label: "WhatsApp opt-in", value: (r) => (r.whatsapp_opt_in ? "Yes" : "No") }, { key: "status", label: "Status" }, { key: "source", label: "Source" }, { key: "assigned_name", label: "Assigned to" }, { key: "added_by_name", label: "Added by" },
      { key: "last_contacted_at", label: "Last contacted", value: (r) => formatDateTime(r.last_contacted_at as Date | null) }, { key: "next_follow_up_at", label: "Next follow-up", value: (r) => formatDateTime(r.next_follow_up_at as Date | null) }, { key: "created_at", label: "Added", value: (r) => formatDateTime(r.created_at as Date) }, { key: "notes", label: "Notes" },
    ]), `prospects-${stamp}.csv`);
  }
  const pdf = buildPdf({ title: "Prospects report", subtitle: `${rows.length} prospects`, meta, table: {
    columns: [{ label: "Name", width: 120 }, { label: "Phone", width: 90 }, { label: "Locality", width: 110 }, { label: "Budget", width: 95 }, { label: "Interest", width: 50 }, { label: "Tags", width: 90 }, { label: "Opt-in", width: 40 }, { label: "Status", width: 75 }, { label: "Assigned", width: 100 }],
    rows: (rows as ProspectRow[]).map((r) => [r.name, r.phone, r.locality ?? "", r.budget ?? "", r.interest ?? "", (r.tags ?? []).join(", "), r.whatsapp_opt_in ? "Yes" : "No", r.status, r.assigned_name ?? "Unassigned"]),
  } });
  return pdfResponse(pdf, `prospects-${stamp}.pdf`);
}
