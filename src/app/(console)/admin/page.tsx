import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import StatTile from "@/components/console/StatTile";
import Pill from "@/components/console/Pill";
import { BarChart, LineChart } from "@/components/console/Charts";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatPrice, relativeTime } from "@/lib/format";
import { todayIST } from "@/lib/dates";
import { adminAttention, adminStats, employeeWorkload, latestLeads, leadsBySource, leadsPerDay, overdueFollowUps } from "@/lib/queries/dashboard";

const OVERDUE_SHOWN = 5;

function Attention({ count, label, href, action }: { count: number; label: string; href: string; action: string }) {
  const waiting = count > 0;
  return (
    <Link href={href} className={`flex items-center gap-4 rounded-brand border bg-white px-5 py-4 hover:border-ink ${waiting ? "border-red-300" : "border-line"}`}>
      <span className={`text-3xl tabular ${waiting ? "text-red-700" : "text-muted"}`}>{count}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted">{waiting ? action : "All clear"}</span>
      </span>
    </Link>
  );
}

export default async function AdminDashboard() {
  const user = await requireUser("admin");
  const [stats, attention, perDay, bySource, latest, workload, overdue] = await Promise.all([adminStats(), adminAttention(), leadsPerDay(30), leadsBySource(), latestLeads(6), employeeWorkload(), overdueFollowUps(undefined, OVERDUE_SHOWN)]);
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }));
  const idle = workload.filter((w) => !w.open_leads && !w.open_prospects).length;
  return (
    <>
      <PageHeader title="Dashboard" description={`${hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}, ${user.name.split(" ")[0]}.`} />
      <section aria-label="Needs your attention" className="grid gap-3 md:grid-cols-3">
        <Attention count={attention.unassigned} label="Unassigned leads" action="Give them to someone" href="/admin/leads?assigned=unassigned" />
        <Attention count={attention.overdue} label="Overdue follow-ups" action="See who is behind" href="#overdue" />
        <Attention count={attention.salesToApprove} label="Sales to approve" action="Review and approve" href="/admin/sales?status=Pending%20approval" />
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Leads today" value={stats.leadsToday} href={`/admin/leads?from=${todayIST()}`} />
        <StatTile label="Hot leads" value={stats.hot} href="/admin/leads?status=Hot%20lead" />
        <StatTile label="Follow-ups today" value={stats.followUpsToday} href="/admin/notifications" />
        <StatTile label="Site visits this week" value={stats.siteVisitsWeek} href="/admin/leads?status=Site%20visit" />
        <StatTile label="Approved sales this month" value={stats.salesMonth > 0 ? formatPrice(stats.salesMonth) : "₹0"} href="/admin/sales" />
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
              {workload.filter((w) => w.open_leads || w.open_prospects).map((w) => (
                <li key={w.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/leads?assigned=${w.id}`} className="hover:text-accent-ink">{w.name}</Link>
                  <span className="tabular text-muted"><span className="text-ink">{w.open_leads}</span> open {w.open_leads === 1 ? "lead" : "leads"} {w.open_prospects > 0 ? ` · ${w.open_prospects} old ${w.open_prospects === 1 ? "prospect" : "prospects"}` : ""}</span>
                </li>
              ))}
            </ul>
            {idle > 0 && <p className="mt-2 text-xs text-muted">{idle} {idle === 1 ? "employee has" : "employees have"} nothing open. <Link href="/admin/employees" className="text-accent-ink hover:underline">See all</Link></p>}
          </section>
          <section id="overdue" className="scroll-mt-20 rounded-brand border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Overdue follow-ups{attention.overdue > OVERDUE_SHOWN ? ` · oldest ${OVERDUE_SHOWN} of ${attention.overdue}` : ""}</p>
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

    </>
  );
}
