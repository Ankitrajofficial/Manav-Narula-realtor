"use server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { audit } from "@/lib/records";

export interface ChangePasswordState { errors?: Record<string, string>; message?: string }

export async function changePasswordAction(_p: ChangePasswordState, fd: FormData): Promise<ChangePasswordState> {
  const user = await getSession();
  if (!user) redirect("/login");
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const row = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [user.id]);
  const errors: Record<string, string> = {};
  if (!row || !verifyPassword(current, row.password_hash)) errors.current = "This is not your current password.";
  if (next.length < 10) errors.password = "Use at least 10 characters.";
  else if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) errors.password = "Use letters and at least one number.";
  else if (next === current) errors.password = "Choose a password different from the temporary one.";
  if (!errors.password && next !== confirm) errors.confirm = "The two passwords do not match.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  await q("UPDATE users SET password_hash = $1, must_reset = false WHERE id = $2", [hashPassword(next), user.id]);
  await audit(user.id, "change_password", "user", user.id, { forced: !!user.must_reset });
  redirect(`${user.role === "admin" ? "/admin" : "/employee"}?toast=${encodeURIComponent("Password changed")}`);
}
