import "server-only";
import { one, q } from "@/lib/db";
import { addDays, todayIST } from "@/lib/dates";
import { getSetting } from "@/lib/queries/common";

/**
 * Automatic lead batches. Each active intern, employee and executive with auto-assign on holds one open batch of
 * unassigned leads (default 5, oldest first) plus a task listing them. A batch is complete once every lead in it
 * still assigned to that person has moved past "New"; the task is then ticked done and the next batch goes out.
 * A batch that started short (the pool ran dry) is topped up as new leads arrive.
 */
export interface AutoAssignConfig { enabled: boolean; batch_size: number }
export const DEFAULT_AUTO_ASSIGN: AutoAssignConfig = { enabled: false, batch_size: 5 };
export async function autoAssignConfig(): Promise<AutoAssignConfig> {
  const v = await getSetting<Partial<AutoAssignConfig>>("auto_assign", DEFAULT_AUTO_ASSIGN);
  const size = Math.round(Number(v.batch_size));
  return { enabled: v.enabled === true, batch_size: size >= 1 && size <= 50 ? size : DEFAULT_AUTO_ASSIGN.batch_size };
}

interface Person { id: number; name: string }
interface OpenBatch { id: number; task_id: number | null; held: number; pending: number }

/** Claims up to `n` unassigned new leads for a batch. The `assigned_to IS NULL` guard makes two runs at once safe. */
async function claimLeads(userId: number, batchId: number, n: number): Promise<number[]> {
  if (n <= 0) return [];
  const rows = await q<{ id: number }>(
    // The pick runs once as a CTE: inside `WHERE id IN (...)` Postgres may re-run a LIMIT ... SKIP LOCKED subquery and claim more than n.
    `WITH picked AS MATERIALIZED (SELECT id FROM leads WHERE assigned_to IS NULL AND status = 'New' ORDER BY created_at, id LIMIT $3 FOR UPDATE SKIP LOCKED)
     UPDATE leads l SET assigned_to = $1, batch_id = $2, updated_at = now()
     FROM picked WHERE l.id = picked.id AND l.assigned_to IS NULL
     RETURNING l.id`,
    [userId, batchId, n],
  );
  return rows.map((r) => r.id);
}

async function logAssigned(leadIds: number[], person: Person, batchId: number) {
  for (const id of leadIds) {
    await q("INSERT INTO lead_activities (lead_id, type, body) VALUES ($1, 'assign', $2)", [id, `Auto-assigned to ${person.name} (batch #${batchId})`]);
    await q("UPDATE leads SET last_activity_at = now() WHERE id = $1", [id]);
  }
}

async function linkToTask(taskId: number | null, leadIds: number[]) {
  if (!taskId) return;
  for (const id of leadIds) await q("INSERT INTO task_records (task_id, lead_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM task_records WHERE task_id = $1 AND lead_id = $2)", [taskId, id]);
  await q("UPDATE tasks SET lead_id = COALESCE(lead_id, $2), updated_at = now() WHERE id = $1", [taskId, leadIds[0] ?? null]);
}

async function openBatch(userId: number): Promise<OpenBatch | null> {
  return one<OpenBatch>(
    `SELECT b.id, b.task_id,
       (SELECT count(*)::int FROM leads l WHERE l.batch_id = b.id AND l.assigned_to = b.user_id) AS held,
       (SELECT count(*)::int FROM leads l WHERE l.batch_id = b.id AND l.assigned_to = b.user_id AND l.status = 'New') AS pending
     FROM lead_batches b WHERE b.user_id = $1 AND b.completed_at IS NULL`,
    [userId],
  );
}

async function completeBatch(b: OpenBatch) {
  await q("UPDATE lead_batches SET completed_at = now() WHERE id = $1 AND completed_at IS NULL", [b.id]);
  if (b.task_id) await q("UPDATE tasks SET status = 'Done', updated_at = now() WHERE id = $1 AND status <> 'Done'", [b.task_id]);
}

