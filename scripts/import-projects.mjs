#!/usr/bin/env node
/**
 * Imports developer projects into the `projects` table (see src/lib/project-import.ts for the rules).
 *
 *   node scripts/import-projects.mjs            # local embedded database (stop `npm run dev` first)
 *   node scripts/import-projects.mjs --dry-run  # same, but rolls everything back and only prints the report
 *   DATABASE_URL=postgres://... node scripts/import-projects.mjs   # a Postgres database such as Neon
 *
 * Inputs: data/mexmon/projects.json (raw scrape, not in git) and data/projects-copy.json (our copy). AGI projects are
 * built from their property listings; their images are copied from public/properties/<listing>/ to public/projects/<slug>/.
 * Mexmon images come from data/mexmon/<page>/images_manifest.json, placed by their use_on_site label with suggested_alt as
 * alt text; data/project-image-corrections.json fixes images the scraper labelled wrongly. They are copied into
 * public/projects/<slug>/ as <section>-NN.<ext>. Logos and icons are never used.
 * Projects are created as drafts. Start the app once beforehand so migrations 031 and 032 have run.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildAgiFacts, buildMexmonFacts, copyOverlap, flattenPages, importProjects } from "../src/lib/project-import.ts";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dryRun = process.argv.includes("--dry-run");
// projects_tree.json (projects with their sub-projects) is preferred; the flat projects.json still works.
const treePath = path.join(root, "data", "mexmon", "projects_tree.json");
const rawPath = fs.existsSync(treePath) ? treePath : path.join(root, "data", "mexmon", "projects.json");
const copyPath = path.join(root, "data", "projects-copy.json");
const correctionsPath = path.join(root, "data", "project-image-corrections.json");

/** Every image in the scraper's manifests, with a content hash so corrections survive file renames. */
function loadManifests(dir) {
  const out = [];
  const manifests = fs.readdirSync(dir, { recursive: true }).filter((f) => path.basename(String(f)) === "images_manifest.json");
  for (const rel of manifests) {
    const file = path.join(dir, String(rel));
    const m = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const i of m.images ?? []) {
      const abs = path.join(dir, i.file ?? "");
      if (!i.file || !fs.existsSync(abs)) continue;
      const hash = crypto.createHash("sha1").update(fs.readFileSync(abs)).digest("hex").slice(0, 12);
      out.push({ page: m.source_url, file: i.file, label: /^skip/i.test(i.use_on_site ?? "") && i.label !== "logo" ? "skip" : i.label, suggested_alt: i.suggested_alt || i.alt || "", width: i.width ?? null, hash });
    }
  }
  return out;
}

async function openDb() {
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import("pg");
    const url = process.env.DATABASE_URL;
    const client = new pg.Client({ connectionString: url, ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false } });
    await client.connect();
    return { label: "Postgres (DATABASE_URL)", db: client, close: () => client.end() };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(path.join(root, ".data", "pglite"));
  await db.waitReady;
  return { label: "local embedded database (.data/pglite)", db, close: () => db.close() };
}

