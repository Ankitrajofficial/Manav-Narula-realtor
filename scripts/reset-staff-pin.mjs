#!/usr/bin/env node
/**
 * Emergency PIN reset for a staff or admin account, done from the terminal when "Forgot PIN" cannot email a code
 * (for example when MAIL_WEBHOOK_URL on the server is wrong) or when both admins are locked out.
 *
 *   DATABASE_URL=postgres://... node scripts/reset-staff-pin.mjs manav@example.com
 *   node scripts/reset-staff-pin.mjs manav@example.com            # local embedded database (stop `npm run dev` first)
 *
 * Prints a temporary 8-digit PIN. The person signs in with it at the console address and is made to choose their own
 * 6-digit PIN straight away (must_reset). Failed-login counters and any lock are cleared. Nothing is emailed.
 */
import { randomBytes, randomInt, scryptSync } from "node:crypto";
import path from "node:path";

const email = String(process.argv[2] ?? "").trim().toLowerCase();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: node scripts/reset-staff-pin.mjs <email>");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const pin = String(randomInt(10_000_000, 100_000_000)); // 8 digits, never starts with 0
const hash = `${salt}:${scryptSync(pin, salt, 64).toString("hex")}`;

let query, close;
if (process.env.DATABASE_URL) {
  const { Client } = await import("pg");
  const url = process.env.DATABASE_URL;
  const c = new Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
  await c.connect();
  query = (t, p) => c.query(t, p);
  close = () => c.end();
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", ".data", "pglite"));
  await db.waitReady;
  query = (t, p) => db.query(t, p);
  close = () => db.close();
}
try {
  const { rows } = await query("SELECT id, name, role, status FROM users WHERE lower(email) = $1", [email]);
  if (!rows[0]) {
    console.error(`No account with the email ${email}.`);
    process.exit(2);
  }
  const u = rows[0];
  await query("UPDATE users SET password_hash = $1, must_reset = true, pin_set = false, failed_logins = 0, locked_until = NULL, status = 'active' WHERE id = $2", [hash, u.id]);
  await query("INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (NULL, 'password_reset', 'user', $1, $2::jsonb)", [String(u.id), JSON.stringify({ by: "scripts/reset-staff-pin.mjs", email })]);
  console.log(`PIN reset for ${u.name} <${email}> (${u.role}${u.status !== "active" ? ", unblocked" : ""}).`);
  console.log(`Temporary PIN: ${pin}`);
  console.log("They sign in with it once and must then choose their own 6-digit PIN. Share it privately and do not keep this output.");
} finally {
  await close();
}
