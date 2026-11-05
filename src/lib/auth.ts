import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { one, q } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { LOCK_MINUTES, MAX_FAILED_LOGINS } from "./pin";

export type Role = "admin" | "employee";
export type SignInMethod = "pin" | "google";
export interface SessionUser { id: number; name: string; email: string; role: Role; status: string; must_reset?: boolean; pin_set?: boolean; level?: string; /** How this session was opened. Google sign-ins never need a PIN. */ via?: SignInMethod }

const COOKIE = "mn_session";
/** Checked when the email is unknown, so an unknown address takes as long to answer as a known one. */
const UNKNOWN_ACCOUNT_HASH = hashPassword(randomBytes(16).toString("hex"));
const sameText = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const secretMissing = () => process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET;
/** In production a missing secret stops sign-in instead of falling back to a value anyone can read in the code. */
const secret = () => {
  if (secretMissing()) throw new Error("SESSION_SECRET is not set");
  return process.env.SESSION_SECRET || "dev-only-secret-change-me";
};
const SESSION_MS = 1000 * 60 * 60 * 24 * 7;
/** Room for a small clock difference between this server and the database, so a brand-new cookie is never refused. */
const CLOCK_LEEWAY_MS = 5000;
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

/** Cached per request: the layout and the page both check the session, but the database is asked once. */
export const getSession = cache(async function getSession(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw || secretMissing()) return null;
  // "<id>.<expiry>.<signature>" (PIN sign-in, also older cookies) or "<id>.<expiry>.g.<signature>" (Google sign-in).
  const parts = raw.split(".");
  const [id, exp] = parts;
  const via: SignInMethod = parts.length === 4 && parts[2] === "g" ? "google" : "pin";
  const sig = parts[parts.length - 1];
  if (!id || !exp || parts.length < 3 || parts.length > 4 || !sameText(sig, sign(via === "google" ? `${id}.${exp}.g` : `${id}.${exp}`)) || Number(exp) < Date.now()) return null;
  const row = await one<SessionUser & { sessions_valid_from: Date | null }>("SELECT id, name, email, role, status, must_reset, pin_set, level, sessions_valid_from FROM users WHERE id = $1", [Number(id)]);
  if (!row || row.status !== "active") return null;
  const { sessions_valid_from: validFrom, ...user } = row;
  // The cookie's expiry tells when it was issued, so one from before the last log out or PIN change is refused.
  if (validFrom && Number(exp) - SESSION_MS + CLOCK_LEEWAY_MS < new Date(validFrom).getTime()) return null;
  return { ...user, via };
});

/** The session cookie for a week of access; the Google variant carries a "g" so the PIN rules are skipped. */
export function sessionCookie(userId: number, via: SignInMethod) {
  const exp = Date.now() + SESSION_MS;
  const payload = via === "google" ? `${userId}.${exp}.g` : `${userId}.${exp}`;
  return { name: COOKIE, value: `${payload}.${sign(payload)}`, options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(exp) } };
}

/** Opens a signed-in session and clears any lock. Called after the PIN has been checked (Google sign-in sets the cookie itself). */
export async function startSession(userId: number, via: SignInMethod): Promise<void> {
  const c = sessionCookie(userId, via);
  (await cookies()).set(c.name, c.value, c.options);
  await q("UPDATE users SET last_login_at = now(), failed_logins = 0, locked_until = NULL WHERE id = $1", [userId]);
}

/** Where a signed-in person must go first: /change-password until they have their own PIN. Google sign-ins skip this. */
export const needsNewPin = (u: Pick<SessionUser, "must_reset" | "pin_set" | "via">) => u.via !== "google" && (!!u.must_reset || !u.pin_set);

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
  if (secretMissing()) return { ok: false, error: "Sign-in is not available right now. Tell the admin." };
  const row = await one<SessionUser & { password_hash: string; locked: boolean }>(
    "SELECT id, name, email, role, status, must_reset, pin_set, password_hash, COALESCE(locked_until > now(), false) AS locked FROM users WHERE lower(email) = lower($1)",
    [email.trim()],
  );
  const lockedOut = { ok: false as const, error: `Too many wrong PINs. Try again in ${LOCK_MINUTES} minutes, or use Forgot PIN.` };
  if (row?.locked) return lockedOut;
  // Each try is counted before the PIN is checked, so many tries at the same moment cannot get past the limit.
  let tries = 0;
  if (row) {
    const claim = await one<{ failed_logins: number }>(
      `UPDATE users SET failed_logins = failed_logins + 1,
         locked_until = CASE WHEN failed_logins + 1 >= $2 THEN now() + make_interval(mins => $3) ELSE locked_until END
       WHERE id = $1 AND (locked_until IS NULL OR locked_until <= now()) RETURNING failed_logins`,
      [row.id, MAX_FAILED_LOGINS, LOCK_MINUTES],
    );
    if (!claim) return lockedOut;
    tries = claim.failed_logins;
  }
  // A PIN or password pasted from a message often carries a stray space at either end: accept it once trimmed too.
  const hash = row?.password_hash ?? UNKNOWN_ACCOUNT_HASH;
  const matches = verifyPassword(pin, hash) || (pin.trim() !== pin && verifyPassword(pin.trim(), hash));
  if (!row || !matches) {
    if (row && tries >= MAX_FAILED_LOGINS) {
      await q("UPDATE users SET failed_logins = 0 WHERE id = $1", [row.id]);
      return { ok: false, error: `Too many wrong PINs. The account is locked for ${LOCK_MINUTES} minutes; use Forgot PIN to reset it.` };
    }
    return { ok: false, error: "Email or PIN is incorrect." };
  }
  if (row.status !== "active") {
    await q("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = $1", [row.id]);
    return { ok: false, error: "This account is blocked. Contact the admin." };
  }
  await startSession(row.id, "pin");
  return { ok: true, user: { id: row.id, name: row.name, email: row.email, role: row.role, status: row.status, must_reset: row.must_reset, pin_set: row.pin_set, via: "pin" } };
}

/** Ends this person's sessions on every device, so a copied cookie stops working too. */
export async function logout() {
  const user = await getSession();
  if (user) await q("UPDATE users SET sessions_valid_from = now() WHERE id = $1", [user.id]);
  (await cookies()).delete(COOKIE);
}
