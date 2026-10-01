import "server-only";
import { q } from "@/lib/db";

export interface Range { from: string; to: string }

export function defaultRange(sp: Record<string, string | undefined>): Range {
  const ok = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
  const today = new Date();
  const back = new Date(); back.setDate(today.getDate() - 30);
  return { from: ok(sp.from) ?? back.toISOString().slice(0, 10), to: ok(sp.to) ?? today.toISOString().slice(0, 10) };
}

const inRange = (col: string) => `${col} >= $1::date AND ${col} < ($2::date + interval '1 day')`;

export const leadsBySource = (r: Range) => q<{ label: string; value: number }>(`SELECT source AS label, count(*)::int AS value FROM leads WHERE ${inRange("created_at")} GROUP BY source ORDER BY value DESC`, [r.from, r.to]);
export const leadsByStatus = (r: Range) => q<{ label: string; value: number }>(`SELECT status AS label, count(*)::int AS value FROM leads WHERE ${inRange("created_at")} GROUP BY status ORDER BY value DESC`, [r.from, r.to]);

export async function funnel(r: Range) {
  const row = (await q<{ total: number; contacted: number; visit: number; won: number }>(`SELECT count(*)::int AS total,
    count(*) FILTER (WHERE status IN ('Called','Follow up','Hot lead','Site visit','Closed won'))::int AS contacted,
    count(*) FILTER (WHERE status IN ('Site visit','Closed won'))::int AS visit,
    count(*) FILTER (WHERE status = 'Closed won')::int AS won
    FROM leads WHERE ${inRange("created_at")}`, [r.from, r.to]))[0];
  const total = Number(row?.total ?? 0);
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return [
    { label: "New", value: total, pct: total ? 100 : 0 },
    { label: "Contacted", value: Number(row?.contacted ?? 0), pct: pct(Number(row?.contacted ?? 0)) },
    { label: "Site visit", value: Number(row?.visit ?? 0), pct: pct(Number(row?.visit ?? 0)) },
    { label: "Closed won", value: Number(row?.won ?? 0), pct: pct(Number(row?.won ?? 0)) },
  ];
}

export const employeePerformance = (r: Range) => q<{ id: number; name: string; leads_handled: number; follow_ups: number; sales_count: number; sales_value: string | number }>(`SELECT u.id, u.name,
    (SELECT count(*)::int FROM leads l WHERE l.assigned_to = u.id AND ${inRange("l.created_at")}) AS leads_handled,
    (SELECT count(*)::int FROM lead_activities a WHERE a.user_id = u.id AND a.type = 'follow_up' AND ${inRange("a.created_at")}) AS follow_ups,
    (SELECT count(*)::int FROM sales s WHERE s.employee_id = u.id AND ${inRange("s.sale_date")}) AS sales_count,
    (SELECT COALESCE(sum(s.deal_value),0) FROM sales s WHERE s.employee_id = u.id AND ${inRange("s.sale_date")}) AS sales_value
  FROM users u WHERE u.role = 'employee' ORDER BY u.name`, [r.from, r.to]);

export const localityDemand = (r: Range) => q<{ label: string; leads: number; prospects: number; value: number }>(`SELECT label, sum(leads)::int AS leads, sum(prospects)::int AS prospects, sum(leads + prospects)::int AS value FROM (
    SELECT COALESCE(locality,'Unknown') AS label, count(*)::int AS leads, 0 AS prospects FROM leads WHERE ${inRange("created_at")} GROUP BY locality
    UNION ALL
    SELECT COALESCE(locality,'Unknown') AS label, 0 AS leads, count(*)::int AS prospects FROM prospects WHERE ${inRange("created_at")} GROUP BY locality
  ) x GROUP BY label ORDER BY value DESC, label`, [r.from, r.to]);
