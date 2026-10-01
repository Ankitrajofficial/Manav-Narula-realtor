import "server-only";
import { one, q } from "@/lib/db";
import { pageOf, sortOf } from "@/lib/console";
import { toDateInput } from "@/lib/dates";
import type { TaskItem } from "@/components/console/QuickTasks";

export interface TaskRow {
  [key: string]: unknown;
  id: number; title: string; description: string | null; lead_id: number | null; prospect_id: number | null;
  assigned_to: number | null; created_by: number | null; due_date: Date | string | null; priority: string; status: string;
  created_at: Date; updated_at: Date; assignee_name: string | null; creator_name: string | null;
  linked_name: string | null; linked_kind: "lead" | "prospect" | null; linked_id: number | null; overdue: boolean;
  lead_count: number; prospect_count: number;
}
export interface SheetRecord { [key: string]: unknown; kind: "lead" | "prospect"; id: number; name: string; phone: string; locality: string | null; status: string; interest: string | null; assignee_name: string | null; next_follow_up_at: Date | null }
export interface PickerOption { id: number; name: string; phone: string; locality: string | null; status: string; interest: string | null; assignee_name: string | null; assigned_to: number | null }
export interface TaskComment { id: number; task_id: number; user_id: number | null; body: string; created_at: Date; user_name: string | null }

const SELECT = `SELECT t.*, u.name AS assignee_name, c.name AS creator_name,
  COALESCE(l.name, p.name) AS linked_name,
  CASE WHEN t.lead_id IS NOT NULL THEN 'lead' WHEN t.prospect_id IS NOT NULL THEN 'prospect' ELSE NULL END AS linked_kind,
  COALESCE(t.lead_id, t.prospect_id) AS linked_id,
  (t.due_date IS NOT NULL AND t.due_date < current_date AND t.status <> 'Done') AS overdue,
  (SELECT count(*)::int FROM task_records r WHERE r.task_id = t.id AND r.lead_id IS NOT NULL) AS lead_count,
  (SELECT count(*)::int FROM task_records r WHERE r.task_id = t.id AND r.prospect_id IS NOT NULL) AS prospect_count
  FROM tasks t
  LEFT JOIN users u ON u.id = t.assigned_to
  LEFT JOIN users c ON c.id = t.created_by
  LEFT JOIN leads l ON l.id = t.lead_id
  LEFT JOIN prospects p ON p.id = t.prospect_id`;

const SORTS: Record<string, string> = { title: "t.title", assignee: "u.name", due_date: "t.due_date", priority: "t.priority", status: "t.status", created_at: "t.created_at" };

export interface TaskFilters { q?: string; status?: string; assignee?: string; priority?: string; assignedTo?: number }

function where(f: TaskFilters): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (f.q?.trim()) { params.push(`%${f.q.trim()}%`); conds.push(`(t.title ILIKE $${params.length} OR l.name ILIKE $${params.length} OR p.name ILIKE $${params.length})`); }
  if (f.status) { params.push(f.status); conds.push(`t.status = $${params.length}`); }
  if (f.priority) { params.push(f.priority); conds.push(`t.priority = $${params.length}`); }
  if (f.assignee) { params.push(Number(f.assignee)); conds.push(`t.assigned_to = $${params.length}`); }
  if (f.assignedTo) { params.push(f.assignedTo); conds.push(`t.assigned_to = $${params.length}`); }
  return { sql: conds.length ? `WHERE ${conds.join(" AND ")}` : "", params };
}

export async function listTasks(sp: Record<string, string | undefined>, opts: { assignedTo?: number; all?: boolean } = {}) {
  const f: TaskFilters = { q: sp.q, status: sp.status, assignee: sp.assignee, priority: sp.priority, assignedTo: opts.assignedTo };
  const w = where(f);
  const sort = sortOf(sp, SORTS, "created_at");
  const { page, size, offset } = pageOf(sp, 20);
  const orderSql = sp.sort ? sort.sql : "t.status = 'Done' ASC, t.due_date ASC NULLS LAST, t.created_at DESC";
  const countRow = await one<{ n: number }>(`SELECT count(*)::int AS n FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN leads l ON l.id = t.lead_id LEFT JOIN prospects p ON p.id = t.prospect_id ${w.sql}`, w.params);
  const rows = opts.all
    ? await q<TaskRow>(`${SELECT} ${w.sql} ORDER BY ${orderSql}`, w.params)
    : await q<TaskRow>(`${SELECT} ${w.sql} ORDER BY ${orderSql} LIMIT ${size} OFFSET ${offset}`, w.params);
  return { rows, total: Number(countRow?.n ?? 0), page, size, sortKey: sort.key, sortDir: sort.dir };
}

