import "server-only";
import { one, q } from "@/lib/db";

/** Everything the admin's employee profile shows about one person. */

const OPEN = "status NOT IN ('Closed won','Closed lost')";
const num = async (sql: string, params: unknown[]) => Number((await one<{ n: number | string }>(sql, params))?.n ?? 0);

export async function profileStats(userId: number) {
  const p = [userId];
  const [openLeads, openProspects, hot, followUpsDue, openTasks, overdueTasks, doneTasks30, won, lost, activities30] = await Promise.all([
    num(`SELECT count(*)::int AS n FROM leads WHERE assigned_to = $1 AND ${OPEN}`, p),
    num(`SELECT count(*)::int AS n FROM prospects WHERE assigned_to = $1 AND ${OPEN}`, p),
    num("SELECT (SELECT count(*) FROM leads WHERE assigned_to = $1 AND status = 'Hot lead') + (SELECT count(*) FROM prospects WHERE assigned_to = $1 AND status = 'Hot lead') AS n", p),
    num(`SELECT (SELECT count(*) FROM leads WHERE assigned_to = $1 AND ${OPEN} AND next_follow_up_at < date_trunc('day', now()) + interval '1 day') + (SELECT count(*) FROM prospects WHERE assigned_to = $1 AND ${OPEN} AND next_follow_up_at < date_trunc('day', now()) + interval '1 day') AS n`, p),
    num("SELECT count(*)::int AS n FROM tasks WHERE assigned_to = $1 AND status <> 'Done'", p),
    num("SELECT count(*)::int AS n FROM tasks WHERE assigned_to = $1 AND status <> 'Done' AND due_date < current_date", p),
    num("SELECT count(*)::int AS n FROM tasks WHERE assigned_to = $1 AND status = 'Done' AND updated_at >= now() - interval '30 days'", p),
    num("SELECT count(*)::int AS n FROM leads WHERE assigned_to = $1 AND status = 'Closed won'", p),
    num("SELECT count(*)::int AS n FROM leads WHERE assigned_to = $1 AND status = 'Closed lost'", p),
    num("SELECT count(*)::int AS n FROM lead_activities WHERE user_id = $1 AND created_at >= now() - interval '30 days'", p),
  ]);
  const sales = await one<{ n: number; value: string | number; commission: string | number; month_value: string | number; month_n: number }>(
    `SELECT count(*)::int AS n, COALESCE(sum(deal_value),0) AS value, COALESCE(sum(commission),0) AS commission,
       COALESCE(sum(deal_value) FILTER (WHERE sale_date >= date_trunc('month', now())::date),0) AS month_value,
       count(*) FILTER (WHERE sale_date >= date_trunc('month', now())::date)::int AS month_n
     FROM sales WHERE employee_id = $1 AND status = 'Approved'`, p);
  const pending = await num("SELECT count(*)::int AS n FROM sales WHERE employee_id = $1 AND status <> 'Approved'", p);
  const closed = won + lost;
  return {
    openLeads, openProspects, hot, followUpsDue, openTasks, overdueTasks, doneTasks30, won, lost, activities30, pendingSales: pending,
    conversion: closed ? Math.round((won / closed) * 100) : null,
    sales: { count: Number(sales?.n ?? 0), value: Number(sales?.value ?? 0), commission: Number(sales?.commission ?? 0), monthValue: Number(sales?.month_value ?? 0), monthCount: Number(sales?.month_n ?? 0) },
  };
}

/** Calls, notes, status changes and follow-ups logged by this person per day, last 30 days. */
export async function activityPerDay(userId: number) {
  const rows = await q<{ d: string; n: number }>(
    `SELECT to_char(g.d, 'DD Mon') AS d, COUNT(a.id)::int AS n
     FROM generate_series(current_date - 29, current_date, interval '1 day') AS g(d)
     LEFT JOIN lead_activities a ON a.user_id = $1 AND a.created_at >= g.d AND a.created_at < g.d + interval '1 day'
     GROUP BY g.d ORDER BY g.d`, [userId]);
  return rows.map((r) => ({ x: r.d, y: Number(r.n) }));
}

