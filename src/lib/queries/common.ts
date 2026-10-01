import "server-only";
import { one, q } from "@/lib/db";
import { LOCALITY_ORDER, type LocalityOption } from "@/lib/localities";

export interface UserRow { id: number; name: string; email: string; phone: string | null; role: string; status: string; last_login_at: Date | null; created_at: Date }

export const listEmployees = (activeOnly = true) => q<UserRow>(`SELECT id, name, email, phone, role, status, last_login_at, created_at FROM users ${activeOnly ? "WHERE status = 'active'" : ""} ORDER BY role, name`);
/** Active locality names, grouped by zone order. */
export const listLocalities = async () => (await q<{ name: string }>(`SELECT l.name FROM localities l WHERE l.is_active ORDER BY ${LOCALITY_ORDER}`)).map((r) => r.name);
/** Active localities with their zone, for the searchable zone-grouped selects. */
export const listLocalityOptions = () => q<LocalityOption>(`SELECT l.name, l.zone FROM localities l WHERE l.is_active ORDER BY ${LOCALITY_ORDER}`);
export const listTags = async () => (await q<{ name: string }>("SELECT name FROM tags ORDER BY name")).map((r) => r.name);
export const listSources = async () => (await q<{ name: string }>("SELECT name FROM lead_sources ORDER BY name")).map((r) => r.name);
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await one<{ value: T }>("SELECT value FROM settings WHERE key = $1", [key]);
  return (row?.value as T) ?? fallback;
}
export const propertyOptions = () => q<{ id: number; title: string; locality: string | null }>("SELECT id, title, locality FROM properties ORDER BY title");
export const projectOptions = () => q<{ id: number; name: string }>("SELECT id, name FROM projects ORDER BY name");

/** Bell count: follow-ups due today or overdue, plus unassigned new leads (admin only). */
export async function notificationCount(userId: number, role: string): Promise<number> {
  const mine = role === "admin" ? "" : `AND assigned_to = ${Number(userId)}`;
  const a = await one<{ n: number }>(`SELECT count(*)::int AS n FROM leads WHERE next_follow_up_at <= (date_trunc('day', now()) + interval '1 day') AND status NOT IN ('Closed won','Closed lost') ${mine}`);
  const b = await one<{ n: number }>(`SELECT count(*)::int AS n FROM prospects WHERE next_follow_up_at <= (date_trunc('day', now()) + interval '1 day') AND status NOT IN ('Closed won','Closed lost') ${mine}`);
  const c = role === "admin" ? await one<{ n: number }>("SELECT count(*)::int AS n FROM leads WHERE assigned_to IS NULL AND status = 'New'") : { n: 0 };
  return Number(a?.n ?? 0) + Number(b?.n ?? 0) + Number(c?.n ?? 0);
}

export interface Notification { kind: string; title: string; detail: string; href: string; at: Date | null }
export async function listNotifications(userId: number, role: string): Promise<Notification[]> {
  const mine = role === "admin" ? "" : `AND l.assigned_to = ${Number(userId)}`;
  const base = role === "admin" ? "/admin" : "/employee";
  const leads = await q<{ id: number; name: string; next_follow_up_at: Date }>(`SELECT l.id, l.name, l.next_follow_up_at FROM leads l WHERE l.next_follow_up_at <= (date_trunc('day', now()) + interval '1 day') AND l.status NOT IN ('Closed won','Closed lost') ${mine} ORDER BY l.next_follow_up_at`);
  const prospects = await q<{ id: number; name: string; next_follow_up_at: Date }>(`SELECT l.id, l.name, l.next_follow_up_at FROM prospects l WHERE l.next_follow_up_at <= (date_trunc('day', now()) + interval '1 day') AND l.status NOT IN ('Closed won','Closed lost') ${mine} ORDER BY l.next_follow_up_at`);
  const out: Notification[] = [
    ...leads.map((l) => ({ kind: "Follow-up", title: l.name, detail: "Lead follow-up due", href: `${base}/leads/${l.id}`, at: l.next_follow_up_at })),
    ...prospects.map((l) => ({ kind: "Follow-up", title: l.name, detail: "Prospect follow-up due", href: `${base}/prospects/${l.id}`, at: l.next_follow_up_at })),
  ];
  if (role === "admin") {
    const fresh = await q<{ id: number; name: string; created_at: Date; source: string }>("SELECT id, name, created_at, source FROM leads WHERE assigned_to IS NULL AND status = 'New' ORDER BY created_at DESC");
    out.push(...fresh.map((l) => ({ kind: "New lead", title: l.name, detail: `Unassigned, from ${l.source}`, href: `/admin/leads/${l.id}`, at: l.created_at })));
  }
  return out;
}

export interface SearchHit { kind: "Lead" | "Prospect" | "Property" | "Project"; id: number; title: string; detail: string; href: string }
export async function globalSearch(term: string, userId: number, role: string): Promise<SearchHit[]> {
  const t = `%${term.trim()}%`;
  if (!term.trim()) return [];
  const mine = role === "admin" ? "" : `AND (assigned_to = ${Number(userId)} OR created_by = ${Number(userId)})`;
  const mineP = role === "admin" ? "" : `AND (assigned_to = ${Number(userId)} OR added_by = ${Number(userId)})`;
  const base = role === "admin" ? "/admin" : "/employee";
  const leads = await q<{ id: number; name: string; phone: string; status: string }>(`SELECT id, name, phone, status FROM leads WHERE (name ILIKE $1 OR phone ILIKE $1) ${mine} ORDER BY created_at DESC LIMIT 10`, [t]);
  const prospects = await q<{ id: number; name: string; phone: string; status: string }>(`SELECT id, name, phone, status FROM prospects WHERE (name ILIKE $1 OR phone ILIKE $1) ${mineP} ORDER BY created_at DESC LIMIT 10`, [t]);
  const out: SearchHit[] = [
    ...leads.map((l) => ({ kind: "Lead" as const, id: l.id, title: l.name, detail: `${l.phone} · ${l.status}`, href: `${base}/leads/${l.id}` })),
    ...prospects.map((l) => ({ kind: "Prospect" as const, id: l.id, title: l.name, detail: `${l.phone} · ${l.status}`, href: `${base}/prospects/${l.id}` })),
  ];
  if (role === "admin") {
    const props = await q<{ id: number; title: string; locality: string | null }>("SELECT id, title, locality FROM properties WHERE title ILIKE $1 OR locality ILIKE $1 ORDER BY updated_at DESC LIMIT 10", [t]);
    const projs = await q<{ id: number; name: string; locality: string | null }>("SELECT id, name, locality FROM projects WHERE name ILIKE $1 OR locality ILIKE $1 LIMIT 10", [t]);
    out.push(...props.map((p) => ({ kind: "Property" as const, id: p.id, title: p.title, detail: p.locality ?? "", href: `/admin/properties/${p.id}` })));
    out.push(...projs.map((p) => ({ kind: "Project" as const, id: p.id, title: p.name, detail: p.locality ?? "", href: `/admin/projects/${p.id}` })));
  }
  return out;
}
