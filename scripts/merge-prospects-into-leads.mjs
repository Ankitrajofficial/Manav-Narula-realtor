#!/usr/bin/env node
/**
 * Moves every prospect into leads, with its history. Never runs on its own: not part of deploys or migrations.
 *
 *   node scripts/merge-prospects-into-leads.mjs                                  # local database, shows the plan, changes nothing
 *   node scripts/merge-prospects-into-leads.mjs --apply --backup <new-file>.json # does it
 *   DATABASE_URL=postgres://... node scripts/merge-prospects-into-leads.mjs      # same against a server database
 *
 * A number already in leads joins that lead: blank fields are filled in, tags combined, notes kept, and the lead's own status
 * and WhatsApp opt-in stay as they are. Everything runs in one transaction and is checked before committing; any mismatch undoes it all.
 * Stop `npm run dev` first when using the local database. Take a full database backup first on a server database.
 */
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const backupAt = args.indexOf("--backup");
const backupFile = backupAt >= 0 ? args[backupAt + 1] : null;
if (apply && !backupFile) { console.error("--apply needs --backup <new-file>.json"); process.exit(1); }
if (backupFile && existsSync(backupFile)) { console.error(`${backupFile} already exists; choose a new file.`); process.exit(1); }

let query, close;
if (process.env.DATABASE_URL) {
  const { Client } = await import("pg");
  const url = process.env.DATABASE_URL;
  const c = new Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
  await c.connect();
  query = (t, p) => c.query(t, p);
  close = () => c.end();
  console.log(`Database: ${new URL(url).hostname}${new URL(url).pathname}`);
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", ".data", "pglite"));
  await db.waitReady;
  query = (t, p) => db.query(t, p);
  close = () => db.close();
  console.log("Database: local embedded");
}
const rows = async (t, p) => (await query(t, p)).rows;
const count = async (t, p) => Number((await rows(t, p))[0].n);
const LINKED = ["lead_activities", "tasks", "task_records", "sales", "campaign_messages"];
const mask = (p) => `${String(p).slice(0, 5)}•••••${String(p).slice(-3)}`;