/** Starts a new batch for one person. Returns how many leads they received. */
async function startBatch(person: Person, size: number): Promise<number> {
  const batch = await one<{ id: number }>("INSERT INTO lead_batches (user_id, size) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id", [person.id, size]);
  if (!batch) return 0; // Another run opened one a moment ago.
  const leadIds = await claimLeads(person.id, batch.id, size);
  if (!leadIds.length) { await q("DELETE FROM lead_batches WHERE id = $1", [batch.id]); return 0; }
  const n = await one<{ n: number }>("SELECT count(*)::int AS n FROM lead_batches WHERE user_id = $1", [person.id]);
  const task = await one<{ id: number }>(
    "INSERT INTO tasks (title, assigned_to, due_date, priority, status) VALUES ($1, $2, $3, 'normal', 'Open') RETURNING id",
    [`Contact your new leads (batch ${n?.n ?? 1})`, person.id, addDays(todayIST(), 2)],
  );
  await q("UPDATE lead_batches SET task_id = $1 WHERE id = $2", [task!.id, batch.id]);
  await linkToTask(task!.id, leadIds);
  await logAssigned(leadIds, person, batch.id);
  return leadIds.length;
}

/** What one pass did, for the confirmation shown after an action. */
export interface AssignResult { ran: boolean; failed?: boolean; assigned: number; given: { name: string; n: number }[]; completed: string[]; eligible: number; busy: number; pool: number }
const NOT_RUN: AssignResult = { ran: false, assigned: 0, given: [], completed: [], eligible: 0, busy: 0, pool: 0 };

/** Closes finished batches, tops up short ones and hands out the next batch. */
async function runOnce(force = false): Promise<AssignResult> {
  const cfg = await autoAssignConfig();
  if (!cfg.enabled && !force) return NOT_RUN;
  // Whoever has waited longest since their last batch goes first, so a short pool is shared fairly.
  const people = await q<Person>(
    `SELECT u.id, u.name FROM users u
     WHERE u.role = 'employee' AND u.status = 'active' AND u.auto_assign AND NOT u.must_reset
     ORDER BY (SELECT max(b.created_at) FROM lead_batches b WHERE b.user_id = u.id) ASC NULLS FIRST, u.id`,
  );
  const given = new Map<string, number>();
  const completed: string[] = [];
  const give = (name: string, n: number) => { if (n) given.set(name, (given.get(name) ?? 0) + n); };
  for (const p of people) {
    const b = await openBatch(p.id);
    if (b && b.pending === 0) {
      await completeBatch(b);
      completed.push(p.name);
    } else if (b) {
      if (b.held < cfg.batch_size) {
        const extra = await claimLeads(p.id, b.id, cfg.batch_size - b.held);
        await linkToTask(b.task_id, extra);
        await logAssigned(extra, p, b.id);
        give(p.name, extra.length);
      }
      continue;
    }
    give(p.name, await startBatch(p, cfg.batch_size));
  }
  const [pool, busy] = await Promise.all([
    unassignedPool(),
    one<{ n: number }>("SELECT count(*)::int AS n FROM lead_batches b JOIN users u ON u.id = b.user_id WHERE b.completed_at IS NULL AND u.role = 'employee' AND u.status = 'active' AND u.auto_assign"),
  ]);
  const list = [...given].map(([name, n]) => ({ name, n }));
  return { ran: true, assigned: list.reduce((t, x) => t + x.n, 0), given: list, completed, eligible: people.length, busy: Number(busy?.n ?? 0), pool };
}

// One run at a time per server process; overlapping triggers wait for the current run.
const g = globalThis as unknown as { __mnAutoAssign?: Promise<unknown> };

/** Safe to call after any lead change: never throws, logs failures. `force` runs even while auto-assign is switched off. */
export function runAutoAssign(opts: { force?: boolean } = {}): Promise<AssignResult> {
  const run = (g.__mnAutoAssign ?? Promise.resolve()).catch(() => undefined).then(() => runOnce(opts.force));
  g.__mnAutoAssign = run;
  return run.catch((e) => { console.error("[auto-assign] failed", e); return { ...NOT_RUN, failed: true }; });
}

