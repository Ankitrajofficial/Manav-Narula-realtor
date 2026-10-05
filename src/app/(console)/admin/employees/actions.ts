"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { audit, toE164 } from "@/lib/records";
import { emailTaken, reassignAndDelete, tempPassword } from "@/lib/queries/employees";
import { credentialsEmail, mailConfigured, sendMail, signInUrl } from "@/lib/mailer";
import { describeAssign, runAutoAssign } from "@/lib/auto-assign";
import { getGrowth } from "@/lib/queries/growth";
import { MAX_STARS, canPromote, starsDue } from "@/lib/growth";

export interface EmployeeFormState { errors?: Record<string, string>; message?: string; created?: { id: number; name: string; email: string; tempPassword: string; signIn: string; emailed: boolean; emailError?: string } }
export interface ResetState { tempPassword?: string; message?: string; emailed?: boolean; emailError?: string }
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
  // One picker sets both: admins sign in to the admin console, interns, employees and executives to the employee console.
  const picked = s(fd, "role");
  const role = picked === "admin" ? "admin" : "employee";
  const level = picked === "intern" || picked === "executive" ? picked : "employee";
  return { errors, name, email, phone, role, level };
}

export async function createEmployee(_p: EmployeeFormState, fd: FormData): Promise<EmployeeFormState> {
  const user = await requireUser("admin");
  const { errors, name, email, phone, role, level } = validate(fd);
  if (!errors.email && (await emailTaken(email))) errors.email = "An account with this email already exists.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const password = s(fd, "password") || tempPassword();
  if (password.length < 8) return { errors: { password: "At least 8 characters." }, message: "Fix the highlighted fields." };
  const r = await one<{ id: number }>("INSERT INTO users (name,email,phone,role,level,status,password_hash,must_reset) VALUES ($1,$2,$3,$4,$5,'active',$6,true) RETURNING id", [name, email, phone, role, level, hashPassword(password)]);
  await audit(user.id, "create", "user", r!.id, { name, email, role, level });
  let emailed = false, emailError: string | undefined;
  if (fd.get("send_invite")) {
    const res = await sendMail(credentialsEmail({ name, email, password, role }));
    emailed = res.ok;
    if (!res.ok) emailError = res.error;
    await audit(user.id, res.ok ? "invite_sent" : "invite_failed", "user", r!.id, { email, ...(res.ok ? {} : { error: res.error }) });
  }
  return { created: { id: r!.id, name, email, tempPassword: password, signIn: signInUrl(), emailed, emailError } };
}

export async function updateEmployee(id: number, _p: EmployeeFormState, fd: FormData): Promise<EmployeeFormState> {
  const user = await requireUser("admin");
  const { errors, name, email, phone, role, level } = validate(fd);
  if (!errors.email && (await emailTaken(email, id))) errors.email = "Another account uses this email.";
  if (id === user.id && role !== "admin") errors.role = "You cannot remove your own admin role.";
  else if (role !== "admin" && (await isActiveAdmin(id)) && !(await anotherActiveAdmin(id))) errors.role = "At least one active admin must remain.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const before = await one<{ level: string }>("SELECT level FROM users WHERE id = $1", [id]);
  await q("UPDATE users SET name=$1, email=$2, phone=$3, role=$4, level=$5, promoted_at = CASE WHEN $5 = 'executive' AND level <> 'executive' THEN now() ELSE promoted_at END WHERE id=$6", [name, email, phone, role, level, id]);
  await audit(user.id, "update", "user", id, { name, email, role, level, ...(before && before.level !== level ? { level_from: before.level } : {}) });
  redirect(`/admin/employees/${id}?tab=account&toast=Saved`);
}

