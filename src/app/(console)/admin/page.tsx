import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import StatTile from "@/components/console/StatTile";
import Pill from "@/components/console/Pill";
import { BarChart, LineChart } from "@/components/console/Charts";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatPrice, relativeTime } from "@/lib/format";
import { adminStats, employeeWorkload, latestLeads, leadsBySource, leadsPerDay, overdueFollowUps } from "@/lib/queries/dashboard";

const today = () => new Date().toISOString().slice(0, 10);

export default async function AdminDashboard() {
  const user = await requireUser("admin");
  const [stats, perDay, bySource, latest, workload, overdue] = await Promise.all([adminStats(), leadsPerDay(30), leadsBySource(), latestLeads(10), employeeWorkload(), overdueFollowUps(undefined, 10)]);
  const hour = new Date().getHours();
  return (
    <>
      <PageHeader title="Dashboard" description={`${hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}, ${user.name.split(" ")[0]}. Here is where the pipeline stands.`} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Leads today" value={stats.leadsToday} href={`/admin/leads?from=${today()}`} />
        <StatTile label="Leads this week" value={stats.leadsWeek} href="/admin/leads" />
        <StatTile label="Hot leads" value={stats.hot} href="/admin/leads?status=Hot%20lead" />
        <StatTile label="Follow-ups due today" value={stats.followUpsToday} href="/admin/notifications" />
        <StatTile label="Site visits this week" value={stats.siteVisitsWeek} href="/admin/leads?status=Site%20visit" />
        <StatTile label="Sales this month" value={stats.salesMonth > 0 ? formatPrice(stats.salesMonth) : "₹0"} href="/admin/sales" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-brand border border-line bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Leads per day · last 30 days</p>
          <div className="mt-3"><LineChart points={perDay} label="Leads per day, last 30 days" /></div>
        </section>
        <section className="rounded-brand border border-line bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Leads by source</p>
          <div className="mt-3">{bySource.length ? <BarChart bars={bySource} label="Leads by source" /> : <p className="text-sm text-muted">No leads yet.</p>}</div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <section className="rounded-brand border border-line bg-white lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Latest leads</p>
            <Link href="/admin/leads" className="text-sm text-accent-ink hover:underline">All leads</Link>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-line text-xs text-muted"><th className="px-5 font-medium">Name</th><th className="px-3 font-medium">Source</th><th className="px-3 font-medium">Status</th><th className="px-3 font-medium">Assigned</th><th className="px-3 font-medium">Received</th></tr></thead>
            <tbody>
              {latest.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0 hover:bg-bg">
                  <td className="px-5"><Link href={`/admin/leads/${l.id}`} className="hover:text-accent-ink">{l.name}</Link><span className="ml-2 text-xs tabular text-muted">{l.phone}</span></td>
                  <td className="px-3">{l.source}</td>
                  <td className="px-3"><Pill value={l.status} /></td>
                  <td className="px-3">{l.assigned_name ?? <span className="text-muted">Unassigned</span>}</td>
                  <td className="px-3 whitespace-nowrap text-muted" title={formatDateTime(l.created_at)}>{relativeTime(l.created_at)}</td>
                </tr>
              ))}
              {latest.length === 0 && <tr><td colSpan={5} className="px-5 py-4 text-muted">No leads yet.</td></tr>}
            </tbody>
          </table></div>
        </section>
        <div className="space-y-4 lg:col-span-5">
          <section className="rounded-brand border border-line bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Employee workload</p>
            <ul className="mt-3 divide-y divide-line">
              {workload.map((w) => (
                <li key={w.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/leads?assigned=${w.id}`} className="hover:text-accent-ink">{w.name}</Link>
                  <span className="tabular text-muted"><span className="text-ink">{w.open_leads}</span> open leads · {w.open_prospects} prospects</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-brand border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Overdue follow-ups</p>
              {overdue.length > 0 && <Pill value="Overdue" />}
            </div>
            {overdue.length === 0 ? <p className="mt-3 text-sm text-muted">Nothing overdue.</p> : (
              <ul className="mt-3 divide-y divide-line">
                {overdue.map((f) => (
                  <li key={`${f.kind}-${f.id}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span><Link href={`/admin/${f.kind}s/${f.id}`} className="hover:text-accent-ink">{f.name}</Link><span className="ml-2 text-xs text-muted">{f.assigned_name ?? "Unassigned"}</span></span>
                    <span className="flex items-center gap-2 whitespace-nowrap text-xs text-red-700"><Icon name="clock" size={12} />{relativeTime(f.next_follow_up_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
