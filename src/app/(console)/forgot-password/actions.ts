"use server";
import { headers } from "next/headers";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { redirect } from "@/lib/nav";
import { one, q } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { audit } from "@/lib/records";
import { mailConfigured, pinResetEmail, sendMail } from "@/lib/mailer";
import { pinError, randomPin } from "@/lib/pin";

/**
 * Forgot PIN, done by the employee: a 6-digit code goes to their email through the Google Apps Script mail sender
 * (integrations/google-mail.gs), and the code plus a new PIN resets it. The old PIN keeps working until then, so a
 * stranger asking for codes cannot lock anyone out. The answer is the same whether or not the email has an account.
 */
const CODE_MINUTES = 15;
const MAX_CODE_TRIES = 5;

export interface ForgotState { step?: "code"; email?: string; error?: string; errors?: Record<string, string> }

export async function requestCodeAction(_p: ForgotState, fd: FormData): Promise<ForgotState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter the email you sign in with." };
  if (!mailConfigured()) {
    await q("INSERT INTO audit_log (action, entity, details) VALUES ('password_reset_requested','user',$1::jsonb)", [JSON.stringify({ email })]);
    return { error: "Email is not connected yet, so the request was passed to the admin. They will reset your PIN from the Employees page." };
  }
  const user = await one<{ id: number; name: string; email: string }>("SELECT id, name, email FROM users WHERE lower(email) = $1 AND status = 'active'", [email]);
  if (user) {
    // At most one code a minute and five an hour per account.
    const recent = await one<{ minute: number; hour: number }>(
      "SELECT count(*) FILTER (WHERE created_at > now() - interval '1 minute')::int AS minute, count(*)::int AS hour FROM pin_reset_codes WHERE user_id = $1 AND created_at > now() - interval '1 hour'",
      [user.id],
    );
    if (recent && recent.minute === 0 && recent.hour < 5) {
      const code = randomPin();
      await q("UPDATE pin_reset_codes SET used_at = now() WHERE user_id = $1 AND used_at IS NULL", [user.id]);
      await q("INSERT INTO pin_reset_codes (user_id, code_hash, expires_at) VALUES ($1, $2, now() + make_interval(mins => $3))", [user.id, hashPassword(code), CODE_MINUTES]);
      const res = await sendMail(pinResetEmail({ name: user.name, email: user.email, code, minutes: CODE_MINUTES }));
      await audit(user.id, res.ok ? "pin_reset_code_sent" : "pin_reset_code_failed", "user", user.id, res.ok ? {} : { error: res.error });
      if (!res.ok) return { error: `The code could not be emailed (${res.error}). Try again in a minute or ask the admin.` };
    }
  }
  return { step: "code", email };
}

export async function resetPinAction(_p: ForgotState, fd: FormData): Promise<ForgotState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const code = String(fd.get("code") ?? "").replace(/\D/g, "");
  const pin = String(fd.get("pin") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const errors: Record<string, string> = {};
  const bad = pinError(pin);
  if (bad) errors.pin = bad;
  else if (pin !== confirm) errors.confirm = "The two PINs do not match.";
  if (code.length !== 6) errors.code = "Enter the 6-digit code from the email.";
  if (Object.keys(errors).length) return { step: "code", email, errors };
  const row = await one<{ id: number; user_id: number; code_hash: string; attempts: number }>(
    `SELECT c.id, c.user_id, c.code_hash, c.attempts FROM pin_reset_codes c JOIN users u ON u.id = c.user_id
     WHERE lower(u.email) = $1 AND u.status = 'active' AND c.used_at IS NULL AND c.expires_at > now()
     ORDER BY c.created_at DESC LIMIT 1`,
    [email],
  );
  const wrong = { step: "code" as const, email, errors: { code: "This code is wrong or has expired. Ask for a new one." } };
  if (!row) return wrong;
  if (tooMany(`reset:${clientIp(await headers())}`, 20, 15 * 60_000)) return wrong;
  // The try is counted before the code is checked, so many tries at the same moment cannot exceed the limit.
  const claim = await one<{ id: number }>("UPDATE pin_reset_codes SET attempts = attempts + 1, used_at = CASE WHEN attempts + 1 >= $2 THEN now() ELSE NULL END WHERE id = $1 AND used_at IS NULL AND attempts < $2 RETURNING id", [row.id, MAX_CODE_TRIES]);
  if (!claim || !verifyPassword(code, row.code_hash)) return wrong;
  await q("UPDATE pin_reset_codes SET used_at = now() WHERE user_id = $1 AND used_at IS NULL", [row.user_id]);
  await q("UPDATE users SET password_hash = $1, pin_set = true, must_reset = false, failed_logins = 0, locked_until = NULL, sessions_valid_from = now() WHERE id = $2", [hashPassword(pin), row.user_id]);
  await audit(row.user_id, "pin_reset_self", "user", row.user_id);
  redirect("/login?reset=1");
}
