import Link from "next/link";
import Pill from "@/components/console/Pill";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatShortDate } from "@/lib/format";
import { employeeStats, tasksDueThisWeek, todaysFollowUps } from "@/lib/queries/dashboard";
import { autoAssignConfig, myBatch, runAutoAssignFromPage } from "@/lib/auto-assign";
import ToggleForm from "@/components/console/ToggleForm";
import { one } from "@/lib/db";
import { setMyAutoAssign } from "./auto-assign-actions";

function Count({ label, value, href, urgent }: { label: string; value: number; href: string; urgent?: boolean }) {
  return (
    <Link href={href} className="rounded-brand border border-line bg-white px-3 py-3 text-center hover:border-ink">
      <span className={`block text-2xl tabular ${urgent ? "text-red-700" : ""}`}>{value}</span>
      <span className="mt-0.5 block text-xs text-muted">{label}</span>
    </Link>
  );
}

export default async function EmployeeDashboard() {
  const user = await requireUser("employee");
  // Opening the console is also when a newly signed-in person picks up their first batch.
  await runAutoAssignFromPage();
  const [stats, followUps, tasks, batch, cfg, me] = await Promise.all([employeeStats(user.id), todaysFollowUps(user.id), tasksDueThisWeek(user.id), myBatch(user.id), autoAssignConfig(), one<{ auto_assign: boolean }>("SELECT auto_assign FROM users WHERE id = $1", [user.id])]);
  const autoOn = !!me?.auto_assign;
  const daily = cfg.schedule === "daily_9am";
  const contacted = batch ? batch.leads.filter((l) => l.status !== "New").length : 0;
  const toContact = batch ? batch.leads.length - contacted : 0;
  const now = new Date();
  return (
    <>
      <h1 className="mb-4 font-heading text-2xl">Hello {user.name.split(" ")[0]}</h1>

      <Link href="/employee/leads/new" className="flex min-h-16 items-center justify-center gap-2 rounded-brand bg-accent px-5 py-4 text-lg font-medium text-white hover:bg-accent-ink">
        <Icon name="plus" size={24} />Add new lead
      </Link>

      {toContact > 0 && (
        <Link href="/employee/leads?status=New" className="mt-3 flex items-center justify-between gap-3 rounded-brand border border-accent bg-white px-5 py-3 text-sm font-medium text-accent-ink hover:bg-accent hover:text-white">
          {toContact} new {toContact === 1 ? "lead" : "leads"} to contact<span aria-hidden="true">→</span>
        </Link>
      )}

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Count label="My leads" value={stats.assigned} href="/employee/leads" />
        <Count label="Follow-ups today" value={stats.followUpsToday} href="#follow-ups" urgent={stats.followUpsToday > 0} />
        <Count label="Hot leads" value={stats.hot} href="/employee/leads?status=Hot%20lead" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section id="follow-ups" className="scroll-mt-20 rounded-brand border border-line bg-white">
          <h2 className="border-b border-line px-5 py-3 text-sm font-medium">Follow-ups today</h2>
          {followUps.length === 0 ? <p className="px-5 py-4 text-sm text-muted">Nothing to follow up today.</p> : (
            <ul className="divide-y divide-line">
              {followUps.map((f) => {
                const late = new Date(f.next_follow_up_at) < now;
                return (
                  <li key={`${f.kind}-${f.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/employee/${f.kind}s/${f.id}`} className="font-medium hover:text-accent-ink">{f.name}</Link>
                      {f.status === "Hot lead" && <span className="ml-2 align-middle"><Pill value={f.status} /></span>}
                      <p className={`text-xs ${late ? "text-red-700" : "text-muted"}`}>{late ? "Overdue · " : ""}{formatDateTime(f.next_follow_up_at)}</p>
                    </div>
                    <Link href={`/employee/${f.kind}s/${f.id}`} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-brand border border-ink px-3 text-sm hover:bg-ink hover:text-white"><Icon name="phone" size={14} />Open</Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-brand border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-sm font-medium">Tasks this week</h2>
            <Link href="/employee/tasks" className="text-sm text-accent-ink hover:underline">All tasks</Link>
          </div>
          {tasks.length === 0 ? <p className="px-5 py-4 text-sm text-muted">No tasks this week.</p> : (
            <ul className="divide-y divide-line">
              {tasks.map((t) => {
                const late = t.due_date && new Date(t.due_date) < new Date(now.toDateString());
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/employee/tasks/${t.id}`} className="hover:text-accent-ink">{t.title}</Link>
                      <p className={`text-xs ${late ? "text-red-700" : "text-muted"}`}>{t.due_date ? `${late ? "Overdue · " : "Due "}${formatShortDate(t.due_date)}` : "No due date"}</p>
                    </div>
                    {t.priority === "high" && <Pill value="High" />}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {cfg.enabled && (
        <section className="mt-5 flex items-center justify-between gap-3 rounded-brand border border-line bg-white px-5 py-3">
          <div>
            <p className="text-sm font-medium">{daily ? "Get new leads at 9:00 AM" : "Get new leads automatically"}</p>
            <p className="text-xs text-muted">{autoOn ? "On" : "Off: your current batch stays with you"}</p>
          </div>
          <ToggleForm on={autoOn} label={autoOn ? "Turn off automatic leads" : "Turn on automatic leads"} action={setMyAutoAssign.bind(null, !autoOn)} />
        </section>
      )}
    </>
  );
}
