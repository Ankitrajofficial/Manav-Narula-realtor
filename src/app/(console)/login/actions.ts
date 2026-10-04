"use server";
import { redirect } from "next/navigation";
import { login } from "@/lib/auth";
import { audit } from "@/lib/records";
import { q } from "@/lib/db";

export interface LoginState { error?: string }

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const res = await login(email, password);
  if (!res.ok) {
    // Recorded so sign-in problems can be diagnosed from the audit log (the password itself is never stored).
    await audit(null, "login_failed", "user", null, { email: email.trim().toLowerCase().slice(0, 120), reason: res.error });
    return { error: res.error };
  }
  await audit(res.user.id, "login", "user", res.user.id);
  redirect(res.user.must_reset ? "/change-password" : res.user.role === "admin" ? "/admin" : "/employee");
}

export async function forgotAction(_prev: { done?: boolean }, fd: FormData): Promise<{ done: boolean }> {
  const email = String(fd.get("email") ?? "").trim();
  if (email) await q("INSERT INTO audit_log (action, entity, details) VALUES ('password_reset_requested','user',$1::jsonb)", [JSON.stringify({ email })]);
  return { done: true };
}