const { label, db, close } = await openDb();
console.log(`Importing into the ${label}${dryRun ? " — DRY RUN, nothing will be saved" : ""}\n`);
try {
  const cols = (await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name IN ('floor_plans', 'edited_fields', 'units')")).rows;
  if (cols.length < 3) throw new Error("The projects table is missing the new columns. Start the app once (npm run dev) so migrations 031 to 034 run, then try again.");
  if (!fs.existsSync(rawPath)) throw new Error(`Missing ${path.relative(root, rawPath)}. Copy the Mexmon scrape there first.`);

  const pages = JSON.parse(fs.readFileSync(rawPath, "utf8"));
  const copy = JSON.parse(fs.readFileSync(copyPath, "utf8"));
  const manifestImages = loadManifests(path.dirname(rawPath));
  const corrections = fs.existsSync(correctionsPath) ? JSON.parse(fs.readFileSync(correctionsPath, "utf8")) : {};

  // AGI files move from /properties/<listing>/ to /projects/<slug>/ (copied; the listing keeps its own until it is retired).
  const copied = [];
  const moveUrl = (url, slug) => {
    if (!url.startsWith("/properties/")) return url;
    const to = `/projects/${slug}/${path.basename(url)}`;
    const src = path.join(root, "public", url), dest = path.join(root, "public", to);
    if (!dryRun && fs.existsSync(src) && !fs.existsSync(dest)) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(src, dest); copied.push(to); }
    return to;
  };

  const facts = [...buildMexmonFacts(pages, manifestImages, corrections), ...(await buildAgiFacts(db, moveUrl))];
  // Mexmon images placed from the manifests are copied from the scrape into public/projects/<slug>/.
  for (const f of facts) for (const file of [...f.files, ...f.units.flatMap((u) => u.files)]) {
    const src = path.join(path.dirname(rawPath), file.from), dest = path.join(root, "public", file.to);
    if (!fs.existsSync(src)) { f.toConfirm.push(`Image missing in the scrape: ${file.from}`); continue; }
    if (!dryRun && !fs.existsSync(dest)) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(src, dest); copied.push(file.to); }
  }
  console.log(`Source: ${path.basename(rawPath)}, ${flattenPages(pages).length} Mexmon pages -> ${facts.filter((f) => f.developer === "Mexmon Group").length} projects; ${facts.filter((f) => f.developer === "AGI Infra").length} AGI listings\n`);

  await db.query("BEGIN");
  const results = await importProjects(db, facts, copy);
  await db.query(dryRun ? "ROLLBACK" : "COMMIT");

  for (const r of results) {
    const f = facts.find((x) => x.slug === r.slug);
    const o = copyOverlap(copy[r.slug] ?? {}, f.sourceText, [f.name, f.developer, f.address, f.locality, f.city]);
    console.log(`${r.action.toUpperCase().padEnd(9)} ${r.name}  (/projects/${r.slug})`);
    console.log(`          RERA: ${f.rera ?? "—"} | ${f.configurations.map((c) => c.type + (c.area ? ` ${c.area}` : "")).join(", ")}`);
    console.log(`          facts: ${f.key_facts.map((k) => `${k.label}: ${k.value}`).join("; ") || "—"}`);
    if (r.updated.length) console.log(`          updated: ${r.updated.join(", ")}`);
    if (r.factsUpdated.length) console.log(`          facts updated: ${r.factsUpdated.join(", ")}`);
    if (r.keptEdited.length) console.log(`          kept your edits: ${r.keptEdited.join(", ")}`);
    console.log(`          copy overlap with developer text: ${Math.round(o.worst * 100)}%${o.worst > 0.3 ? `  <-- REWRITE: "${o.sentence.slice(0, 90)}…"` : " (ok, under 30%)"}`);
    if (f.media.length) {
      const byKind = {};
      for (const m of f.media) byKind[m.kind] = (byKind[m.kind] ?? 0) + 1;
      console.log(`          images: ${Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(", ")}${r.updated.includes("media") || r.action === "created" ? "" : " (not applied: the project already has images)"}`);
    }
    for (const p of f.placements) {
      const changed = p.applied !== p.manifestLabel;
      console.log(`            ${p.applied === "skipped" ? "skip " : "use  "} ${path.basename(p.file)}  manifest: ${p.manifestLabel}${changed ? ` -> ${p.applied}` : ""}${p.why ? `  (${p.why})` : ""}`);
    }
    for (const u of f.units) {
      const uo = copyOverlap(copy[r.slug]?.units?.[u.slug] ?? {}, u.sourceText, [f.name, f.developer, f.address, f.locality, f.city]);
      console.log(`          unit ${u.label.padEnd(10)} /projects/${r.slug}/${u.slug}  RERA ${u.rera ?? "—"} (${u.rera_source})  images: ${u.media.map((m) => m.kind).join(", ") || "none"}  copy overlap ${Math.round(uo.worst * 100)}%${uo.worst > 0.3 ? " <-- REWRITE" : ""}`);
    }
    for (const sp of f.skippedPages) console.log(`          sub-page skipped: ${sp.url} (${sp.why})`);
    for (const t of r.toConfirm) console.log(`          to confirm: ${t}`);
    console.log("");
  }
  if (copied.length) console.log(`Copied ${copied.length} image/plan files into public/projects/.`);
  const kept = results.reduce((n, r) => n + r.keptEdited.length, 0), changed = results.reduce((n, r) => n + r.factsUpdated.length, 0);
  console.log(`\nSummary: ${results.length} projects, ${results.filter((r) => r.action === "created").length} created, ${changed} facts updated, ${kept} edited fields kept.`);

  // RERA, status and possession as imported, for the person who confirms them before publishing.
  console.log("\nRERA / status / possession as imported:");
  const rows = [];
  for (const f of facts) {
    rows.push([f.name, "project", f.rera ?? "—", f.rera_source, f.status, "—"]);
    for (const u of f.units) rows.push([`  ${f.name} › ${u.label}`, "unit type", u.rera ?? "—", u.rera_source, f.status, "—"]);
  }
  const w = [0, 1, 2, 3, 4, 5].map((i) => Math.max(...rows.map((r) => r[i].length), 8));
  for (const r of rows) console.log("  " + r.map((c, i) => c.padEnd(w[i])).join("  "));
} catch (e) {
  await db.query("ROLLBACK").catch(() => {});
  console.error(`\nImport failed: ${e.message}`);
  process.exitCode = 1;
} finally {
  await close();
}
