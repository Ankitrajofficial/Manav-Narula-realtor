import "server-only";
import { q } from "./db";

/** One lead as sent to CRM_WEBHOOK_URL (e.g. the Google Sheet in the client's Drive). */
export interface WebhookLead {
  id: number; created_at: string; name: string; phone: string; email: string | null; interest: string | null; budget: string | null;
  locality: string | null; property: string | null; project: string | null; source: string | null; status: string | null; notes: string | null;
  assigned_to: string | null; added_by: string | null;
}

/**
 * Sends new leads to CRM_WEBHOOK_URL as `{ "leads": [...] }`, one request per batch (a CSV import is a single request).
 * Website enquiries, leads added in the console and CSV imports all come through here. A failed or slow webhook
 * never blocks or breaks saving the lead: it is logged and the lead stays in the database.
 */
export async function forwardLeads(ids: number[]): Promise<void> {
  const url = process.env.CRM_WEBHOOK_URL?.trim();
  if (!url || !ids.length) return;
  try {
    const leads = await q<WebhookLead>(
      `SELECT l.id, l.created_at, l.name, l.phone, l.email, l.interest, l.budget, l.locality, p.title AS property, j.name AS project,
              l.source, l.status, l.notes, a.name AS assigned_to, c.name AS added_by
         FROM leads l
         LEFT JOIN properties p ON p.id = l.property_id
         LEFT JOIN projects j ON j.id = l.project_id
         LEFT JOIN users a ON a.id = l.assigned_to
         LEFT JOIN users c ON c.id = l.created_by
        WHERE l.id = ANY($1::int[]) ORDER BY l.id`,
      [ids],
    );
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) console.error("[lead] webhook answered", res.status, "for leads", ids.join(","));
  } catch (e) {
    console.error("[lead] webhook failed for leads", ids.join(","), e);
  }
}
