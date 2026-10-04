import "server-only";
import { site } from "@/data/site";

/**
 * Sends email through MAIL_WEBHOOK_URL: a Google Apps Script web app (integrations/google-mail.gs) running on the
 * business Gmail, so mail goes out from that address. The URL carries ?key=<secret>. Never throws: returns the outcome.
 */
export type MailResult = { ok: true } | { ok: false; error: string };

// https only, except a local test receiver.
export const mailConfigured = () => /^(https:\/\/|http:\/\/(127\.0\.0\.1|localhost)[:/])/i.test(process.env.MAIL_WEBHOOK_URL?.trim() ?? "");

export async function sendMail(msg: { to: string; subject: string; html: string; text: string }): Promise<MailResult> {
  const url = process.env.MAIL_WEBHOOK_URL?.trim();
  if (!url || !mailConfigured()) return { ok: false, error: "Email is not connected (MAIL_WEBHOOK_URL is not set)." };
  try {
    const res = await fetch(url, {
      method: "POST",
      // Apps Script answers POSTs with a redirect to the result; fetch follows it.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...msg, name: site.name }),
      signal: AbortSignal.timeout(20000),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    return res.ok && j.ok ? { ok: true } : { ok: false, error: j.error || `Mail service answered ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reach the mail service." };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The staff sign-in address: the private console address when CONSOLE_PATH is set, otherwise /login. */
export function signInUrl(): string {
  const slug = process.env.CONSOLE_PATH?.trim().replace(/^\/+|\/+$/g, "");
  const base = (process.env.PUBLIC_URL || site.url).replace(/\/$/, "");
  return `${base}/${slug || "login"}`;
}

/** Welcome email (new account) or reset email with the temporary password. */
export function credentialsEmail(p: { name: string; email: string; password: string; role: string; reset?: boolean }) {
  const url = signInUrl();
  const first = p.name.split(" ")[0] || p.name;
  const subject = p.reset ? `Your new ${site.name} password` : `Your ${site.name} staff account`;
  const intro = p.reset
    ? "Your password for the staff console has been reset. Sign in with the temporary password below."
    : `An ${p.role === "admin" ? "admin" : "employee"} account has been created for you on the ${site.name} staff console.`;
  const text = [`Hello ${first},`, "", intro, "", `Sign in at: ${url}`, `Email: ${p.email}`, `Temporary password: ${p.password}`, "",
    "You will be asked to choose your own password when you sign in. Do not share this email.", "", site.name].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1a1a;max-width:520px">
<p>Hello ${esc(first)},</p><p>${esc(intro)}</p>
<table style="border-collapse:collapse;margin:16px 0">
<tr><td style="padding:6px 16px 6px 0;color:#666">Sign in at</td><td style="padding:6px 0"><a href="${esc(url)}">${esc(url)}</a></td></tr>
<tr><td style="padding:6px 16px 6px 0;color:#666">Email</td><td style="padding:6px 0">${esc(p.email)}</td></tr>
<tr><td style="padding:6px 16px 6px 0;color:#666">Temporary password</td><td style="padding:6px 0;font-family:monospace;font-size:17px">${esc(p.password)}</td></tr>
</table>
<p><a href="${esc(url)}" style="display:inline-block;background:#00BF63;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">Sign in</a></p>
<p style="color:#666;font-size:13px">You will be asked to choose your own password when you sign in. Do not share this email.</p>
<p>${esc(site.name)}</p></div>`;
  return { to: p.email, subject, html, text };
}
