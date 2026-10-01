import "server-only";
import { json, q } from "./db";

/** Every status change, note, call, follow-up and assignment writes one activity row. */
export async function logActivity(a: { leadId?: number | null; prospectId?: number | null; userId: number | null; type: "created" | "note" | "status" | "call" | "follow_up" | "assign" | "sale" | "whatsapp"; body?: string; fromStatus?: string | null; toStatus?: string | null; scheduledAt?: string | Date | null }) {
  await q("INSERT INTO lead_activities (lead_id, prospect_id, user_id, type, body, from_status, to_status, scheduled_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [a.leadId ?? null, a.prospectId ?? null, a.userId, a.type, a.body ?? null, a.fromStatus ?? null, a.toStatus ?? null, a.scheduledAt ?? null]);
  if (a.leadId) await q("UPDATE leads SET last_activity_at = now(), updated_at = now() WHERE id = $1", [a.leadId]);
  if (a.prospectId) await q("UPDATE prospects SET updated_at = now() WHERE id = $1", [a.prospectId]);
}

export async function audit(userId: number | null, action: string, entity: string, entityId?: string | number | null, details?: unknown) {
  await q("INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES ($1,$2,$3,$4,$5::jsonb)", [userId, action, entity, entityId == null ? null : String(entityId), json(details ?? null)]);
}

/** Normalise an Indian mobile number to E.164 (+91XXXXXXXXXX). Returns null when it is not a valid 10-digit mobile. */
export function toE164(input: string): string | null {
  const digits = String(input ?? "").replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? `+91${ten}` : null;
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
