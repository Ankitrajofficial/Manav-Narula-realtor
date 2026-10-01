import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { csvResponse, toCsv } from "@/lib/csv";
import { defaultRange } from "@/lib/queries/reports";
import { formatDateTime, formatShortDate } from "@/lib/format";

type R = Record<string, unknown>;
const d = (v: unknown) => (v ? formatShortDate(v as string) : "");
const dt = (v: unknown) => (v ? formatDateTime(v as string) : "");
const tags = (v: unknown) => (Array.isArray(v) ? v.join("; ") : "");

/** Every query is scoped to the signed-in employee; the type parameter only picks which of their records to export. */
export async function GET(req: Request) {
  const user = await requireUser("employee");
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const range = defaultRange(sp);
  const p = [user.id, range.from, range.to];
  const inR = (col: string) => `${col} >= $2::date AND ${col} < ($3::date + interval '1 day')`;
  const stamp = `${range.from}-to-${range.to}`;
  let csv = "", name = "";
  switch (sp.type) {
    case "prospects": {
      const rows = await q<R>(`SELECT p.name, p.phone, p.email, p.locality, p.budget, p.interest, p.source, p.tags, p.status, p.whatsapp_opt_in, u.name AS added_by, p.last_contacted_at, p.next_follow_up_at, p.created_at FROM prospects p LEFT JOIN users u ON u.id = p.added_by WHERE (p.assigned_to = $1 OR p.added_by = $1) AND ${inR("p.created_at")} ORDER BY p.created_at DESC`, p);
      csv = toCsv(rows, [{ key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" }, { key: "locality", label: "Locality" }, { key: "budget", label: "Budget" }, { key: "interest", label: "Interest" }, { key: "source", label: "Source" }, { key: "tags", label: "Tags", value: (r) => tags(r.tags) }, { key: "status", label: "Status" }, { key: "whatsapp_opt_in", label: "WhatsApp opt-in", value: (r) => (r.whatsapp_opt_in ? "Yes" : "No") }, { key: "added_by", label: "Added by" }, { key: "last_contacted_at", label: "Last contacted", value: (r) => dt(r.last_contacted_at) }, { key: "next_follow_up_at", label: "Next follow-up", value: (r) => dt(r.next_follow_up_at) }, { key: "created_at", label: "Added", value: (r) => d(r.created_at) }]);
      name = "my-prospects"; break;
    }
    case "followups": {
      const rows = await q<R>(`SELECT 'Lead' AS kind, l.name, l.phone, a.scheduled_at, a.body, a.created_at FROM lead_activities a JOIN leads l ON l.id = a.lead_id WHERE a.type = 'follow_up' AND a.user_id = $1 AND ${inR("a.created_at")}
        UNION ALL SELECT 'Prospect', pr.name, pr.phone, a.scheduled_at, a.body, a.created_at FROM lead_activities a JOIN prospects pr ON pr.id = a.prospect_id WHERE a.type = 'follow_up' AND a.user_id = $1 AND ${inR("a.created_at")}
        UNION ALL SELECT 'Lead (upcoming)', l.name, l.phone, l.next_follow_up_at, 'Scheduled follow-up', l.updated_at FROM leads l WHERE l.assigned_to = $1 AND l.next_follow_up_at >= now()
        UNION ALL SELECT 'Prospect (upcoming)', pr.name, pr.phone, pr.next_follow_up_at, 'Scheduled follow-up', pr.updated_at FROM prospects pr WHERE pr.assigned_to = $1 AND pr.next_follow_up_at >= now()
        ORDER BY scheduled_at DESC NULLS LAST`, p);
      csv = toCsv(rows, [{ key: "kind", label: "Record" }, { key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "scheduled_at", label: "Scheduled for", value: (r) => dt(r.scheduled_at) }, { key: "body", label: "Note" }, { key: "created_at", label: "Logged", value: (r) => dt(r.created_at) }]);
      name = "my-follow-ups"; break;
    }
    case "sales": {
      const rows = await q<R>(`SELECT s.sale_date, COALESCE(s.client_name, l.name, pr.name) AS client, COALESCE(s.property_title, p.title) AS property, s.deal_value, s.commission, s.status, s.notes FROM sales s LEFT JOIN leads l ON l.id = s.lead_id LEFT JOIN prospects pr ON pr.id = s.prospect_id LEFT JOIN properties p ON p.id = s.property_id WHERE s.employee_id = $1 AND ${inR("s.sale_date")} ORDER BY s.sale_date DESC`, p);
      csv = toCsv(rows, [{ key: "sale_date", label: "Date", value: (r) => d(r.sale_date) }, { key: "client", label: "Client" }, { key: "property", label: "Property" }, { key: "deal_value", label: "Deal value (₹)", value: (r) => Number(r.deal_value) }, { key: "commission", label: "Commission (₹)", value: (r) => Number(r.commission) }, { key: "status", label: "Status" }, { key: "notes", label: "Notes" }]);
      name = "my-sales"; break;
    }
    default: {
      const rows = await q<R>(`SELECT l.name, l.phone, l.email, l.interest, l.budget, l.locality, l.source, l.status, p.title AS property, l.next_follow_up_at, l.last_activity_at, l.created_at FROM leads l LEFT JOIN properties p ON p.id = l.property_id WHERE (l.assigned_to = $1 OR l.created_by = $1) AND ${inR("l.created_at")} ORDER BY l.created_at DESC`, p);
      csv = toCsv(rows, [{ key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" }, { key: "interest", label: "Interest" }, { key: "budget", label: "Budget" }, { key: "locality", label: "Locality" }, { key: "source", label: "Source" }, { key: "status", label: "Status" }, { key: "property", label: "Property" }, { key: "next_follow_up_at", label: "Next follow-up", value: (r) => dt(r.next_follow_up_at) }, { key: "last_activity_at", label: "Last activity", value: (r) => dt(r.last_activity_at) }, { key: "created_at", label: "Created", value: (r) => d(r.created_at) }]);
      name = "my-leads";
    }
  }
  return csvResponse(csv, `${name}-${stamp}.csv`);
}
