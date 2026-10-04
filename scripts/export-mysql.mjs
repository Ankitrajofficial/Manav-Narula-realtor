#!/usr/bin/env node
/**
 * Exports the PostgreSQL database (DATABASE_URL, e.g. Neon) as MySQL/MariaDB files for Hostinger.
 *
 *   node scripts/export-mysql.mjs            → db-mysql/schema.sql (tables only) and db-mysql/data.sql (all rows)
 *   node scripts/export-mysql.mjs --schema   → schema.sql only
 *
 * Import in Hostinger → Databases → phpMyAdmin: select the database, Import schema.sql, then data.sql.
 * The structure is read from the live database, so the files always match the current migrations.
 *
 * data.sql holds leads' phone numbers and the admins' password hashes: it is git-ignored, keep it private.
 * The website code still talks PostgreSQL; these files prepare the database side of the move only.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL || readEnvLocal("DATABASE_URL");
if (!url) {
  console.error("Set DATABASE_URL (or put it in .env.local) to the PostgreSQL database to export.");
  process.exit(1);
}
const schemaOnly = process.argv.includes("--schema");
const outDir = path.join(process.cwd(), "db-mysql");
fs.mkdirSync(outDir, { recursive: true });

const pool = new pg.Pool({ connectionString: url, ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false } });
const q = async (sql, params) => (await pool.query(sql, params)).rows;

function readEnvLocal(key) {
  try {
    const line = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n").find((l) => l.startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim();
  } catch {
    return undefined;
  }
}

const ident = (n) => `\`${n.replace(/`/g, "``")}\``;
const str = (s) => `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/\0/g, "\\0").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\x1a/g, "\\Z")}'`;

// ---------- structure ----------
const tables = (await q("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name")).map((r) => r.table_name);
const columns = await q(`SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default, numeric_precision, numeric_scale, ordinal_position
  FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`);
const constraints = await q(`SELECT c.conrelid::regclass::text AS table_name, c.conname, c.contype, pg_get_constraintdef(c.oid) AS def,
    array(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY k(n, i) JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.n ORDER BY k.i)::text[] AS cols
  FROM pg_constraint c WHERE c.connamespace = 'public'::regnamespace AND c.contype IN ('p','u','f','c') ORDER BY c.conname`);
const indexes = await q(`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname NOT IN (SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace) ORDER BY indexname`);

// Text columns used as keys need a length in MySQL.
const keyed = new Set();
for (const c of constraints) if (c.contype !== "c") for (const col of c.cols) keyed.add(`${c.table_name}.${col}`);
const indexCols = (def) => (def.match(/\(([^()]*)\)\s*$/)?.[1] ?? "").split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
for (const i of indexes) for (const col of indexCols(i.indexdef)) keyed.add(`${i.tablename}.${col}`);

function mysqlType(c) {
  const key = keyed.has(`${c.table_name}.${c.column_name}`);
  switch (c.udt_name) {
    case "int4": return "INT";
    case "int8": return "BIGINT";
    case "int2": return "SMALLINT";
    case "numeric": return c.numeric_precision ? `DECIMAL(${c.numeric_precision},${c.numeric_scale ?? 0})` : "DECIMAL(20,4)";
    case "float4": return "FLOAT";
    case "float8": return "DOUBLE";
    case "bool": return "TINYINT(1)";
    case "text": case "varchar": case "bpchar": return key ? "VARCHAR(255)" : "LONGTEXT";
    case "jsonb": case "json": return "JSON";
    case "timestamptz": case "timestamp": return "DATETIME(6)";
    case "date": return "DATE";
    case "bytea": return "LONGBLOB";
    default: throw new Error(`No MySQL type for ${c.table_name}.${c.column_name} (${c.udt_name})`);
  }
}

/** Default clause; TEXT/JSON/BLOB defaults use the (expression) form both MySQL 8.0.13+ and MariaDB 10.2+ accept. */
function mysqlDefault(c, type) {
  const d = c.column_default;
  if (d == null || /^nextval\(/.test(d)) return "";
  if (/^now\(\)$|^CURRENT_TIMESTAMP/i.test(d)) return " DEFAULT CURRENT_TIMESTAMP(6)";
  if (d === "true" || d === "false") return ` DEFAULT ${d === "true" ? 1 : 0}`;
  if (/^-?\d+(\.\d+)?$/.test(d)) return ` DEFAULT ${d}`;
  const lit = d.match(/^'((?:[^']|'')*)'::[\w ]+$/);
  if (lit) {
    const v = str(lit[1].replace(/''/g, "'"));
    return /TEXT|JSON|BLOB/.test(type) ? ` DEFAULT (${v})` : ` DEFAULT ${v}`;
  }
  throw new Error(`Unsupported default on ${c.table_name}.${c.column_name}: ${d}`);
}

/** CHECK (col = ANY (ARRAY['a'::text, 'b'::text])) → CHECK (`col` IN ('a','b')); anything else is left out with a note. */
function mysqlCheck(def) {
  const m = def.match(/^CHECK \(\((\w+) = ANY \(ARRAY\[(.*)\]\)\)\)$/);
  if (!m) return null;
  const values = [...m[2].matchAll(/'((?:[^']|'')*)'::\w+/g)].map((v) => str(v[1].replace(/''/g, "'")));
  return `CHECK (${ident(m[1])} IN (${values.join(", ")}))`;
}

