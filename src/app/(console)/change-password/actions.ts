"use server";
import { tooMany } from "@/lib/rate-limit";
import { redirect } from "@/lib/nav";
import { getSession, startSession } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { audit } from "@/lib/records";
import { pinError } from "@/lib/pin";

export interface ChangePasswordState { errors?: Record<string, string>; message?: string }

export async function changePasswordAction(_p: ChangePasswordState, fd: FormData): Promise<ChangePasswordState> {
  const user = await getSession();
  if (!user) redirect("/login");
  if (tooMany(`pin-change:${user.id}`, 10, 15 * 60_000)) return { message: "Too many tries. Wait a few minutes and try again." };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const row = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [user.id]);
  const errors: Record<string, string> = {};
  if (!row || !verifyPassword(current, row.password_hash)) errors.current = user.pin_set ? "This is not your current PIN." : "This is not your current password or PIN.";
  const bad = pinError(next);
  if (bad) errors.password = bad;
  else if (next === current) errors.password = "Choose a PIN different from the temporary one.";
  if (!errors.password && next !== confirm) errors.confirm = "The two PINs do not match.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  await q("UPDATE users SET password_hash = $1, must_reset = false, pin_set = true, sessions_valid_from = now() WHERE id = $2", [hashPassword(next), user.id]);
  // Other devices are signed out; this one carries on with a fresh cookie.
  await startSession(user.id, user.via ?? "pin");
  await audit(user.id, "change_pin", "user", user.id, { forced: !!user.must_reset, first_pin: !user.pin_set });
  redirect(`${user.role === "admin" ? "/admin" : "/employee"}?toast=${encodeURIComponent("PIN saved")}`);
}
