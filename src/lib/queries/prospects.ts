import "server-only";
import { one, q } from "@/lib/db";
import { dateRange, pageOf, sortOf } from "@/lib/console";
import type { ActivityRow, SP, Scope } from "./leads";

export interface ProspectRow {
  id: number; name: string; phone: string; email: string | null; locality: string | null; budget: string | null; interest: string | null; source: string;
  tags: string[]; status: string; assigned_to: number | null; added_by: number | null; whatsapp_opt_in: boolean; notes: string | null;
  last_contacted_at: Date | null; next_follow_up_at: Date | null; created_at: Date; updated_at: Date;
  assigned_name: string | null; added_by_name: string | null; assigned_by_name: string | null;
}

const SORTS: Record<string, string> = { name: "p.name", phone: "p.phone", locality: "p.locality", budget: "p.budget", interest: "p.interest", status: "p.status", assigned: "u.name", added_by: "a.name", contacted: "p.last_contacted_at", created: "p.created_at" };
const SELECT = "SELECT p.*, u.name AS assigned_name, a.name AS added_by_name, (SELECT ab.name FROM lead_activities x JOIN users ab ON ab.id = x.user_id WHERE x.prospect_id = p.id AND x.type = 'assign' ORDER BY x.created_at DESC, x.id DESC LIMIT 1) AS assigned_by_name FROM prospects p LEFT JOIN users u ON u.id = p.assigned_to LEFT JOIN users a ON a.id = p.added_by";

export function prospectFilters(sp: SP, scope: Scope = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  const meta: string[] = [];
  const add = (sql: string, v: unknown) => { params.push(v); where.push(sql.replace(/\?/g, `$${params.length}`)); };
  if (scope.userId) { params.push(scope.userId); where.push(`(p.assigned_to = $${params.length} OR p.added_by = $${params.length})`); }
  if (sp.q?.trim()) { add("(p.name ILIKE ? OR p.phone ILIKE ? OR p.email ILIKE ?)", `%${sp.q.trim()}%`); meta.push(`search "${sp.q.trim()}"`); }
  if (sp.status) { add("p.status = ?", sp.status); meta.push(`status ${sp.status}`); }
  if (sp.interest) { add("p.interest = ?", sp.interest); meta.push(`interest ${sp.interest}`); }
  if (sp.locality) { add("p.locality = ?", sp.locality); meta.push(`locality ${sp.locality}`); }
  if (sp.tag) { add("p.tags @> ?::jsonb", JSON.stringify([sp.tag])); meta.push(`tag ${sp.tag}`); }
  if (sp.optin === "yes") { where.push("p.whatsapp_opt_in = true"); meta.push("WhatsApp opt-in"); }
  else if (sp.optin === "no") { where.push("p.whatsapp_opt_in = false"); meta.push("no WhatsApp opt-in"); }
  if (sp.assigned === "unassigned") { where.push("p.assigned_to IS NULL"); meta.push("unassigned"); }
  else if (sp.assigned && /^\d+$/.test(sp.assigned)) { add("p.assigned_to = ?", Number(sp.assigned)); meta.push(`assigned #${sp.assigned}`); }
  if (sp.added_by && /^\d+$/.test(sp.added_by)) { add("p.added_by = ?", Number(sp.added_by)); meta.push(`added by #${sp.added_by}`); }
  const { from, to } = dateRange(sp);
  if (from) { add("p.created_at >= ?::date", from); meta.push(`from ${from}`); }
  if (to) { add("p.created_at < (?::date + interval '1 day')", to); meta.push(`to ${to}`); }
  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", params, meta };
}

export async function listProspects(sp: SP, scope: Scope = {}, pageSize = 20) {
  const { where, params, meta } = prospectFilters(sp, scope);
  const sort = sortOf(sp, SORTS, "created");
  const { page, size, offset } = pageOf(sp, pageSize);
  // Count and page rows in parallel: one round trip to the database instead of two.
  const [countRow, rows] = await Promise.all([one<{ n: number }>(`SELECT count(*)::int AS n FROM prospects p LEFT JOIN users u ON u.id = p.assigned_to LEFT JOIN users a ON a.id = p.added_by ${where}`, params), q<ProspectRow>(`${SELECT} ${where} ORDER BY ${sort.sql} LIMIT ${size} OFFSET ${offset}`, params)]);
  const total = Number(countRow?.n ?? 0);
  return { rows, total, page, size, sort, meta };
}

export async function allProspects(sp: SP, scope: Scope = {}, limit = 5000) {
  const { where, params, meta } = prospectFilters(sp, scope);
  const sort = sortOf(sp, SORTS, "created");
  return { rows: await q<ProspectRow>(`${SELECT} ${where} ORDER BY ${sort.sql} LIMIT ${limit}`, params), meta };
}

export async function getProspect(id: number, scope: Scope = {}): Promise<ProspectRow | null> {
  const params: unknown[] = [id];
  let where = "WHERE p.id = $1";
  if (scope.userId) { params.push(scope.userId); where += " AND (p.assigned_to = $2 OR p.added_by = $2)"; }
  return one<ProspectRow>(`${SELECT} ${where}`, params);
}

export function prospectActivities(id: number) {
  return q<ActivityRow>("SELECT a.id, a.type, a.body, a.from_status, a.to_status, a.scheduled_at, a.created_at, u.name AS user_name FROM lead_activities a LEFT JOIN users u ON u.id = a.user_id WHERE a.prospect_id = $1 ORDER BY a.created_at DESC, a.id DESC", [id]);
}
