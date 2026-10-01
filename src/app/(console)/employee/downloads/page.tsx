import PageHeader from "@/components/console/PageHeader";
import ReportRange from "@/components/console/ReportRange";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { defaultRange } from "@/lib/queries/reports";
import { formatShortDate } from "@/lib/format";

export default async function DownloadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employee");
  const range = defaultRange(await searchParams);
  const p = [user.id, range.from, range.to];
  const inR = (col: string) => `${col} >= $2::date AND ${col} < ($3::date + interval '1 day')`;
  const [leads, prospects, followups, sales] = await Promise.all([
    one<{ n: number }>(`SELECT count(*)::int AS n FROM leads WHERE (assigned_to = $1 OR created_by = $1) AND ${inR("created_at")}`, p),
    one<{ n: number }>(`SELECT count(*)::int AS n FROM prospects WHERE (assigned_to = $1 OR added_by = $1) AND ${inR("created_at")}`, p),
    one<{ n: number }>(`SELECT count(*)::int AS n FROM lead_activities a WHERE a.type = 'follow_up' AND a.user_id = $1 AND ${inR("a.created_at")}`, p),
    one<{ n: number }>(`SELECT count(*)::int AS n FROM sales WHERE employee_id = $1 AND ${inR("sale_date")}`, p),
  ]);
  const cards = [
    { type: "leads", title: "My leads", text: "Leads assigned to you or added by you, with status, locality and last activity.", n: leads?.n ?? 0 },
    { type: "prospects", title: "My prospects", text: "Prospects you added or were assigned, with tags and WhatsApp opt-in.", n: prospects?.n ?? 0 },
    { type: "followups", title: "My follow-ups", text: "Follow-ups you scheduled in range, plus upcoming follow-ups on your records.", n: followups?.n ?? 0 },
    { type: "sales", title: "My sales", text: "Deals you recorded, with value, commission and approval status.", n: sales?.n ?? 0 },
  ];
  return (
    <>
      <PageHeader title="Downloads" description={`CSV exports of your own records, ${formatShortDate(range.from)} to ${formatShortDate(range.to)}.`} />
      <ReportRange from={range.from} to={range.to} basePath="/employee/downloads" />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <section key={c.type} className="flex flex-col rounded-brand border border-line bg-white p-5">
            <h2 className="text-base">{c.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{c.text}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm tabular text-muted">{c.n} {c.n === 1 ? "record" : "records"}</span>
              <a href={`/employee/downloads/export?type=${c.type}&from=${range.from}&to=${range.to}`} className="inline-flex items-center gap-1.5 rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink"><Icon name="download" size={14} />Download CSV</a>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
