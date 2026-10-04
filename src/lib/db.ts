import "server-only";
import fs from "node:fs";
import path from "node:path";

export type Row = Record<string, unknown>;
interface Client {
  query<T = Row>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

const g = globalThis as unknown as { __mnDb?: Promise<Client> };

async function connect(): Promise<Client> {
  let client: Client;
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    // Keep connections open between clicks: opening a new TLS connection to the database costs several round trips.
    // pg's default closes an idle connection after 10 s, so almost every click paid that cost again.
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("localhost") ? undefined : { rejectUnauthorized: false }, max: 10, idleTimeoutMillis: 5 * 60_000, keepAlive: true });
    pool.on("error", (e) => console.error("[db] idle connection error", e.message));
    client = { query: (t, p) => pool.query(t, p as never[]) as unknown as Promise<{ rows: never[] }> };
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = path.join(process.cwd(), ".data", "pglite");
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[db] opening embedded PostgreSQL at ${dir} (pid ${process.pid})`);
    const open = async () => { const db = new PGlite(dir); await db.waitReady; return db; };
    let db: Awaited<ReturnType<typeof open>> | undefined;
    let lastErr: unknown;
    for (let attempt = 0; attempt < 4 && !db; attempt++) {
      try {
        db = await open();
      } catch (err) {
        lastErr = err;
        // A process killed mid-write leaves a stale postmaster.pid, and two openers racing at boot
        // trip over each other: clear the pid file, wait, and try again.
        const pid = path.join(dir, "postmaster.pid");
        if (fs.existsSync(pid)) fs.rmSync(pid);
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    if (!db) throw new Error(`The embedded database in ${dir} could not start (${(lastErr as Error)?.message}). Stop every other dev server or build using it, or delete web/.data to reset to seed data.`);
    client = { query: (t, p) => db.query(t, p as never[]) as Promise<{ rows: never[] }> };
  }
  const statements = (sql: string) => sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
  const schema = fs.readFileSync(path.join(process.cwd(), "src", "db", "schema.sql"), "utf8");
  for (const stmt of statements(schema)) await client.query(stmt);

  // A brand-new database gets the demo data before the migrations, the order every existing database went through,
  // so the migrations' data fixes apply to it and the listings they add are the newest.
  const { rows } = await client.query<{ n: number | string }>("SELECT count(*)::int AS n FROM users");
  if (Number(rows[0].n) === 0) {
    const { seed } = await import("@/db/seed");
    await seed(client);
  }

  // Numbered migrations in src/db/migrations run once each, in file-name order.
  await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  const migrationsDir = path.join(process.cwd(), "src", "db", "migrations");
  const applied = new Set((await client.query<{ name: string }>("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
  for (const file of fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort() : []) {
    if (applied.has(file)) continue;
    console.log(`[db] applying migration ${file}`);
    // Statements are written to be safe to re-run, so a migration interrupted part-way can simply run again.
    for (const stmt of statements(fs.readFileSync(path.join(migrationsDir, file), "utf8"))) await client.query(stmt);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
  }

  const { ensureAdmins } = await import("@/db/admins");
  await ensureAdmins(client);
  return client;
}

export function getDb(): Promise<Client> {
  if (!g.__mnDb) g.__mnDb = connect().catch((e) => { g.__mnDb = undefined; throw e; });
  return g.__mnDb;
}

/** Run a query and return rows. Use $1, $2 placeholders. JSON values must be passed as strings with a ::jsonb cast. */
export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  return (await db.query<T>(text, params)).rows;
}

export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

export const json = (v: unknown) => JSON.stringify(v ?? null);