const leads = (n: number) => `${n} ${n === 1 ? "lead" : "leads"}`;

/**
 * One line for the toast: who received leads, or why nobody did ("No employee is free..."). `me` turns the viewer's
 * own name into "you". With `quiet`, a pass that changed nothing returns "" so routine actions are not cluttered.
 */
export function describeAssign(r: AssignResult, opts: { me?: string; quiet?: boolean } = {}): string {
  const who = (name: string) => (name === opts.me ? "you" : name.split(" ")[0]);
  if (r.failed) return "Auto-assign could not run; check the server log";
  if (!r.ran) return opts.quiet ? "" : "Auto-assign is off";
  if (r.assigned) {
    const parts = r.given.length > 3 ? [`${leads(r.assigned)} shared between ${r.given.length} people`] : r.given.map((x, i) => (i === 0 ? `${leads(x.n)} assigned to ${who(x.name)}` : `${x.n} to ${who(x.name)}`));
    const done = r.completed.length ? `Batch complete${r.completed.length === 1 ? "" : "s"}: ` : "";
    return done + parts.join(", ");
  }
  if (opts.quiet) return "";
  if (!r.pool) return "No new leads waiting to hand out";
  if (!r.eligible) return `No one can receive leads: no active intern or employee has auto-assign on. ${leads(r.pool)} waiting`;
  return `No employee is free: ${r.eligible === 1 ? "the only one is" : `all ${r.eligible} are`} still working a batch. ${leads(r.pool)} waiting`;
}

export interface BatchStatus { user_id: number; name: string; email: string; level: string; auto_assign: boolean; must_reset: boolean; batch_id: number | null; batch_started: Date | null; held: number; contacted: number; completed: number }
/** Per-person view for the admin Auto-assign page. */
export const batchOverview = () => q<BatchStatus>(
  `SELECT u.id AS user_id, u.name, u.email, u.level, u.auto_assign, u.must_reset,
     b.id AS batch_id, b.created_at AS batch_started,
     COALESCE((SELECT count(*)::int FROM leads l WHERE l.batch_id = b.id AND l.assigned_to = u.id), 0) AS held,
     COALESCE((SELECT count(*)::int FROM leads l WHERE l.batch_id = b.id AND l.assigned_to = u.id AND l.status <> 'New'), 0) AS contacted,
     (SELECT count(*)::int FROM lead_batches c WHERE c.user_id = u.id AND c.completed_at IS NOT NULL) AS completed
   FROM users u LEFT JOIN lead_batches b ON b.user_id = u.id AND b.completed_at IS NULL
   WHERE u.role = 'employee' AND u.status = 'active'
   ORDER BY u.name`,
);

export interface MyBatch { batch_id: number; task_id: number | null; created_at: Date; leads: { id: number; name: string; phone: string; status: string }[]; completed: number }
export async function myBatch(userId: number): Promise<MyBatch | null> {
  const b = await one<{ id: number; task_id: number | null; created_at: Date }>("SELECT id, task_id, created_at FROM lead_batches WHERE user_id = $1 AND completed_at IS NULL", [userId]);
  const done = await one<{ n: number }>("SELECT count(*)::int AS n FROM lead_batches WHERE user_id = $1 AND completed_at IS NOT NULL", [userId]);
  if (!b) return null;
  const leads = await q<{ id: number; name: string; phone: string; status: string }>("SELECT id, name, phone, status FROM leads WHERE batch_id = $1 AND assigned_to = $2 ORDER BY status = 'New' DESC, created_at", [b.id, userId]);
  return { batch_id: b.id, task_id: b.task_id, created_at: b.created_at, leads, completed: Number(done?.n ?? 0) };
}

export const unassignedPool = async () => Number((await one<{ n: number }>("SELECT count(*)::int AS n FROM leads WHERE assigned_to IS NULL AND status = 'New'"))?.n ?? 0);
