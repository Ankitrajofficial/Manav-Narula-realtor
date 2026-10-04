import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { one, q } from "./db";
import { verifyPassword } from "./password";

export type Role = "admin" | "employee";
export interface SessionUser { id: number; name: string; email: string; role: Role; status: string; must_reset?: boolean }

const COOKIE = "mn_session";
const secret = () => process.env.SESSION_SECRET || "dev-only-secret-change-me";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

/** Cached per request: the layout and the page both check the session, but the database is asked once. */
export const getSession = cache(async function getSession(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [id, exp, sig] = raw.split(".");
  if (!id || !exp || sig !== sign(`${id}.${exp}`) || Number(exp) < Date.now()) return null;
  const user = await one<SessionUser>("SELECT id, name, email, role, status, must_reset FROM users WHERE id = $1", [Number(id)]);
  if (!user || user.status !== "active") return null;
  return user;
});

/**
 * Redirects to /login when signed out, to /change-password while a temporary password is still in use,
 * or to the user's own console when the role does not match. Admin checks are role === "admin" only:
 * every admin has the same authority.
 */
export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.must_reset) redirect("/change-password");
  if (role && user.role !== role) redirect(user.role === "admin" ? "/admin" : "/employee");
  return user;
}

export async function login(email: string, password: string): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const row = await one<SessionUser & { password_hash: string }>("SELECT id, name, email, role, status, must_reset, password_hash FROM users WHERE lower(email) = lower($1)", [email.trim()]);
  // A password pasted from a message often carries a stray space at either end: accept it once trimmed too.
  const matches = row && (verifyPassword(password, row.password_hash) || (password.trim() !== password && verifyPassword(password.trim(), row.password_hash)));
  if (!row || !matches) return { ok: false, error: "Email or password is incorrect." };
  if (row.status !== "active") return { ok: false, error: "This account is blocked. Contact the admin." };
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const value = `${row.id}.${exp}.${sign(`${row.id}.${exp}`)}`;
  (await cookies()).set(COOKIE, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(exp) });
  await q("UPDATE users SET last_login_at = now() WHERE id = $1", [row.id]);
  return { ok: true, user: { id: row.id, name: row.name, email: row.email, role: row.role, status: row.status, must_reset: row.must_reset } };
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
