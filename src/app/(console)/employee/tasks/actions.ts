"use server";
import { redirect } from "next/navigation";
import { one, q } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/records";

async function ownTask(id: number, userId: number) {
  const t = await one<{ id: number }>("SELECT id FROM tasks WHERE id=$1 AND assigned_to=$2", [id, userId]);
  return !!t;
}

export async function employeeSetTaskStatus(fd: FormData) {
  const user = await requireUser("employee");
  const id = Number(fd.get("id"));
  const status = String(fd.get("status") ?? "");
  const back = String(fd.get("back") ?? `/employee/tasks/${id}`);
  if (!id || !["In progress", "Done"].includes(status) || !(await ownTask(id, user.id))) redirect(`${back}?error=${encodeURIComponent("Not allowed")}`);
  await q("UPDATE tasks SET status=$1, updated_at=now() WHERE id=$2", [status, id]);
  await audit(user.id, "status", "task", id, { status });
  redirect(`${back}${back.includes("?") ? "&" : "?"}toast=${encodeURIComponent(`Marked ${status}`)}`);
}

export async function employeeAddComment(fd: FormData) {
  const user = await requireUser("employee");
  const id = Number(fd.get("id"));
  const body = String(fd.get("body") ?? "").trim();
  if (!id || !(await ownTask(id, user.id))) redirect("/employee/tasks");
  if (!body) redirect(`/employee/tasks/${id}?error=${encodeURIComponent("Write a comment first")}`);
  await q("INSERT INTO task_comments (task_id, user_id, body) VALUES ($1,$2,$3)", [id, user.id, body]);
  await q("UPDATE tasks SET updated_at=now() WHERE id=$1", [id]);
  redirect(`/employee/tasks/${id}?toast=${encodeURIComponent("Comment added")}`);
}
