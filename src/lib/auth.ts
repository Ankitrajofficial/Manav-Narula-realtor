import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { one, q } from "./db";
import { verifyPassword } from "./password";
import { LOCK_MINUTES, MAX_FAILED_LOGINS } from "./pin";

export type Role = "admin" | "employee";
export interface SessionUser { id: number; name: string; email: string; role: Role; status: string; must_reset?: boolean; pin_set?: boolean; level?: string }

const COOKIE = "mn_session";
const secret = () => process.env.SESSION_SECRET || "dev-only-secret-change-me";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

/** Cached per request: the layout and the page both check the session, but the database is asked once. */
export const getSession = cache(async function getSession(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [id, exp, sig] = raw.split(".");
  if (!id || !exp || sig !== sign(`${id}.${exp}`) || Number(exp) < Date.now()) return null;
  const user = await one<SessionUser>("SELECT id, name, email, role, status, must_reset, pin_set, level FROM users WHERE id = $1", [Number(id)]);
  if (!user || user.status !== "active") return null;
  return user;
});

/** Where a signed-in person must go first: /change-password until they have their own PIN. */
export const needsNewPin = (u: Pick<SessionUser, "must_reset" | "pin_set">) => !!u.must_reset || !u.pin_set;

/**
 * Redirects to /login when signed out, to /change-password while a temporary PIN (or an old password) is in use,
 * or to the user's own console when the role does not match. Admin checks are role === "admin" only:
 * every admin has the same authority.
 */
export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  if (needsNewPin(user)) redirect("/change-password");
  if (role && user.role !== role) redirect(user.role === "admin" ? "/admin" : "/employee");
  return user;
}

/**
 * Signs in with email and PIN. Accounts that have not set a PIN yet still sign in with their old password once.
 * After MAX_FAILED_LOGINS wrong tries in a row the account is locked for LOCK_MINUTES.
 */
export async function login(email: string, pin: string): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const row = await one<SessionUser & { password_hash: string; locked: boolean }>(
    "SELECT id, name, email, role, status, must_reset, pin_set, password_hash, COALESCE(locked_until > now(), false) AS locked FROM users WHERE lower(email) = lower($1)",
    [email.trim()],
  );
  if (row?.locked) return { ok: false, error: `Too many wrong PINs. Try again in ${LOCK_MINUTES} minutes, or use Forgot PIN.` };
  // A PIN or password pasted from a message often carries a stray space at either end: accept it once trimmed too.
  const matches = row && (verifyPassword(pin, row.password_hash) || (pin.trim() !== pin && verifyPassword(pin.trim(), row.password_hash)));
  if (!row || !matches) {
    if (row) {
      const r = await one<{ failed_logins: number }>(
        `UPDATE users SET failed_logins = failed_logins + 1,
           locked_until = CASE WHEN failed_logins + 1 >= $2 THEN now() + make_interval(mins => $3) ELSE locked_until END
         WHERE id = $1 RETURNING failed_logins`,
        [row.id, MAX_FAILED_LOGINS, LOCK_MINUTES],
      );
      if (r && r.failed_logins >= MAX_FAILED_LOGINS) {
        await q("UPDATE users SET failed_logins = 0 WHERE id = $1", [row.id]);
        return { ok: false, error: `Too many wrong PINs. The account is locked for ${LOCK_MINUTES} minutes; use Forgot PIN to reset it.` };
      }
    }
    return { ok: false, error: "Email or PIN is incorrect." };
  }
  if (row.status !== "active") return { ok: false, error: "This account is blocked. Contact the admin." };
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const value = `${row.id}.${exp}.${sign(`${row.id}.${exp}`)}`;
  (await cookies()).set(COOKIE, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(exp) });
  await q("UPDATE users SET last_login_at = now(), failed_logins = 0, locked_until = NULL WHERE id = $1", [row.id]);
  return { ok: true, user: { id: row.id, name: row.name, email: row.email, role: row.role, status: row.status, must_reset: row.must_reset, pin_set: row.pin_set } };
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
