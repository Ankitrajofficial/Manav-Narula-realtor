import "server-only";
import { one, q } from "@/lib/db";
import { pageOf, sortOf } from "@/lib/console";

export interface EmployeeRow { [key: string]: unknown; id: number; name: string; email: string; phone: string | null; role: string; status: string; last_login_at: Date | null; created_at: Date; open_leads: number }
const SORT: Record<string, string> = { name: "u.name", email: "u.email", role: "u.role", status: "u.status", last_login_at: "u.last_login_at", open_leads: "open_leads" };
const OPEN = "(SELECT count(*)::int FROM leads l WHERE l.assigned_to = u.id AND l.status NOT IN ('Closed won','Closed lost')) AS open_leads";

export async function listEmployeeRows(sp: Record<string, string | undefined>) {
  const where: string[] = []; const params: unknown[] = [];
  if (sp.q) { params.push(`%${sp.q.trim()}%`); where.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`); }
  if (sp.role) { params.push(sp.role); where.push(`u.role = $${params.length}`); }
  if (sp.status) { params.push(sp.status); where.push(`u.status = $${params.length}`); }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sort = sortOf(sp, SORT, "name");
  const { page, size, offset } = pageOf(sp);
  // Count and page rows in parallel: one round trip to the database instead of two.
  const [countRow, rows] = await Promise.all([one<{ n: number }>(`SELECT count(*)::int AS n FROM users u ${w}`, params), q<EmployeeRow>(`SELECT u.id,u.name,u.email,u.phone,u.role,u.status,u.last_login_at,u.created_at, ${OPEN} FROM users u ${w} ORDER BY ${sort.sql.replace("desc NULLS LAST", "asc NULLS LAST").replace("asc NULLS LAST", sort.dir + " NULLS LAST")} LIMIT ${size} OFFSET ${offset}`, params)]);
  const total = Number(countRow?.n ?? 0);
  return { rows, total, page, size, sort };
}
export const getEmployee = (id: number) => one<EmployeeRow>(`SELECT u.id,u.name,u.email,u.phone,u.role,u.status,u.last_login_at,u.created_at, ${OPEN} FROM users u WHERE u.id = $1`, [id]);
export const emailTaken = async (email: string, excludeId?: number) => !!(await one("SELECT id FROM users WHERE lower(email) = lower($1)" + (excludeId ? ` AND id <> ${Number(excludeId)}` : ""), [email]));

/** Moves every lead, prospect and task from one employee to another, then deletes the user. Activities and audit rows keep their history (user_id set null by FK). */
export async function reassignAndDelete(fromId: number, toId: number) {
  await q("UPDATE leads SET assigned_to = $2, updated_at = now() WHERE assigned_to = $1", [fromId, toId]);
  await q("UPDATE prospects SET assigned_to = $2, updated_at = now() WHERE assigned_to = $1", [fromId, toId]);
  await q("UPDATE tasks SET assigned_to = $2, updated_at = now() WHERE assigned_to = $1", [fromId, toId]);
  await q("UPDATE sales SET employee_id = $2 WHERE employee_id = $1", [fromId, toId]);
  await q("DELETE FROM users WHERE id = $1", [fromId]);
}

export function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `Mn-${s}`;
}
