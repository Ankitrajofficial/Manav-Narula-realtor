import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import StatTile from "@/components/console/StatTile";
import ToggleForm from "@/components/console/ToggleForm";
import ConfirmButton from "@/components/console/ConfirmButton";
import { inputCls } from "@/components/console/form-classes";
import { requireUser } from "@/lib/auth";
import { autoAssignConfig, batchOverview, unassignedPool } from "@/lib/auto-assign";
import { levelLabel } from "@/lib/growth";
import { relativeTime } from "@/lib/format";
import { closeBatch, runAutoAssignNow, saveAutoAssign, setAutoAssignEnabled, togglePersonAutoAssign } from "./actions";

export const metadata = { title: "Auto-assign" };

export default async function AutoAssignPage() {
  await requireUser("admin");
  const [cfg, people, pool] = await Promise.all([autoAssignConfig(), batchOverview(), unassignedPool()]);
  const working = people.filter((p) => p.batch_id).length;
  const waiting = people.filter((p) => !p.batch_id && p.auto_assign && !p.must_reset).length;
  const back = "/admin/auto-assign";
  return (
    <>
      <PageHeader
        title="Auto-assign"
        description={`New, unassigned leads go out in batches of ${cfg.batch_size}, oldest first. When every lead in someone's batch has moved past "New", the batch closes and the next ${cfg.batch_size} go to them.`}
        actions={<form action={runAutoAssignNow}><button type="submit" className="rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Run now</button></form>}
      />

      <section className={`mb-5 flex flex-wrap items-center justify-between gap-4 rounded-brand border p-5 ${cfg.enabled ? "border-accent bg-accent/5" : "border-line bg-white"}`}>
        <div>
          <p className="text-base font-medium">Automatic lead distribution</p>
          <p className="mt-0.5 text-sm text-muted">{cfg.enabled
            ? cfg.schedule === "daily_9am" ? "On: new leads go out every day at 9:00 AM sharp to everyone who has finished their batch." : "On: new leads go out as they arrive to everyone who has finished their batch."
            : "Off: new leads wait in the pool until you assign them by hand or switch this on."}</p>
        </div>
        <span className="flex items-center gap-3">
          <span className={`text-sm font-medium ${cfg.enabled ? "text-accent-ink" : "text-muted"}`}>{cfg.enabled ? "On" : "Off"}</span>
          <ToggleForm on={cfg.enabled} label={cfg.enabled ? "Turn off automatic lead distribution" : "Turn on automatic lead distribution"} action={setAutoAssignEnabled.bind(null, !cfg.enabled)} />
        </span>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Status" value={cfg.enabled ? "On" : "Off"} hint={`Batches of ${cfg.batch_size} · ${cfg.schedule === "daily_9am" ? "daily at 9:00 AM" : "as leads arrive"}`} />
        <StatTile label="Unassigned new leads" value={pool} href="/admin/leads?assigned=unassigned&status=New" hint="Waiting in the pool" />
        <StatTile label="Working a batch" value={working} hint={`of ${people.length} people`} />
        <StatTile label="Waiting for leads" value={waiting} hint={pool ? "Run now to hand out" : "Pool is empty"} />
      </div>

      <form action={saveAutoAssign} className="mb-6 flex flex-wrap items-end gap-4 rounded-brand border border-line bg-white p-5">
        <label className="flex flex-col text-xs font-medium">Leads per batch<input name="batch_size" type="number" min={1} max={50} defaultValue={cfg.batch_size} className={`${inputCls} mt-1 w-28`} /></label>
        <label className="flex flex-col text-xs font-medium">When to hand out leads
          <select name="schedule" defaultValue={cfg.schedule} className={`${inputCls} mt-1 w-64`}>
            <option value="daily_9am">Every day at 9:00 AM sharp</option>
            <option value="instant">As leads arrive</option>
          </select>
        </label>
        <button type="submit" className="rounded-brand border border-line bg-white px-4 py-2 text-sm hover:border-ink">Save</button>
        <p className="w-full text-xs text-muted">Interns, employees and executives who are active, have set their own password and have &quot;Get leads automatically at 9:00 AM&quot; on (in their own dashboard, or the switch below) take part. With the 9:00 AM schedule, everyone who has finished their batch gets the next one at 9:00 AM India time; &quot;Run now&quot; hands out at once. Leads you assign by hand are not touched.</p>
      </form>

      {people.length === 0 ? (
        <p className="rounded-brand border border-dashed border-line px-4 py-6 text-center text-sm text-muted">No active interns or employees yet. <Link href="/admin/employees/new" className="text-accent-ink hover:underline">Add one</Link>.</p>
      ) : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white">
          {people.map((p) => {
            const pct = p.held ? Math.round((p.contacted / p.held) * 100) : 0;
            return (
              <li key={p.user_id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1 basis-48">
                  <Link href={`/admin/employees/${p.user_id}?tab=growth`} className="font-medium hover:text-accent-ink">{p.name}</Link>
                  <span className="ml-2 align-middle"><Pill value={levelLabel("employee", p.level)} /></span>
                  <p className="text-xs text-muted">{p.completed} {p.completed === 1 ? "batch" : "batches"} completed{p.must_reset ? " · has not signed in yet" : ""}</p>
                </div>
                <div className="w-56">
                  {p.batch_id ? (
                    <>
                      <div className="flex justify-between text-xs"><span>{p.contacted} of {p.held} contacted</span><span className="text-muted">{relativeTime(p.batch_started)}</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.name} batch progress`}>
                        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                    </>
                  ) : <span className="text-xs text-muted">{p.auto_assign ? "Waiting for leads" : "No open batch"}</span>}
                </div>
                <div className="flex items-center gap-3">
                  {p.batch_id && (
                    <form><ConfirmButton label="Close batch" confirmLabel="Close and send next" action={closeBatch.bind(null, p.batch_id, back)} className="rounded-brand border border-line px-2.5 py-1 text-xs hover:border-ink" /></form>
                  )}
                  <span className="flex items-center gap-2 text-xs text-muted">{p.auto_assign ? "On" : "Paused"}<ToggleForm on={p.auto_assign} action={togglePersonAutoAssign.bind(null, p.user_id, back)} label={`Auto-assign for ${p.name}`} /></span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
