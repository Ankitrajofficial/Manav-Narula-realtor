"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { audit } from "@/lib/records";
import { describeAssign, runAutoAssign } from "@/lib/auto-assign";
import { setSetting } from "@/lib/queries/settings";

const to = (path: string, msg: string, kind: "toast" | "error" = "toast") => `${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`;

export async function saveAutoAssign(fd: FormData) {
  const user = await requireUser("admin");
  const size = Math.round(Number(fd.get("batch_size")));
  if (!(size >= 1 && size <= 50)) redirect(to("/admin/auto-assign", "Batch size is 1 to 50 leads", "error"));
  const enabled = fd.get("enabled") === "on";
  await setSetting("auto_assign", { enabled, batch_size: size });
  await audit(user.id, "update", "setting", "auto_assign", { enabled, batch_size: size });
  const msg = enabled ? describeAssign(await runAutoAssign()) : "";
  redirect(to("/admin/auto-assign", `Saved: auto-assign ${enabled ? "on" : "off"}, batches of ${size}${msg ? `. ${msg}` : ""}`));
}

/** Runs one pass now (even while switched off) and reports how many leads went out. */
export async function runAutoAssignNow() {
  const user = await requireUser("admin");
  const r = await runAutoAssign({ force: true });
  await audit(user.id, "run", "auto_assign", null, { assigned: r.assigned });
  redirect(to("/admin/auto-assign", describeAssign(r), r.failed ? "error" : "toast"));
}

/** Includes or pauses one person. Paused people keep their open batch but get no new one. */
export async function togglePersonAutoAssign(id: number, back: string) {
  const user = await requireUser("admin");
  const row = await one<{ auto_assign: boolean; name: string }>("UPDATE users SET auto_assign = NOT auto_assign WHERE id = $1 AND role = 'employee' RETURNING auto_assign, name", [id]);
  if (!row) redirect(to(back, "Person not found", "error"));
  await audit(user.id, row.auto_assign ? "auto_assign_on" : "auto_assign_off", "user", id);
  const msg = row.auto_assign ? describeAssign(await runAutoAssign(), { quiet: true }) : "";
  redirect(to(back, `${row.name}: ${row.auto_assign ? "gets leads automatically" : "paused, keeps the current batch"}${msg ? `. ${msg}` : ""}`));
}

/** Closes a person's open batch by hand (its leads stay with them) so the next batch can go out. */
export async function closeBatch(batchId: number, back: string) {
  const user = await requireUser("admin");
  const b = await one<{ user_id: number; task_id: number | null }>("UPDATE lead_batches SET completed_at = now() WHERE id = $1 AND completed_at IS NULL RETURNING user_id, task_id", [batchId]);
  if (!b) redirect(to(back, "Batch already closed", "error"));
  if (b.task_id) await q("UPDATE tasks SET status = 'Done', updated_at = now() WHERE id = $1", [b.task_id]);
  await audit(user.id, "close_batch", "lead_batch", batchId, { user_id: b.user_id });
  const msg = describeAssign(await runAutoAssign(), { quiet: true });
  redirect(to(back, `Batch closed${msg ? `. ${msg}` : ""}`));
}