try {
  const prospects = await rows("SELECT * FROM prospects ORDER BY id");
  const matches = await rows("SELECT p.id AS prospect_id, p.name AS prospect_name, p.phone, min(l.id) AS lead_id, count(l.id)::int AS leads FROM prospects p JOIN leads l ON l.phone = p.phone GROUP BY p.id, p.name, p.phone ORDER BY p.id");
  const linked = {};
  for (const t of LINKED) linked[t] = await count(`SELECT count(*)::int AS n FROM ${t} WHERE prospect_id IS NOT NULL`);
  const leadsBefore = await count("SELECT count(*)::int AS n FROM leads");
  console.log(`\nProspects: ${prospects.length}`);
  console.log(`  become new leads: ${prospects.length - matches.length}`);
  console.log(`  number already in leads, joined to that lead: ${matches.length}`);
  for (const m of matches) console.log(`    prospect #${m.prospect_id} ${m.prospect_name} ${mask(m.phone)} -> lead #${m.lead_id}${m.leads > 1 ? ` (the oldest of ${m.leads} leads with this number)` : ""}`);
  console.log(`Linked rows that move with them: ${LINKED.map((t) => `${t} ${linked[t]}`).join(", ")}`);
  console.log(`Leads now: ${leadsBefore}. After: ${leadsBefore + prospects.length - matches.length}.`);
  if (!apply) { console.log("\nNothing changed. Run with --apply --backup <new-file>.json to do it."); process.exitCode = 0; }
  else if (!prospects.length) console.log("\nNothing to merge.");
  else {
    const backup = { taken_at: new Date().toISOString(), prospects };
    for (const t of LINKED) backup[t] = await rows(`SELECT * FROM ${t} WHERE prospect_id IS NOT NULL`);
    writeFileSync(backupFile, JSON.stringify(backup, null, 1), { mode: 0o600 });
    console.log(`\nBackup of the affected rows: ${backupFile} (holds personal data; keep it private)`);

    await query("BEGIN");
    try {
      let created = 0, joined = 0;
      for (const p of prospects) {
        const found = await rows("SELECT id, notes FROM leads WHERE phone = $1 ORDER BY id LIMIT 1", [p.phone]);
        let leadId;
        if (found[0]) {
          leadId = found[0].id;
          const notes = p.notes && p.notes !== found[0].notes ? [found[0].notes, `From prospect #${p.id}: ${p.notes}`].filter(Boolean).join("\n") : found[0].notes;
          await query(`UPDATE leads SET email = COALESCE(email, $2), interest = COALESCE(interest, $3), budget = COALESCE(budget, $4), locality = COALESCE(locality, $5),
            assigned_to = COALESCE(assigned_to, $6), project_id = COALESCE(project_id, $7), next_follow_up_at = COALESCE(next_follow_up_at, $8), notes = $9,
            tags = (SELECT COALESCE(jsonb_agg(DISTINCT v), '[]'::jsonb) FROM jsonb_array_elements(tags || $10::jsonb) v),
            merged_from_prospect_id = COALESCE(merged_from_prospect_id, $11), updated_at = now() WHERE id = $1`,
            [leadId, p.email, p.interest, p.budget, p.locality, p.assigned_to, p.project_id, p.next_follow_up_at, notes, JSON.stringify(p.tags ?? []), p.id]);
          joined++;
        } else {
          leadId = (await rows(`INSERT INTO leads (name, phone, email, interest, budget, locality, source, status, assigned_to, created_by, notes, tags, whatsapp_opt_in, project_id,
            next_follow_up_at, last_activity_at, created_at, updated_at, merged_from_prospect_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
            [p.name, p.phone, p.email, p.interest, p.budget, p.locality, p.source, p.status, p.assigned_to, p.added_by, p.notes, JSON.stringify(p.tags ?? []), p.whatsapp_opt_in, p.project_id,
              p.next_follow_up_at, p.last_contacted_at ?? p.updated_at, p.created_at, p.updated_at, p.id]))[0].id;
          created++;
        }
        await query("UPDATE lead_activities SET lead_id = $1, prospect_id = NULL WHERE prospect_id = $2", [leadId, p.id]);
        await query("UPDATE tasks SET lead_id = COALESCE(lead_id, $1), prospect_id = NULL WHERE prospect_id = $2", [leadId, p.id]);
        await query("DELETE FROM task_records r WHERE r.prospect_id = $2 AND EXISTS (SELECT 1 FROM task_records o WHERE o.task_id = r.task_id AND o.lead_id = $1)", [leadId, p.id]);
        await query("UPDATE task_records SET lead_id = $1, prospect_id = NULL WHERE prospect_id = $2", [leadId, p.id]);
        await query("UPDATE sales SET lead_id = COALESCE(lead_id, $1), prospect_id = NULL WHERE prospect_id = $2", [leadId, p.id]);
        await query("UPDATE campaign_messages SET lead_id = COALESCE(lead_id, $1), prospect_id = NULL WHERE prospect_id = $2", [leadId, p.id]);
        await query("INSERT INTO lead_activities (lead_id, type, body) VALUES ($1, 'note', $2)", [leadId, `Merged from prospect #${p.id}${found[0] ? ` (it was ${p.status})` : ""}`]);
      }
      await query("DELETE FROM prospects");
      await query("INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (NULL, 'merge_prospects', 'lead', NULL, $1::jsonb)", [JSON.stringify({ by: "scripts/merge-prospects-into-leads.mjs", created, joined })]);
      // Checks before anything is kept.
      const leadsAfter = await count("SELECT count(*)::int AS n FROM leads");
      if (leadsAfter !== leadsBefore + created) throw new Error(`leads: expected ${leadsBefore + created}, found ${leadsAfter}`);
      if (await count("SELECT count(*)::int AS n FROM prospects")) throw new Error("prospects left behind");
      for (const t of LINKED) if (await count(`SELECT count(*)::int AS n FROM ${t} WHERE prospect_id IS NOT NULL`)) throw new Error(`${t} still points at prospects`);
      if (await count("SELECT count(*)::int AS n FROM leads WHERE merged_from_prospect_id IS NOT NULL") < prospects.length) throw new Error("some prospects have no matching lead");
      await query("COMMIT");
      console.log(`Done: ${created} new leads, ${joined} joined to existing leads. Leads: ${leadsBefore} -> ${leadsAfter}.`);
    } catch (e) { await query("ROLLBACK"); console.error(`Stopped and undone: ${e.message}`); process.exitCode = 1; }
  }
} finally { await close(); }