const autoInc = new Set(columns.filter((c) => /^nextval\(/.test(c.column_default ?? "")).map((c) => `${c.table_name}.${c.column_name}`));
const out = [
  "-- MySQL / MariaDB schema for the Manav Narula Realtor website (Hostinger).",
  `-- Generated by scripts/export-mysql.mjs on ${new Date().toISOString()} from the live PostgreSQL database.`,
  "-- Import this first, then data.sql. Times are stored in UTC.",
  "SET NAMES utf8mb4;",
  "SET time_zone = '+00:00';",
  "SET FOREIGN_KEY_CHECKS = 0;",
  "",
];
const notes = [];
for (const t of tables) {
  const lines = [];
  for (const c of columns.filter((x) => x.table_name === t)) {
    const type = mysqlType(c);
    const ai = autoInc.has(`${t}.${c.column_name}`);
    lines.push(`  ${ident(c.column_name)} ${type}${c.is_nullable === "NO" ? " NOT NULL" : " NULL"}${ai ? " AUTO_INCREMENT" : mysqlDefault(c, type)}`);
  }
  for (const c of constraints.filter((x) => x.table_name === t)) {
    const cols = c.cols.map(ident).join(", ");
    if (c.contype === "p") lines.push(`  PRIMARY KEY (${cols})`);
    else if (c.contype === "u") lines.push(`  UNIQUE KEY ${ident(c.conname)} (${cols})`);
    else if (c.contype === "f") {
      const m = c.def.match(/REFERENCES (\w+)\(([^)]+)\)(.*)$/);
      const actions = (m[3].match(/ON (DELETE|UPDATE) (SET NULL|CASCADE|RESTRICT|NO ACTION|SET DEFAULT)/g) ?? []).join(" ");
      lines.push(`  CONSTRAINT ${ident(c.conname)} FOREIGN KEY (${cols}) REFERENCES ${ident(m[1])} (${m[2].split(",").map((s) => ident(s.trim())).join(", ")})${actions ? ` ${actions}` : ""}`);
    } else if (c.contype === "c") {
      const chk = mysqlCheck(c.def);
      if (chk) lines.push(`  CONSTRAINT ${ident(c.conname)} ${chk}`);
      else notes.push(`-- Not converted (enforced by the app instead): ${t}.${c.conname} ${c.def}`);
    }
  }
  for (const i of indexes.filter((x) => x.tablename === t)) {
    if (!/USING btree \([^()]*\)$/.test(i.indexdef)) { notes.push(`-- Not converted: ${i.indexdef}`); continue; }
    lines.push(`  ${/CREATE UNIQUE/.test(i.indexdef) ? "UNIQUE KEY" : "KEY"} ${ident(i.indexname)} (${indexCols(i.indexdef).map(ident).join(", ")})`);
  }
  out.push(`DROP TABLE IF EXISTS ${ident(t)};`, `CREATE TABLE ${ident(t)} (`, lines.join(",\n"), ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;", "");
}
out.push(...notes, notes.length ? "" : "", "SET FOREIGN_KEY_CHECKS = 1;", "");
fs.writeFileSync(path.join(outDir, "schema.sql"), out.join("\n"));
console.log(`db-mysql/schema.sql: ${tables.length} tables${notes.length ? `, ${notes.length} note(s)` : ""}`);

// ---------- data ----------
if (!schemaOnly) {
  const file = fs.openSync(path.join(outDir, "data.sql"), "w");
  const w = (s) => fs.writeSync(file, s + "\n");
  w("-- Data for the Manav Narula Realtor website. PRIVATE: contains leads' contact details and password hashes.");
  w(`-- Generated by scripts/export-mysql.mjs on ${new Date().toISOString()}. Import after schema.sql.`);
  w("SET NAMES utf8mb4;\nSET time_zone = '+00:00';\nSET FOREIGN_KEY_CHECKS = 0;\nSET UNIQUE_CHECKS = 0;\n");
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const dt = (d) => `'${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}'`;
  let total = 0;
  for (const t of tables) {
    const cols = columns.filter((c) => c.table_name === t);
    // Dates come back as text so DATE columns are not shifted by time zones; timestamps as UTC Date objects.
    const select = cols.map((c) => (c.udt_name === "date" ? `${c.column_name}::text AS "${c.column_name}"` : `"${c.column_name}"`)).join(", ");
    const rows = await q(`SELECT ${select} FROM "${t}"`);
    const value = (c, v) => {
      if (v == null) return "NULL";
      switch (c.udt_name) {
        case "bool": return v ? "1" : "0";
        case "jsonb": case "json": return str(JSON.stringify(v));
        case "timestamptz": case "timestamp": return dt(v);
        case "bytea": return v.length ? `X'${v.toString("hex")}'` : "''";
        case "int4": case "int8": case "int2": case "numeric": case "float4": case "float8": return String(v);
        default: return str(v);
      }
    };
    // One row per statement for files (large BLOBs), batches of 100 otherwise.
    const batch = cols.some((c) => c.udt_name === "bytea") ? 1 : 100;
    const head = `INSERT INTO ${ident(t)} (${cols.map((c) => ident(c.column_name)).join(", ")}) VALUES`;
    if (rows.length) w(`-- ${t}: ${rows.length} row(s)`);
    for (let i = 0; i < rows.length; i += batch) {
      w(`${head}\n${rows.slice(i, i + batch).map((r) => `(${cols.map((c) => value(c, r[c.column_name])).join(", ")})`).join(",\n")};`);
    }
    total += rows.length;
  }
  w("\nSET UNIQUE_CHECKS = 1;\nSET FOREIGN_KEY_CHECKS = 1;");
  fs.closeSync(file);
  console.log(`db-mysql/data.sql: ${total} rows from ${tables.length} tables`);
}
await pool.end();
