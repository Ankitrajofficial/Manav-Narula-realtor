"use server";
import { redirect } from "next/navigation";
import { one, q } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit, logActivity } from "@/lib/records";
import { setTaskRecords } from "@/lib/queries/tasks";
import { PRIORITIES, TASK_STATUSES } from "@/lib/console";

export interface TaskFormState { errors?: Record<string, string>; error?: string }

function parse(fd: FormData) {
  const title = String(fd.get("title") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim() || null;
  const idList = (name: string) => Array.from(new Set(fd.getAll(name).map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0)));
  const lead_ids = idList("lead_ids");
  const prospect_ids = idList("prospect_ids");
  const assign_records = fd.get("assign_records") === "1";
  const assigned_to = fd.get("assigned_to") ? Number(fd.get("assigned_to")) : null;
  const due_date = String(fd.get("due_date") ?? "").trim() || null;
  const priority = String(fd.get("priority") ?? "Medium");
  const status = String(fd.get("status") ?? "Open");
  const errors: Record<string, string> = {};
  if (title.length < 3) errors.title = "Enter a title of at least 3 characters.";
  if (!assigned_to) errors.assigned_to = "Choose who this task is for.";
  if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) errors.due_date = "Enter a valid date.";
  if (!(PRIORITIES as readonly string[]).includes(priority)) errors.priority = "Choose a priority.";
  if (!(TASK_STATUSES as readonly string[]).includes(status)) errors.status = "Choose a status.";
  if (lead_ids.length + prospect_ids.length > 500) errors.records = "A call sheet can hold up to 500 people.";
  return { title, description, lead_ids, prospect_ids, assign_records, assigned_to, due_date, priority, status, errors };
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

export async function createTask(_prev: TaskFormState, fd: FormData): Promise<TaskFormState> {
  const user = await requireUser("admin");
  const t = parse(fd);
  if (Object.keys(t.errors).length) return { errors: t.errors };
  const row = await one<{ id: number }>("INSERT INTO tasks (title, description, assigned_to, created_by, due_date, priority, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id", [t.title, t.description, t.assigned_to, user.id, t.due_date, t.priority, t.status]);
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
  await q("UPDATE tasks SET title=$1, description=$2, assigned_to=$3, due_date=$4, priority=$5, status=$6, updated_at=now() WHERE id=$7", [t.title, t.description, t.assigned_to, t.due_date, t.priority, t.status, id]);
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
