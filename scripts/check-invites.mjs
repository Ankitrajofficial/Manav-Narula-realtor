#!/usr/bin/env node
/**
 * Shows, for every staff account, whether their sign-in email was sent (from the audit log).
 *
 *   node scripts/check-invites.mjs           → every account, latest email status
 *   node scripts/check-invites.mjs ravi      → only accounts whose name or email contains "ravi", with full history
 *
 * Reads DATABASE_URL (or .env.local). "sent" means Google accepted the email; a wrong address still bounces
 * afterwards, so check the business Gmail inbox for "Mail Delivery Subsystem" if someone says it never arrived.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const envLocal = (k) => { try { return fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n").find((l) => l.startsWith(`${k}=`))?.slice(k.length + 1).trim(); } catch { return undefined; } };
const url = process.env.DATABASE_URL || envLocal("DATABASE_URL");
if (!url) { console.error("Set DATABASE_URL or run from the web folder (it reads .env.local)."); process.exit(1); }
const filter = process.argv[2]?.toLowerCase();

process.removeAllListeners("warning");
const pool = new pg.Pool({ connectionString: url, ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false } });
const LABEL = { invite_sent: "✅ welcome email sent", invite_failed: "❌ welcome email FAILED", reset_email_sent: "✅ reset email sent", reset_email_failed: "❌ reset email FAILED", invite_skipped: "– not emailed" };
const when = (d) => new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const users = (await pool.query(
  `SELECT u.id, u.name, u.email, u.role, u.status, u.must_reset, u.last_login_at, u.created_at FROM users u
   ${filter ? "WHERE lower(u.name) LIKE $1 OR lower(u.email) LIKE $1" : ""} ORDER BY u.created_at DESC`, filter ? [`%${filter}%`] : [])).rows;
const events = (await pool.query(
  `SELECT entity_id::int AS user_id, action, details, created_at FROM audit_log
   WHERE entity = 'user' AND action IN ('invite_sent','invite_failed','reset_email_sent','reset_email_failed') ORDER BY created_at DESC`)).rows;

if (!users.length) console.log(filter ? `No account matches "${filter}".` : "No accounts.");
for (const u of users) {
  const mine = events.filter((e) => e.user_id === u.id);
  const latest = mine[0];
  const signedIn = u.last_login_at ? `signed in ${when(u.last_login_at)}${u.must_reset ? " (still on temporary password)" : ""}` : "never signed in";
  console.log(`\n${u.name} <${u.email}>  ${u.role}${u.status !== "active" ? ` · ${u.status}` : ""} · added ${when(u.created_at)} · ${signedIn}`);
  console.log(`  ${latest ? `${LABEL[latest.action]} · ${when(latest.created_at)}${latest.details?.error ? ` · ${latest.details.error}` : ""}` : "– no sign-in email on record (added before email was connected, or the box was unticked)"}`);
  if (filter) for (const e of mine.slice(1)) console.log(`    earlier: ${LABEL[e.action]} · ${when(e.created_at)}${e.details?.error ? ` · ${e.details.error}` : ""}`);
}
console.log("");
await pool.end();
