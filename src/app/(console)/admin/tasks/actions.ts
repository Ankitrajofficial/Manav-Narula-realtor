"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { one, q } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit, logActivity } from "@/lib/records";
import { describeConflicts, linkedOwners, ownedByOthers, setTaskRecords, type LinkedOwner } from "@/lib/queries/tasks";
import { PRIORITIES, TASK_STATUSES } from "@/lib/console";
import { dueFromChip } from "@/lib/dates";

export interface TaskFormState { errors?: Record<string, string>; error?: string }

function parse(fd: FormData) {
  const title = String(fd.get("title") ?? "").trim();
  const idList = (name: string) => Array.from(new Set(fd.getAll(name).map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0)));
  const lead_ids = idList("lead_ids");
  const prospect_ids = idList("prospect_ids");
  const assign_records = fd.get("assign_records") === "1";
  const assigned_to = fd.get("assigned_to") ? Number(fd.get("assigned_to")) : null;
  const due_date = String(fd.get("due_date") ?? "").trim() || null;
  const priority = String(fd.get("priority") ?? "normal");
  const status = String(fd.get("status") ?? "Open");
  const errors: Record<string, string> = {};
  if (title.length < 3) errors.title = "Enter a title of at least 3 characters.";
  if (!assigned_to) errors.assigned_to = "Choose who this task is for.";
  if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) errors.due_date = "Enter a valid date.";
  if (!(PRIORITIES as readonly string[]).includes(priority)) errors.priority = "Choose a priority.";
  if (!(TASK_STATUSES as readonly string[]).includes(status)) errors.status = "Choose a status.";
  if (lead_ids.length + prospect_ids.length > 500) errors.records = "A call sheet can hold up to 500 people.";
  return { title, lead_ids, prospect_ids, assign_records, assigned_to, due_date, priority, status, errors };
}

/** Moves every record on the sheet to the task's employee and logs the assignment on each one. */
async function assignSheet(userId: number, assignedTo: number, leadIds: number[], prospectIds: number[]): Promise<number> {
  const emp = await one<{ name: string }>("SELECT name FROM users WHERE id = $1", [assignedTo]);
  if (!emp) return 0;
  let moved = 0;
  for (const id of leadIds) {
    const r = await q<{ id: number }>("UPDATE leads SET assigned_to = $1, updated_at = now() WHERE id = $2 AND (assigned_to IS DISTINCT FROM $1) RETURNING id", [assignedTo, id]);
    if (r.length) { moved++; await logActivity({ leadId: id, userId, type: "assign", body: `Assigned to ${emp.name} via task` }); }
  }
  for (const id of prospectIds) {
    const r = await q<{ id: number }>("UPDATE prospects SET assigned_to = $1, updated_at = now() WHERE id = $2 AND (assigned_to IS DISTINCT FROM $1) RETURNING id", [assignedTo, id]);
    if (r.length) { moved++; await logActivity({ prospectId: id, userId, type: "assign", body: `Assigned to ${emp.name} via task` }); }
  }
  return moved;
}

/** A lead or prospect has one owner. Without "assign everyone on this sheet", a task cannot include records owned by someone else. */
async function sheetConflictError(t: ReturnType<typeof parse>): Promise<string | null> {
  if (t.assign_records || !t.assigned_to) return null;
  const c = ownedByOthers(await linkedOwners(t.lead_ids, t.prospect_ids), t.assigned_to);
  return c.length ? `Already assigned to someone else: ${describeConflicts(c)}. Tick "Also assign everyone on this sheet" to move them, or take them off the sheet.` : null;
}

