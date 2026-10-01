"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { audit, toE164 } from "@/lib/records";
import { emailTaken, reassignAndDelete, tempPassword } from "@/lib/queries/employees";

export interface EmployeeFormState { errors?: Record<string, string>; message?: string; created?: { id: number; name: string; email: string; tempPassword: string } }
export interface ResetState { tempPassword?: string; message?: string }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** True when some other active admin would remain if `id` stopped being one. The system always keeps at least one active admin. */
async function anotherActiveAdmin(id: number): Promise<boolean> {
  const r = await one<{ n: number }>("SELECT count(*)::int AS n FROM users WHERE role = 'admin' AND status = 'active' AND id <> $1", [id]);
  return Number(r?.n ?? 0) > 0;
}
const isActiveAdmin = async (id: number) => !!(await one("SELECT 1 FROM users WHERE id = $1 AND role = 'admin' AND status = 'active'", [id]));

function validate(fd: FormData) {
  const errors: Record<string, string> = {};
  const name = s(fd, "name"); if (name.length < 2) errors.name = "Enter the person's name.";
  const email = s(fd, "email").toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Enter a valid email.";
  const phoneRaw = s(fd, "phone"); const phone = phoneRaw ? toE164(phoneRaw) : null; if (phoneRaw && !phone) errors.phone = "Enter a 10-digit Indian mobile number.";
  const role = s(fd, "role") === "admin" ? "admin" : "employee";
  return { errors, name, email, phone, role };
}

export async function createEmployee(_p: EmployeeFormState, fd: FormData): Promise<EmployeeFormState> {
  const user = await requireUser("admin");
  const { errors, name, email, phone, role } = validate(fd);
  if (!errors.email && (await emailTaken(email))) errors.email = "An account with this email already exists.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const password = s(fd, "password") || tempPassword();
  if (password.length < 8) return { errors: { password: "At least 8 characters." }, message: "Fix the highlighted fields." };
  const r = await one<{ id: number }>("INSERT INTO users (name,email,phone,role,status,password_hash,must_reset) VALUES ($1,$2,$3,$4,'active',$5,true) RETURNING id", [name, email, phone, role, hashPassword(password)]);
  await audit(user.id, "create", "user", r!.id, { name, email, role });
  if (fd.get("send_invite")) await audit(user.id, "invite_sent", "user", r!.id, { email, note: "Invite recorded; email delivery is not connected yet" });
  return { created: { id: r!.id, name, email, tempPassword: password } };
}

export async function updateEmployee(id: number, _p: EmployeeFormState, fd: FormData): Promise<EmployeeFormState> {
  const user = await requireUser("admin");
  const { errors, name, email, phone, role } = validate(fd);
  if (!errors.email && (await emailTaken(email, id))) errors.email = "Another account uses this email.";
  if (id === user.id && role !== "admin") errors.role = "You cannot remove your own admin role.";
  else if (role !== "admin" && (await isActiveAdmin(id)) && !(await anotherActiveAdmin(id))) errors.role = "At least one active admin must remain.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  await q("UPDATE users SET name=$1, email=$2, phone=$3, role=$4 WHERE id=$5", [name, email, phone, role, id]);
  await audit(user.id, "update", "user", id, { name, email, role });
  redirect(`/admin/employees/${id}?tab=account&toast=Saved`);
}

export async function resetPassword(id: number): Promise<ResetState> {
  const user = await requireUser("admin");
  const target = await one<{ id: number }>("SELECT id FROM users WHERE id = $1", [id]);
  if (!target) return { message: "Employee not found." };
  const pw = tempPassword();
  await q("UPDATE users SET password_hash = $1, must_reset = true WHERE id = $2", [hashPassword(pw), id]);
  await audit(user.id, "reset_password", "user", id);
  return { tempPassword: pw };
}

export async function setEmployeeStatus(id: number, status: "active" | "blocked") {
  const user = await requireUser("admin");
  if (id === user.id) redirect("/admin/employees?error=You+cannot+block+yourself");
  if (status === "blocked" && (await isActiveAdmin(id)) && !(await anotherActiveAdmin(id))) redirect("/admin/employees?error=At+least+one+active+admin+must+remain");
  await q("UPDATE users SET status = $1 WHERE id = $2", [status, id]);
  await audit(user.id, status === "blocked" ? "block" : "unblock", "user", id);
  redirect(`/admin/employees?toast=${status === "blocked" ? "Employee+blocked" : "Employee+unblocked"}`);
}

export async function deleteEmployee(id: number, fd: FormData) {
  const user = await requireUser("admin");
  if (id === user.id) redirect("/admin/employees?error=You+cannot+delete+yourself");
  if ((await isActiveAdmin(id)) && !(await anotherActiveAdmin(id))) redirect("/admin/employees?error=At+least+one+active+admin+must+remain");
  const toId = Number(fd.get("reassign_to"));
  if (!toId || toId === id) redirect(`/admin/employees/${id}?error=Choose+who+receives+their+records+first`);
  const to = await one<{ name: string; status: string }>("SELECT name, status FROM users WHERE id = $1", [toId]);
  if (!to || to.status !== "active") redirect(`/admin/employees/${id}?error=Choose+an+active+employee`);
  const victim = await one<{ name: string; email: string }>("SELECT name, email FROM users WHERE id = $1", [id]);
  await reassignAndDelete(id, toId);
  await audit(user.id, "delete", "user", id, { name: victim?.name, email: victim?.email, reassigned_to: toId });
  redirect(`/admin/employees?toast=${encodeURIComponent(`Deleted. Records moved to ${to.name}`)}`);
}
