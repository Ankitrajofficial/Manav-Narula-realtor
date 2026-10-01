import { hashPassword } from "@/lib/password";

interface Client { query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }> }

/**
 * The two admin accounts (Manav Narula and Komal) are created from environment variables, never from code:
 * ADMIN_MANAV_EMAIL / ADMIN_MANAV_TEMP_PASSWORD and ADMIN_KOMAL_EMAIL / ADMIN_KOMAL_TEMP_PASSWORD.
 * Each is provisioned once (tracked in settings.admin_bootstrap) with must_reset, so the temporary password
 * has to be changed at first sign-in. Manav's slot takes over the seeded demo admin so his history is kept.
 */
const SLOTS = [
  { key: "manav", name: "Manav Narula", emailVar: "ADMIN_MANAV_EMAIL", passwordVar: "ADMIN_MANAV_TEMP_PASSWORD", legacyEmail: "admin@manavnarularealtor.com" },
  { key: "komal", name: "Komal", emailVar: "ADMIN_KOMAL_EMAIL", passwordVar: "ADMIN_KOMAL_TEMP_PASSWORD", legacyEmail: null },
];

export async function ensureAdmins(db: Client) {
  const row = (await db.query<{ value: Record<string, boolean> }>("SELECT value FROM settings WHERE key = 'admin_bootstrap'")).rows[0];
  const done: Record<string, boolean> = row?.value ?? {};
  let changed = false;
  for (const s of SLOTS) {
    if (done[s.key]) continue;
    const email = process.env[s.emailVar]?.trim().toLowerCase();
    const password = process.env[s.passwordVar]?.trim();
    if (!email || !password) {
      console.warn(`[db] ${s.emailVar} / ${s.passwordVar} not set; the ${s.name} admin account was not created`);
      continue;
    }
    if (password.length < 8) {
      console.warn(`[db] ${s.passwordVar} must be at least 8 characters; the ${s.name} admin account was not created`);
      continue;
    }
    const existing = (await db.query<{ id: number }>("SELECT id FROM users WHERE lower(email) = $1", [email])).rows[0];
    const legacy = s.legacyEmail ? (await db.query<{ id: number }>("SELECT id FROM users WHERE lower(email) = $1 AND role = 'admin'", [s.legacyEmail])).rows[0] : undefined;
    let id: number;
    if (existing) {
      id = existing.id;
      await db.query("UPDATE users SET role = 'admin', status = 'active' WHERE id = $1", [id]);
    } else if (legacy) {
      id = legacy.id;
      await db.query("UPDATE users SET name = $1, email = $2, password_hash = $3, must_reset = true, role = 'admin', status = 'active' WHERE id = $4", [s.name, email, hashPassword(password), id]);
    } else {
      id = (await db.query<{ id: number }>("INSERT INTO users (name, email, role, status, password_hash, must_reset) VALUES ($1, $2, 'admin', 'active', $3, true) RETURNING id", [s.name, email, hashPassword(password)])).rows[0].id;
    }
    await db.query("INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (NULL, 'provision_admin', 'user', $1, $2::jsonb)", [String(id), JSON.stringify({ name: s.name, email, from: existing ? "existing account" : legacy ? "seeded admin" : "new" })]);
    done[s.key] = true;
    changed = true;
    console.log(`[db] admin account ready for ${s.name} <${email}> (temporary password must be changed at first sign-in)`);
  }
  if (changed) await db.query("INSERT INTO settings (key, value) VALUES ('admin_bootstrap', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()", [JSON.stringify(done)]);
}