export async function resetPassword(id: number, email: boolean): Promise<ResetState> {
  const user = await requireUser("admin");
  const target = await one<{ id: number; name: string; email: string; role: string }>("SELECT id, name, email, role FROM users WHERE id = $1", [id]);
  if (!target) return { message: "Employee not found." };
  const pw = tempPassword();
  await q("UPDATE users SET password_hash = $1, must_reset = true WHERE id = $2", [hashPassword(pw), id]);
  await audit(user.id, "reset_password", "user", id);
  if (!email || !mailConfigured()) return { tempPassword: pw };
  const res = await sendMail(credentialsEmail({ name: target.name, email: target.email, password: pw, role: target.role, reset: true }));
  await audit(user.id, res.ok ? "reset_email_sent" : "reset_email_failed", "user", id, res.ok ? { email: target.email } : { email: target.email, error: res.error });
  return { tempPassword: pw, emailed: res.ok, emailError: res.ok ? undefined : res.error };
}

export async function setEmployeeStatus(id: number, status: "active" | "blocked") {
  const user = await requireUser("admin");
  if (id === user.id) redirect("/admin/employees?error=You+cannot+block+yourself");
  if (status === "blocked" && (await isActiveAdmin(id)) && !(await anotherActiveAdmin(id))) redirect("/admin/employees?error=At+least+one+active+admin+must+remain");
  await q("UPDATE users SET status = $1 WHERE id = $2", [status, id]);
  await audit(user.id, status === "blocked" ? "block" : "unblock", "user", id);
  const auto = status === "active" ? describeAssign(await runAutoAssign(), { quiet: true }) : "";
  redirect(`/admin/employees?toast=${encodeURIComponent(`${status === "blocked" ? "Employee blocked" : "Employee unblocked"}${auto ? `. ${auto}` : ""}`)}`);
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

/* ---------- Stars and promotion ---------- */
const growthTab = (id: number, msg: string, kind: "toast" | "error" = "toast") => `/admin/employees/${id}?tab=growth&${kind}=${encodeURIComponent(msg)}`;

/** Adds the next star. Allowed only once the approved sales reach that star's threshold. */
export async function awardStar(id: number) {
  const user = await requireUser("admin");
  const g = await getGrowth(id);
  if (!g || g.role === "admin") redirect("/admin/employees?error=Stars+are+for+interns,+employees+and+executives");
  if (g.stars >= MAX_STARS) redirect(growthTab(id, "Already at five stars", "error"));
  if (starsDue(g.sales) <= g.stars) redirect(growthTab(id, "Not enough approved sales for the next star yet", "error"));
  const star = g.stars + 1;
  await q("UPDATE users SET stars = $1 WHERE id = $2 AND stars = $3", [star, id, g.stars]);
  await q("INSERT INTO star_awards (user_id, star, sales_count, awarded_by) VALUES ($1, $2, $3, $4)", [id, star, g.sales, user.id]);
  await audit(user.id, "award_star", "user", id, { star, sales: g.sales });
  redirect(growthTab(id, star === MAX_STARS ? "Fifth star awarded. Ready for promotion" : `Star ${star} awarded`));
}

/** Takes back the most recent star, for a star given by mistake. */
export async function removeStar(id: number) {
  const user = await requireUser("admin");
  const g = await getGrowth(id);
  if (!g || g.stars <= 0) redirect(growthTab(id, "No stars to remove", "error"));
  await q("UPDATE users SET stars = stars - 1 WHERE id = $1 AND stars > 0", [id]);
  await q("DELETE FROM star_awards WHERE id = (SELECT id FROM star_awards WHERE user_id = $1 AND star = $2 ORDER BY created_at DESC LIMIT 1)", [id, g.stars]);
  await audit(user.id, "remove_star", "user", id, { star: g.stars });
  redirect(growthTab(id, `Star ${g.stars} removed`));
}

export async function promoteToExecutive(id: number) {
  const user = await requireUser("admin");
  const g = await getGrowth(id);
  if (!g || !canPromote(g.role, g.level, g.stars)) redirect(growthTab(id, "Promotion needs all five stars", "error"));
  await q("UPDATE users SET level = 'executive', promoted_at = now() WHERE id = $1", [id]);
  await audit(user.id, "promote", "user", id, { from: g.level, to: "executive", stars: g.stars, sales: g.sales });
  redirect(growthTab(id, `${g.name} promoted to Executive`));
}
