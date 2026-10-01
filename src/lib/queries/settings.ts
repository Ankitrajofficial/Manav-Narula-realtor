import "server-only";
import { json, one, q } from "@/lib/db";
import { pageOf } from "@/lib/console";

export interface Business { name: string; tagline: string; phone: string; whatsapp: string; email: string; address: string; hours: string; rera: string; rating: number; reviews: number; instagram: string; facebook: string; youtube: string }
export const DEFAULT_BUSINESS: Business = { name: "Manav Narula Realtor", tagline: "", phone: "", whatsapp: "", email: "", address: "", hours: "", rera: "", rating: 4.8, reviews: 21, instagram: "", facebook: "", youtube: "" };

export async function getSettingValue<T>(key: string, fallback: T): Promise<T> {
  const row = await one<{ value: T }>("SELECT value FROM settings WHERE key = $1", [key]);
  return (row?.value as T) ?? fallback;
}
export async function setSetting(key: string, value: unknown) {
  await q("INSERT INTO settings (key, value, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()", [key, json(value)]);
}

export const listLocalityRows = () => q<{ id: number; name: string; sort_order: number }>("SELECT * FROM localities ORDER BY sort_order, name");
export const listTagRows = () => q<{ id: number; name: string }>("SELECT * FROM tags ORDER BY name");
export const listSourceRows = () => q<{ id: number; name: string }>("SELECT * FROM lead_sources ORDER BY name");

export interface AuditRow { [key: string]: unknown; id: number; user_id: number | null; user_name: string | null; action: string; entity: string; entity_id: string | null; details: unknown; created_at: Date }
export async function listAudit(sp: Record<string, string | undefined>) {
  const where: string[] = []; const params: unknown[] = [];
  if (sp.q) { params.push(`%${sp.q.trim()}%`); where.push(`(a.action ILIKE $${params.length} OR a.entity ILIKE $${params.length} OR u.name ILIKE $${params.length} OR a.entity_id ILIKE $${params.length})`); }
  if (sp.entity) { params.push(sp.entity); where.push(`a.entity = $${params.length}`); }
  if (sp.from) { params.push(sp.from); where.push(`a.created_at >= $${params.length}::date`); }
  if (sp.to) { params.push(sp.to); where.push(`a.created_at < ($${params.length}::date + interval '1 day')`); }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const { page, size, offset } = pageOf(sp, 30);
  const rows = await q<AuditRow>(`SELECT a.*, u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ${w} ORDER BY a.created_at DESC LIMIT ${size} OFFSET ${offset}`, params);
  const total = Number((await one<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ${w}`, params))?.n ?? 0);
  return { rows, total, page, size };
}
export const allAudit = (sp: Record<string, string | undefined>) => listAudit({ ...sp, page: "1" }).then(async (r) => r.total <= r.size ? r.rows : q<AuditRow>("SELECT a.*, u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 5000"));
export const auditEntities = async () => (await q<{ entity: string }>("SELECT DISTINCT entity FROM audit_log ORDER BY entity")).map((r) => r.entity);
