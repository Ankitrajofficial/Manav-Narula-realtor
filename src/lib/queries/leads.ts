import "server-only";
import { one, q } from "@/lib/db";
import { dateRange, pageOf, sortOf } from "@/lib/console";

export interface LeadRow {
  id: number; name: string; phone: string; email: string | null; interest: string | null; budget: string | null; locality: string | null;
  property_id: number | null; project_id: number | null; source: string; status: string; assigned_to: number | null; created_by: number | null;
  notes: string | null; tags: string[]; whatsapp_opt_in: boolean; next_follow_up_at: Date | null; last_activity_at: Date; created_at: Date; updated_at: Date;
  assigned_name: string | null; created_by_name: string | null; assigned_by_name: string | null; property_title: string | null; property_slug: string | null; project_name: string | null; project_slug: string | null;
}

export interface Scope { userId?: number }
export type SP = Record<string, string | undefined>;

const SORTS: Record<string, string> = { name: "l.name", phone: "l.phone", source: "l.source", interest: "l.interest", locality: "l.locality", status: "l.status", assigned: "u.name", created: "l.created_at", activity: "l.last_activity_at", follow_up: "l.next_follow_up_at" };

const SELECT = `SELECT l.*, u.name AS assigned_name, c.name AS created_by_name,
  (SELECT ab.name FROM lead_activities a JOIN users ab ON ab.id = a.user_id WHERE a.lead_id = l.id AND a.type = 'assign' ORDER BY a.created_at DESC, a.id DESC LIMIT 1) AS assigned_by_name, p.title AS property_title, p.slug AS property_slug, pr.name AS project_name, pr.slug AS project_slug
FROM leads l LEFT JOIN users u ON u.id = l.assigned_to LEFT JOIN users c ON c.id = l.created_by LEFT JOIN properties p ON p.id = l.property_id LEFT JOIN projects pr ON pr.id = l.project_id`;

/** Builds the WHERE clause for the list, export and PDF from URL params. `meta` describes applied filters for reports. */
export function leadFilters(sp: SP, scope: Scope = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  const meta: string[] = [];
  const add = (sql: string, v: unknown) => { params.push(v); where.push(sql.replace("?", `$${params.length}`)); };
  if (scope.userId) { params.push(scope.userId); where.push(`(l.assigned_to = $${params.length} OR l.created_by = $${params.length})`); }
  if (sp.q?.trim()) { add("(l.name ILIKE ? OR l.phone ILIKE ? OR l.email ILIKE ?)", `%${sp.q.trim()}%`); where[where.length - 1] = where[where.length - 1].replace(/\?/g, `$${params.length}`); meta.push(`search "${sp.q.trim()}"`); }
  if (sp.status) { add("l.status = ?", sp.status); meta.push(`status ${sp.status}`); }
  if (sp.source) { add("l.source = ?", sp.source); meta.push(`source ${sp.source}`); }
  if (sp.link && /^\d+$/.test(sp.link)) { add("l.link_id = ?", Number(sp.link)); meta.push(`ad link #${sp.link}`); }
  if (sp.interest) { add("l.interest = ?", sp.interest); meta.push(`interest ${sp.interest}`); }
  if (sp.locality) { add("l.locality = ?", sp.locality); meta.push(`locality ${sp.locality}`); }
  if (sp.assigned === "unassigned") { where.push("l.assigned_to IS NULL"); meta.push("unassigned"); }
  else if (sp.assigned && /^\d+$/.test(sp.assigned)) { add("l.assigned_to = ?", Number(sp.assigned)); meta.push(`assigned #${sp.assigned}`); }
  const { from, to } = dateRange(sp);
  if (from) { add("l.created_at >= ?::date", from); meta.push(`from ${from}`); }
  if (to) { add("l.created_at < (?::date + interval '1 day')", to); meta.push(`to ${to}`); }
  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", params, meta };
}

export async function listLeads(sp: SP, scope: Scope = {}, pageSize = 20) {
  const { where, params, meta } = leadFilters(sp, scope);
  const sort = sortOf(sp, SORTS, "created");
  const { page, size, offset } = pageOf(sp, pageSize);
  // Count and page rows in parallel: one round trip to the database instead of two.
  const [countRow, rows] = await Promise.all([one<{ n: number }>(`SELECT count(*)::int AS n FROM leads l LEFT JOIN users u ON u.id = l.assigned_to ${where}`, params), q<LeadRow>(`${SELECT} ${where} ORDER BY ${sort.sql} LIMIT ${size} OFFSET ${offset}`, params)]);
  const total = Number(countRow?.n ?? 0);
  return { rows, total, page, size, sort, meta };
}

export async function allLeads(sp: SP, scope: Scope = {}, limit = 5000) {
  const { where, params, meta } = leadFilters(sp, scope);
  const sort = sortOf(sp, SORTS, "created");
  return { rows: await q<LeadRow>(`${SELECT} ${where} ORDER BY ${sort.sql} LIMIT ${limit}`, params), meta };
}

export async function getLead(id: number, scope: Scope = {}): Promise<LeadRow | null> {
  const params: unknown[] = [id];
  let where = "WHERE l.id = $1";
  if (scope.userId) { params.push(scope.userId); where += ` AND (l.assigned_to = $2 OR l.created_by = $2)`; }
  return one<LeadRow>(`${SELECT} ${where}`, params);
}

export interface ActivityRow { id: number; type: string; body: string | null; from_status: string | null; to_status: string | null; scheduled_at: Date | null; created_at: Date; user_name: string | null }
export function leadActivities(id: number) {
  return q<ActivityRow>("SELECT a.id, a.type, a.body, a.from_status, a.to_status, a.scheduled_at, a.created_at, u.name AS user_name FROM lead_activities a LEFT JOIN users u ON u.id = a.user_id WHERE a.lead_id = $1 ORDER BY a.created_at DESC, a.id DESC", [id]);
}
