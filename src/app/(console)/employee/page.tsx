import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import StatTile from "@/components/console/StatTile";
import { priorityLabel } from "@/lib/console";
import Pill from "@/components/console/Pill";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatPrice, formatShortDate } from "@/lib/format";
import { employeeStats, tasksDueThisWeek, todaysFollowUps } from "@/lib/queries/dashboard";
import Stars from "@/components/console/Stars";
import { myBatch, runAutoAssign } from "@/lib/auto-assign";
import { getGrowth } from "@/lib/queries/growth";

export default async function EmployeeDashboard() {
  const user = await requireUser("employee");
  // Opening the console is also when a newly signed-in person picks up their first batch.
  await runAutoAssign();
  const [stats, followUps, tasks, growth, batch] = await Promise.all([employeeStats(user.id), todaysFollowUps(user.id), tasksDueThisWeek(user.id), getGrowth(user.id), myBatch(user.id)]);
  const contacted = batch ? batch.leads.filter((l) => l.status !== "New").length : 0;
  const now = new Date();
  return (
    <>
      <PageHeader title="My Dashboard" description={`Hello ${user.name.split(" ")[0]}. Your follow-ups and tasks for today.`} />
      <Link href="/employee/growth" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-brand border border-line bg-white px-5 py-3 text-sm hover:border-ink">
        <span className="flex items-center gap-3"><Stars count={growth?.stars ?? 0} size={18} /><span className="text-muted">{growth?.sales ?? 0} approved {growth?.sales === 1 ? "sale" : "sales"}</span></span>
        <span>{batch ? `Lead batch: ${contacted} of ${batch.leads.length} contacted` : "No open lead batch"}</span>
      </Link>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="Assigned leads" value={stats.assigned} href="/employee/leads" hint="Open, not yet closed" />
        <StatTile label="Follow-ups due today" value={stats.followUpsToday} href="/employee/notifications" />
        <StatTile label="Hot leads" value={stats.hot} href="/employee/leads?status=Hot%20lead" />
        <StatTile label="Sales this month" value={formatPrice(stats.salesMonth)} href="/employee/sales" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-brand border border-line bg-white">
          <div className="border-b border-line px-5 py-3"><p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Today&apos;s follow-ups</p></div>
          {followUps.length === 0 ? <p className="px-5 py-4 text-sm text-muted">No follow-ups due today.</p> : (
            <ul className="divide-y divide-line">
              {followUps.map((f) => {
                const late = new Date(f.next_follow_up_at) < now;
                return (
                  <li key={`${f.kind}-${f.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <Link href={`/employee/${f.kind}s/${f.id}`} className="font-medium hover:text-accent-ink">{f.name}</Link>
                      <span className="ml-2 text-xs uppercase tracking-wide text-muted">{f.kind}</span>
                      <p className={`text-xs ${late ? "text-red-700" : "text-muted"}`} title={formatDateTime(f.next_follow_up_at)}>{late ? "Overdue · " : ""}{formatDateTime(f.next_follow_up_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill value={f.status} />
                      <Link href={`/employee/${f.kind}s/${f.id}`} className="inline-flex items-center gap-1 rounded-brand border border-ink px-2.5 py-1.5 text-xs hover:bg-ink hover:text-white"><Icon name="phone" size={12} />Open to call</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="rounded-brand border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Tasks from admin due this week</p>
            <Link href="/employee/tasks" className="text-sm text-accent-ink hover:underline">All tasks</Link>
          </div>
          {tasks.length === 0 ? <p className="px-5 py-4 text-sm text-muted">No open tasks this week.</p> : (
            <ul className="divide-y divide-line">
              {tasks.map((t) => {
                const late = t.due_date && new Date(t.due_date) < new Date(now.toDateString());
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <Link href={`/employee/tasks/${t.id}`} className="hover:text-accent-ink">{t.title}</Link>
                      <p className={`text-xs ${late ? "text-red-700" : "text-muted"}`}>{t.due_date ? `${late ? "Overdue · " : "Due "}${formatShortDate(t.due_date)}` : "No due date"}</p>
                    </div>
                    <div className="flex items-center gap-2"><Pill value={priorityLabel(t.priority)} /><Pill value={t.status} /></div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
