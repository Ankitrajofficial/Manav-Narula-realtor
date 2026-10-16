"use server";
import { redirect } from "next/navigation";
import { login, needsNewPin } from "@/lib/auth";
import { audit } from "@/lib/records";

export interface LoginState { error?: string }

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "");
  const pin = String(fd.get("pin") ?? "");
  if (!email || !pin) return { error: "Enter your email and PIN." };
  const res = await login(email, pin);
  if (!res.ok) {
    // Recorded so sign-in problems can be diagnosed from the audit log (the PIN itself is never stored).
    await audit(null, "login_failed", "user", null, { email: email.trim().toLowerCase().slice(0, 120), reason: res.error });
    return { error: res.error };
  }
  await audit(res.user.id, "login", "user", res.user.id);
  redirect(needsNewPin(res.user) ? "/change-password" : res.user.role === "admin" ? "/admin" : "/employee");
}
