import "server-only";
import { one, q } from "@/lib/db";

const n = async (sql: string, params: unknown[] = []) => Number((await one<{ n: number | string }>(sql, params))?.n ?? 0);
const OPEN = "status NOT IN ('Closed won','Closed lost')";

export async function adminStats() {
  const [leadsToday, leadsWeek, hot, followUpsToday, siteVisitsWeek, salesMonth] = await Promise.all([
    n("SELECT count(*)::int AS n FROM leads WHERE created_at >= date_trunc('day', now())"),
    n("SELECT count(*)::int AS n FROM leads WHERE created_at >= date_trunc('week', now())"),
    n(`SELECT count(*)::int AS n FROM leads WHERE status = 'Hot lead'`),
    n(`SELECT count(*)::int AS n FROM leads WHERE ${OPEN} AND next_follow_up_at >= date_trunc('day', now()) AND next_follow_up_at < date_trunc('day', now()) + interval '1 day'`),
    n("SELECT count(DISTINCT lead_id)::int AS n FROM lead_activities WHERE to_status = 'Site visit' AND created_at >= date_trunc('week', now())"),
    n("SELECT coalesce(sum(deal_value),0)::bigint AS n FROM sales WHERE sale_date >= date_trunc('month', now())::date"),
  ]);
  return { leadsToday, leadsWeek, hot, followUpsToday, siteVisitsWeek, salesMonth };
}

export async function leadsPerDay(days = 30) {
  const rows = await q<{ d: string; n: number }>(`SELECT to_char(created_at::date, 'YYYY-MM-DD') AS d, count(*)::int AS n FROM leads WHERE created_at >= date_trunc('day', now()) - ($1::int - 1) * interval '1 day' GROUP BY 1`, [days]);
  const map = new Map(rows.map((r) => [r.d, Number(r.n)]));
  const out: { x: string; y: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ x: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), y: map.get(key) ?? 0 });
  }
  return out;
}

export async function leadsBySource() {
  const rows = await q<{ source: string; n: number }>("SELECT source, count(*)::int AS n FROM leads GROUP BY source ORDER BY n DESC");
  return rows.map((r) => ({ label: r.source, value: Number(r.n) }));
}

export function latestLeads(limit = 10) {
  return q<{ id: number; name: string; phone: string; source: string; status: string; assigned_name: string | null; created_at: Date }>("SELECT l.id, l.name, l.phone, l.source, l.status, u.name AS assigned_name, l.created_at FROM leads l LEFT JOIN users u ON u.id = l.assigned_to ORDER BY l.created_at DESC LIMIT $1", [limit]);
}

export function employeeWorkload() {
  return q<{ id: number; name: string; open_leads: number; open_prospects: number }>(`SELECT u.id, u.name,
    (SELECT count(*)::int FROM leads l WHERE l.assigned_to = u.id AND l.${OPEN}) AS open_leads,
    (SELECT count(*)::int FROM prospects p WHERE p.assigned_to = u.id AND p.${OPEN}) AS open_prospects
    FROM users u WHERE u.status = 'active' ORDER BY open_leads DESC, u.name`);
}

export interface FollowUpRow { kind: "lead" | "prospect"; id: number; name: string; phone: string; status: string; next_follow_up_at: Date; assigned_name: string | null }
export function overdueFollowUps(userId?: number, limit = 10) {
  const mine = userId ? `AND x.assigned_to = ${Number(userId)}` : "";
  return q<FollowUpRow>(`SELECT * FROM (
    SELECT 'lead' AS kind, l.id, l.name, l.phone, l.status, l.next_follow_up_at, u.name AS assigned_name, l.assigned_to FROM leads l LEFT JOIN users u ON u.id = l.assigned_to WHERE l.${OPEN} AND l.next_follow_up_at < now()
    UNION ALL
    SELECT 'prospect', p.id, p.name, p.phone, p.status, p.next_follow_up_at, u.name, p.assigned_to FROM prospects p LEFT JOIN users u ON u.id = p.assigned_to WHERE p.${OPEN} AND p.next_follow_up_at < now()
  ) x WHERE true ${mine} ORDER BY x.next_follow_up_at LIMIT ${Number(limit)}`);
}

export function todaysFollowUps(userId: number) {
  return q<FollowUpRow>(`SELECT * FROM (
    SELECT 'lead' AS kind, l.id, l.name, l.phone, l.status, l.next_follow_up_at, NULL::text AS assigned_name, l.assigned_to FROM leads l WHERE l.${OPEN} AND l.next_follow_up_at < date_trunc('day', now()) + interval '1 day'
    UNION ALL
    SELECT 'prospect', p.id, p.name, p.phone, p.status, p.next_follow_up_at, NULL::text, p.assigned_to FROM prospects p WHERE p.${OPEN} AND p.next_follow_up_at < date_trunc('day', now()) + interval '1 day'
  ) x WHERE x.assigned_to = $1 ORDER BY x.next_follow_up_at`, [userId]);
}

export async function employeeStats(userId: number) {
  const [assigned, followUpsToday, hot, salesMonth] = await Promise.all([
    n(`SELECT count(*)::int AS n FROM leads WHERE assigned_to = $1 AND ${OPEN}`, [userId]),
    n(`SELECT (SELECT count(*) FROM leads WHERE assigned_to = $1 AND ${OPEN} AND next_follow_up_at < date_trunc('day', now()) + interval '1 day') + (SELECT count(*) FROM prospects WHERE assigned_to = $1 AND ${OPEN} AND next_follow_up_at < date_trunc('day', now()) + interval '1 day') AS n`, [userId]),
    n("SELECT (SELECT count(*) FROM leads WHERE assigned_to = $1 AND status = 'Hot lead') + (SELECT count(*) FROM prospects WHERE assigned_to = $1 AND status = 'Hot lead') AS n", [userId]),
    n("SELECT coalesce(sum(deal_value),0)::bigint AS n FROM sales WHERE employee_id = $1 AND sale_date >= date_trunc('month', now())::date", [userId]),
  ]);
  return { assigned, followUpsToday, hot, salesMonth };
}

export function tasksDueThisWeek(userId: number) {
  return q<{ id: number; title: string; due_date: Date | null; priority: string; status: string }>("SELECT id, title, due_date, priority, status FROM tasks WHERE assigned_to = $1 AND status <> 'Done' AND (due_date IS NULL OR due_date < (date_trunc('week', now()) + interval '7 days')::date) ORDER BY due_date NULLS LAST, priority", [userId]);
}