export async function createTask(_prev: TaskFormState, fd: FormData): Promise<TaskFormState> {
  const user = await requireUser("admin");
  const t = parse(fd);
  if (Object.keys(t.errors).length) return { errors: t.errors };
  const conflict = await sheetConflictError(t);
  if (conflict) return { errors: { records: conflict } };
  const row = await one<{ id: number }>("INSERT INTO tasks (title, assigned_to, created_by, due_date, priority, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [t.title, t.assigned_to, user.id, t.due_date, t.priority, t.status]);
  await setTaskRecords(row!.id, t.lead_ids, t.prospect_ids);
  const moved = t.assign_records && t.assigned_to ? await assignSheet(user.id, t.assigned_to, t.lead_ids, t.prospect_ids) : 0;
  await audit(user.id, "create", "task", row?.id, { title: t.title, assigned_to: t.assigned_to, leads: t.lead_ids.length, prospects: t.prospect_ids.length, moved });
  const sheet = t.lead_ids.length + t.prospect_ids.length;
  redirect(`/admin/tasks/${row?.id}?toast=${encodeURIComponent(sheet ? `Task created with ${sheet} on the sheet${moved ? `, ${moved} reassigned` : ""}` : "Task created")}`);
}

export async function updateTask(id: number, _prev: TaskFormState, fd: FormData): Promise<TaskFormState> {
  const user = await requireUser("admin");
  const t = parse(fd);
  if (Object.keys(t.errors).length) return { errors: t.errors };
  const conflict = await sheetConflictError(t);
  if (conflict) return { errors: { records: conflict } };
  await q("UPDATE tasks SET title=$1, assigned_to=$2, due_date=$3, priority=$4, status=$5, updated_at=now() WHERE id=$6", [t.title, t.assigned_to, t.due_date, t.priority, t.status, id]);
  await setTaskRecords(id, t.lead_ids, t.prospect_ids);
  const moved = t.assign_records && t.assigned_to ? await assignSheet(user.id, t.assigned_to, t.lead_ids, t.prospect_ids) : 0;
  await audit(user.id, "update", "task", id, { title: t.title, leads: t.lead_ids.length, prospects: t.prospect_ids.length, moved });
  redirect(`/admin/tasks/${id}?toast=${encodeURIComponent(moved ? `Task saved, ${moved} reassigned` : "Task saved")}`);
}

export async function setTaskStatus(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  const status = String(fd.get("status") ?? "");
  const back = String(fd.get("back") ?? `/admin/tasks/${id}`);
  if (!id || !(TASK_STATUSES as readonly string[]).includes(status)) redirect(`${back}?error=${encodeURIComponent("Invalid status")}`);
  await q("UPDATE tasks SET status=$1, updated_at=now() WHERE id=$2", [status, id]);
  await audit(user.id, "status", "task", id, { status });
  redirect(`${back}${back.includes("?") ? "&" : "?"}toast=${encodeURIComponent(`Moved to ${status}`)}`);
}

export async function addTaskComment(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  const body = String(fd.get("body") ?? "").trim();
  if (!id || !body) redirect(`/admin/tasks/${id}?error=${encodeURIComponent("Write a comment first")}`);
  await q("INSERT INTO task_comments (task_id, user_id, body) VALUES ($1,$2,$3)", [id, user.id, body]);
  await q("UPDATE tasks SET updated_at=now() WHERE id=$1", [id]);
  redirect(`/admin/tasks/${id}?toast=${encodeURIComponent("Comment added")}`);
}

export async function deleteTask(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  if (!id) redirect("/admin/tasks");
  const t = await one<{ title: string }>("SELECT title FROM tasks WHERE id=$1", [id]);
  await q("DELETE FROM tasks WHERE id=$1", [id]);
  await audit(user.id, "delete", "task", id, { title: t?.title });
  redirect(`/admin/tasks?toast=${encodeURIComponent("Task deleted")}`);
}

export type QuickResult = { ok: true; id: number; message?: string } | { ok: false; error: string; conflicts?: LinkedOwner[] };
const refreshTasks = () => { revalidatePath("/admin/tasks"); revalidatePath("/employee/tasks"); revalidatePath("/employee"); revalidatePath("/admin"); };

/** Quick-add bar: title, one employee, a due shortcut and priority. Linked leads/prospects are optional. */
export async function quickCreateTask(fd: FormData): Promise<QuickResult> {
  const user = await requireUser("admin");
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  const assignedTo = Number(fd.get("assigned_to"));
  const priority = fd.get("priority") === "high" ? "high" : "normal";
  const due = dueFromChip(String(fd.get("due") ?? ""), String(fd.get("due_date") ?? ""));
  const idList = (name: string) => Array.from(new Set(String(fd.get(name) ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0))).slice(0, 500);
  let leadIds = idList("lead_ids"), prospectIds = idList("prospect_ids");
  if (title.length < 2) return { ok: false, error: "Type what needs to be done." };
  const emp = assignedTo ? await one<{ name: string }>("SELECT name FROM users WHERE id = $1 AND status = 'active'", [assignedTo]) : null;
  if (!emp) return { ok: false, error: "Tap the employee this task is for." };
  if (String(fd.get("due") ?? "") === "date" && !due) return { ok: false, error: "Pick a due date." };
  // One owner per lead/prospect: records already with someone else must be moved or left off the task.
  const conflicts = ownedByOthers(await linkedOwners(leadIds, prospectIds), assignedTo);
  const resolve = String(fd.get("conflicts") ?? "");
  if (conflicts.length && resolve !== "move" && resolve !== "remove") {
    return { ok: false, error: `Already assigned to someone else: ${describeConflicts(conflicts)}. Move them to ${emp.name} or remove them from this task.`, conflicts };
  }
  if (resolve === "remove") {
    const off = new Set(conflicts.map((c) => `${c.kind}:${c.id}`));
    leadIds = leadIds.filter((i) => !off.has(`lead:${i}`));
    prospectIds = prospectIds.filter((i) => !off.has(`prospect:${i}`));
  }
  const row = await one<{ id: number }>("INSERT INTO tasks (title, assigned_to, created_by, due_date, priority, status) VALUES ($1,$2,$3,$4,$5,'Open') RETURNING id", [title, assignedTo, user.id, due, priority]);
  let moved = 0;
  if (leadIds.length || prospectIds.length) {
    await setTaskRecords(row!.id, leadIds, prospectIds);
    // Linked records end up owned by the task's employee (moved ones, and any that were unassigned).
    moved = await assignSheet(user.id, assignedTo, leadIds, prospectIds);
  }
  await audit(user.id, "create", "task", row!.id, { title, assigned_to: assignedTo, due, priority, leads: leadIds.length, prospects: prospectIds.length, moved, conflicts: resolve || null });
  refreshTasks();
  return { ok: true, id: row!.id, message: moved ? `${moved} linked ${moved === 1 ? "record" : "records"} now with ${emp.name}` : undefined };
}

/** Inline edits from the task list: rename, reassign, change due date or priority. */
export async function updateTaskInline(id: number, patch: { title?: string; assigned_to?: number; due?: string; due_date?: string | null; priority?: string }): Promise<QuickResult> {
  const user = await requireUser("admin");
  const sets: string[] = []; const params: unknown[] = [];
  const add = (col: string, v: unknown) => { params.push(v); sets.push(`${col} = $${params.length}`); };
  if (patch.title !== undefined) { const t = patch.title.trim().slice(0, 200); if (t.length < 2) return { ok: false, error: "Title is too short." }; add("title", t); }
  let moved = 0;
  if (patch.assigned_to !== undefined) {
    if (!(await one("SELECT 1 FROM users WHERE id = $1 AND status = 'active'", [patch.assigned_to]))) return { ok: false, error: "Choose an active employee." };
    add("assigned_to", patch.assigned_to);
    // The task's leads and prospects move with it, so no record is worked by two people.
    const recs = await q<{ lead_id: number | null; prospect_id: number | null }>("SELECT lead_id, prospect_id FROM task_records WHERE task_id = $1", [id]);
    moved = await assignSheet(user.id, patch.assigned_to, recs.flatMap((r) => (r.lead_id ? [r.lead_id] : [])), recs.flatMap((r) => (r.prospect_id ? [r.prospect_id] : [])));
  }
  if (patch.due !== undefined) add("due_date", patch.due === "none" ? null : dueFromChip(patch.due, patch.due_date ?? null));
  if (patch.priority !== undefined) add("priority", patch.priority === "high" ? "high" : "normal");
  if (!sets.length) return { ok: true, id };
  params.push(id);
  await q(`UPDATE tasks SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length}`, params);
  await audit(user.id, "update", "task", id, { ...patch, moved });
  refreshTasks();
  return { ok: true, id, message: moved ? `Reassigned. ${moved} linked ${moved === 1 ? "record" : "records"} moved with the task` : undefined };
}

/** The tick box: Done when ticked, back to Open when unticked. */
export async function toggleTaskDone(id: number, done: boolean): Promise<QuickResult> {
  const user = await requireUser("admin");
  await q("UPDATE tasks SET status = $1, updated_at = now() WHERE id = $2", [done ? "Done" : "Open", id]);
  await audit(user.id, "status", "task", id, { status: done ? "Done" : "Open" });
  refreshTasks();
  return { ok: true, id };
}