export async function leadsByStatus(userId: number) {
  return q<{ status: string; n: number }>("SELECT status, count(*)::int AS n FROM leads WHERE assigned_to = $1 GROUP BY status ORDER BY n DESC", [userId]);
}

export interface ProfileRecord { id: number; name: string; phone: string; status: string; locality: string | null; interest: string | null; next_follow_up_at: Date | null; updated_at: Date; overdue: boolean }
export const assignedLeads = (userId: number, limit = 50) =>
  q<ProfileRecord>(`SELECT id, name, phone, status, locality, interest, next_follow_up_at, updated_at, (next_follow_up_at < now() AND status NOT IN ('Closed won','Closed lost')) AS overdue FROM leads WHERE assigned_to = $1 ORDER BY (status IN ('Closed won','Closed lost')), next_follow_up_at NULLS LAST, updated_at DESC LIMIT ${Number(limit)}`, [userId]);
export const assignedProspects = (userId: number, limit = 50) =>
  q<ProfileRecord>(`SELECT id, name, phone, status, locality, interest, next_follow_up_at, updated_at, (next_follow_up_at < now() AND status NOT IN ('Closed won','Closed lost')) AS overdue FROM prospects WHERE assigned_to = $1 ORDER BY (status IN ('Closed won','Closed lost')), next_follow_up_at NULLS LAST, updated_at DESC LIMIT ${Number(limit)}`, [userId]);
export const countAssigned = async (userId: number) => {
  const [leads, prospects] = await Promise.all([num("SELECT count(*)::int AS n FROM leads WHERE assigned_to = $1", [userId]), num("SELECT count(*)::int AS n FROM prospects WHERE assigned_to = $1", [userId])]);
  return { leads, prospects };
};

/** Unassigned records the admin can hand to this person straight from the profile. */
export const unassignedLeads = (limit = 30) =>
  q<ProfileRecord>(`SELECT id, name, phone, status, locality, interest, next_follow_up_at, updated_at, (next_follow_up_at < now() AND status NOT IN ('Closed won','Closed lost')) AS overdue FROM leads WHERE assigned_to IS NULL AND ${OPEN} ORDER BY created_at DESC LIMIT ${Number(limit)}`);
export const unassignedProspects = (limit = 30) =>
  q<ProfileRecord>(`SELECT id, name, phone, status, locality, interest, next_follow_up_at, updated_at, (next_follow_up_at < now() AND status NOT IN ('Closed won','Closed lost')) AS overdue FROM prospects WHERE assigned_to IS NULL AND ${OPEN} ORDER BY created_at DESC LIMIT ${Number(limit)}`);

export interface ActivityItem { id: number; type: string; body: string | null; created_at: Date; record_kind: "lead" | "prospect" | null; record_id: number | null; record_name: string | null }
export const recentActivity = (userId: number, limit = 40) =>
  q<ActivityItem>(`SELECT a.id, a.type, a.body, a.created_at,
      CASE WHEN a.lead_id IS NOT NULL THEN 'lead' WHEN a.prospect_id IS NOT NULL THEN 'prospect' END AS record_kind,
      COALESCE(a.lead_id, a.prospect_id) AS record_id, COALESCE(l.name, p.name) AS record_name
    FROM lead_activities a LEFT JOIN leads l ON l.id = a.lead_id LEFT JOIN prospects p ON p.id = a.prospect_id
    WHERE a.user_id = $1 ORDER BY a.created_at DESC, a.id DESC LIMIT ${Number(limit)}`, [userId]);

export interface AuditItem { id: number; action: string; entity: string; entity_id: string | null; created_at: Date; actor: string | null }
/** Account events: sign-ins, password changes, and what admins changed on this account. */
export const accountEvents = (userId: number, limit = 20) =>
  q<AuditItem>(`SELECT a.id, a.action, a.entity, a.entity_id, a.created_at, u.name AS actor FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
    WHERE (a.entity = 'user' AND a.entity_id = $1) OR (a.user_id = $2 AND a.action IN ('login','change_password','export_blocked'))
    ORDER BY a.created_at DESC LIMIT ${Number(limit)}`, [String(userId), userId]);