export const getTask = (id: number) => one<TaskRow>(`${SELECT} WHERE t.id = $1`, [id]);
export const listTaskComments = (taskId: number) => q<TaskComment>("SELECT tc.*, u.name AS user_name FROM task_comments tc LEFT JOIN users u ON u.id = tc.user_id WHERE tc.task_id = $1 ORDER BY tc.created_at", [taskId]);
export const leadOptions = (assignedTo?: number) => q<{ id: number; name: string; phone: string }>(`SELECT id, name, phone FROM leads ${assignedTo ? "WHERE assigned_to = $1 OR created_by = $1" : ""} ORDER BY name`, assignedTo ? [assignedTo] : []);
export const prospectOptions = (assignedTo?: number) => q<{ id: number; name: string; phone: string }>(`SELECT id, name, phone FROM prospects ${assignedTo ? "WHERE assigned_to = $1 OR added_by = $1" : ""} ORDER BY name`, assignedTo ? [assignedTo] : []);

/** Every lead and prospect attached to a task: the employee's call sheet. */
export async function listTaskRecords(taskId: number): Promise<SheetRecord[]> {
  const leads = await q<SheetRecord>(`SELECT 'lead' AS kind, l.id, l.name, l.phone, l.locality, l.status, l.interest, u.name AS assignee_name, l.next_follow_up_at FROM task_records r JOIN leads l ON l.id = r.lead_id LEFT JOIN users u ON u.id = l.assigned_to WHERE r.task_id = $1 ORDER BY l.name`, [taskId]);
  const prospects = await q<SheetRecord>(`SELECT 'prospect' AS kind, p.id, p.name, p.phone, p.locality, p.status, p.interest, u.name AS assignee_name, p.next_follow_up_at FROM task_records r JOIN prospects p ON p.id = r.prospect_id LEFT JOIN users u ON u.id = p.assigned_to WHERE r.task_id = $1 ORDER BY p.name`, [taskId]);
  return [...leads, ...prospects];
}

/** Options for the call-sheet picker on the task form. */
export const leadPickerOptions = () => q<PickerOption>("SELECT l.id, l.name, l.phone, l.locality, l.status, l.interest, l.assigned_to, u.name AS assignee_name FROM leads l LEFT JOIN users u ON u.id = l.assigned_to ORDER BY l.created_at DESC");
export const prospectPickerOptions = () => q<PickerOption>("SELECT p.id, p.name, p.phone, p.locality, p.status, p.interest, p.assigned_to, u.name AS assignee_name FROM prospects p LEFT JOIN users u ON u.id = p.assigned_to ORDER BY p.created_at DESC");

/** Replace the records attached to a task. */
export async function setTaskRecords(taskId: number, leadIds: number[], prospectIds: number[]) {
  await q("DELETE FROM task_records WHERE task_id = $1", [taskId]);
  for (const id of leadIds) await q("INSERT INTO task_records (task_id, lead_id) VALUES ($1, $2)", [taskId, id]);
  for (const id of prospectIds) await q("INSERT INTO task_records (task_id, prospect_id) VALUES ($1, $2)", [taskId, id]);
  await q("UPDATE tasks SET lead_id = $1, prospect_id = $2 WHERE id = $3", [leadIds[0] ?? null, prospectIds[0] ?? null, taskId]);
}

export function linkedSummary(t: TaskRow): string | null {
  const parts: string[] = [];
  if (t.lead_count) parts.push(`${t.lead_count} ${t.lead_count === 1 ? "lead" : "leads"}`);
  if (t.prospect_count) parts.push(`${t.prospect_count} ${t.prospect_count === 1 ? "prospect" : "prospects"}`);
  return parts.length ? parts.join(" · ") : null;
}

/** Shape the task list rows for the tick-box list. */
export const toTaskItem = (t: TaskRow, base: string): TaskItem => ({
  id: t.id, title: t.title, assigned_to: t.assigned_to, assignee_name: t.assignee_name, due: toDateInput(t.due_date) || null, priority: t.priority, status: t.status,
  linked: t.lead_count + t.prospect_count === 1 && t.linked_name ? t.linked_name : linkedSummary(t), href: `${base}/tasks/${t.id}`,
});
