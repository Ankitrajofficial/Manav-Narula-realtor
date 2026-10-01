import PageHeader from "@/components/console/PageHeader";
import ReportRange from "@/components/console/ReportRange";
import ReportSection from "@/components/console/ReportSection";
import Pill from "@/components/console/Pill";
import { BarChart } from "@/components/console/Charts";
import { requireUser } from "@/lib/auth";
import { defaultRange, employeePerformance, funnel, leadsBySource, leadsByStatus, localityDemand } from "@/lib/queries/reports";
import { formatINR, formatShortDate } from "@/lib/format";

const th = "px-3 py-2 text-left text-xs font-medium text-muted";
const td = "px-3 py-2";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const range = defaultRange(await searchParams);
  const [bySource, byStatus, stages, perf, localities] = await Promise.all([leadsBySource(range), leadsByStatus(range), funnel(range), employeePerformance(range), localityDemand(range)]);
  const totalLeads = bySource.reduce((n, r) => n + Number(r.value), 0);
  const pct = (n: number) => (totalLeads ? `${Math.round((Number(n) / totalLeads) * 100)}%` : "0%");
  const none = <p className="text-sm text-muted">No leads in this range.</p>;

  return (
    <>
      <PageHeader title="Reports" description={`Leads created and sales dated ${formatShortDate(range.from)} to ${formatShortDate(range.to)}.`} />
      <ReportRange from={range.from} to={range.to} basePath="/admin/reports" />
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportSection title="Leads by source" description={`${totalLeads} leads in range`} report="source" from={range.from} to={range.to}>
          {bySource.length === 0 ? none : (
            <>
              <BarChart bars={bySource.map((r) => ({ label: r.label, value: Number(r.value) }))} label="Leads by source" />
              <table className="mt-3 w-full text-sm"><thead><tr className="border-b border-line"><th className={th}>Source</th><th className={`${th} text-right`}>Leads</th><th className={`${th} text-right`}>Share</th></tr></thead>
                <tbody>{bySource.map((r) => <tr key={r.label} className="border-b border-line last:border-0"><td className={td}>{r.label}</td><td className={`${td} text-right tabular`}>{r.value}</td><td className={`${td} text-right tabular text-muted`}>{pct(Number(r.value))}</td></tr>)}</tbody></table>
            </>
          )}
        </ReportSection>
        <ReportSection title="Leads by status" description="Current status of leads created in range" report="status" from={range.from} to={range.to}>
          {byStatus.length === 0 ? none : (
            <>
              <BarChart bars={byStatus.map((r) => ({ label: r.label, value: Number(r.value) }))} label="Leads by status" />
              <table className="mt-3 w-full text-sm"><thead><tr className="border-b border-line"><th className={th}>Status</th><th className={`${th} text-right`}>Leads</th><th className={`${th} text-right`}>Share</th></tr></thead>
                <tbody>{byStatus.map((r) => <tr key={r.label} className="border-b border-line last:border-0"><td className={td}><Pill value={r.label} /></td><td className={`${td} text-right tabular`}>{r.value}</td><td className={`${td} text-right tabular text-muted`}>{pct(Number(r.value))}</td></tr>)}</tbody></table>
            </>
          )}
        </ReportSection>
        <ReportSection title="Conversion funnel" description="New > Contacted > Site visit > Closed won, as % of leads created in range" report="funnel" from={range.from} to={range.to}>
          <ol className="space-y-3">
            {stages.map((s) => (
              <li key={s.label}>
                <div className="flex items-center justify-between text-sm"><span>{s.label}</span><span className="tabular text-muted">{s.value} · {s.pct}%</span></div>
                <div className="mt-1 h-2 w-full rounded-brand bg-line"><div className="h-2 rounded-brand bg-accent" style={{ width: `${s.pct}%` }} /></div>
              </li>
            ))}
          </ol>
        </ReportSection>
        <ReportSection title="Locality demand" description="Leads and prospects added in range, top 10 localities" report="localities" from={range.from} to={range.to}>
          {localities.length === 0 ? <p className="text-sm text-muted">No records in this range.</p> : (
            <>
              <BarChart bars={localities.slice(0, 10).map((r) => ({ label: r.label, value: Number(r.value) }))} label="Locality demand" />
              <table className="mt-3 w-full text-sm"><thead><tr className="border-b border-line"><th className={th}>Locality</th><th className={`${th} text-right`}>Leads</th><th className={`${th} text-right`}>Prospects</th><th className={`${th} text-right`}>Total</th></tr></thead>
                <tbody>{localities.slice(0, 10).map((r) => <tr key={r.label} className="border-b border-line last:border-0"><td className={td}>{r.label}</td><td className={`${td} text-right tabular`}>{r.leads}</td><td className={`${td} text-right tabular`}>{r.prospects}</td><td className={`${td} text-right tabular`}>{r.value}</td></tr>)}</tbody></table>
            </>
          )}
        </ReportSection>
        <div className="lg:col-span-2">
          <ReportSection title="Employee performance" description="Leads assigned, follow-ups logged and sales closed in range" report="employees" from={range.from} to={range.to}>
            <table className="w-full text-sm"><thead><tr className="border-b border-line"><th className={th}>Employee</th><th className={`${th} text-right`}>Leads handled</th><th className={`${th} text-right`}>Follow-ups done</th><th className={`${th} text-right`}>Sales closed</th><th className={`${th} text-right`}>Sales value</th></tr></thead>
              <tbody>{perf.map((r) => <tr key={r.id} className="border-b border-line last:border-0"><td className={td}>{r.name}</td><td className={`${td} text-right tabular`}>{r.leads_handled}</td><td className={`${td} text-right tabular`}>{r.follow_ups}</td><td className={`${td} text-right tabular`}>{r.sales_count}</td><td className={`${td} text-right tabular`}>{formatINR(r.sales_value)}</td></tr>)}
                {perf.length === 0 && <tr><td className={td} colSpan={5}><span className="text-muted">No employees yet.</span></td></tr>}</tbody></table>
          </ReportSection>
        </div>
      </div>
    </>
  );
}
