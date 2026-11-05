import Link from "next/link";
import Icon from "@/components/Icon";
import Pill from "./Pill";
import { inputCls } from "./form-classes";
import { LEAD_STATUSES } from "@/lib/console";
import { todayIST } from "@/lib/dates";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { LeadRow, ActivityRow } from "@/lib/queries/leads";
import type { ProspectRow } from "@/lib/queries/prospects";
import { addNoteAction, logCallAction, scheduleFollowUpAction, setStatusAction } from "@/app/(console)/records/actions";

type Kind = "lead" | "prospect";
const BASE = "/employee";
/** History entries shown before "Show all". */
const RECENT = 3;

const typeLabel: Record<string, string> = { created: "Created", note: "Note", status: "Status", call: "Call", whatsapp: "WhatsApp", follow_up: "Follow-up", assign: "Assignment", sale: "Sale" };

function HistoryItem({ a }: { a: ActivityRow }) {
  return (
    <li className="py-2.5 text-sm">
      <p><span className="text-muted">{typeLabel[a.type] ?? a.type}</span>{a.body ? ` · ${a.body}` : ""}{a.type === "status" && a.from_status ? <span className="text-muted"> (from {a.from_status})</span> : null}</p>
      <p className="mt-0.5 text-xs text-muted" title={formatDateTime(a.created_at)}>{a.user_name ?? "Website"} · {relativeTime(a.created_at)}{a.scheduled_at ? ` · for ${formatDateTime(a.scheduled_at)}` : ""}</p>
    </li>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs text-muted">{label}</dt><dd>{children}</dd></div>;
}

/** The employee's view of one lead or prospect: who it is, call them, set the status, write a note, set a follow-up. */
export default function SimpleRecordProfile({ kind, record: r, activities }: { kind: Kind; record: LeadRow | ProspectRow; activities: ActivityRow[] }) {
  const lead = kind === "lead" ? (r as LeadRow) : null;
  const prospect = kind === "prospect" ? (r as ProspectRow) : null;
  const summary = [r.interest, r.locality, r.budget].filter(Boolean).join(" · ");
  const late = r.next_follow_up_at && new Date(r.next_follow_up_at) < new Date();
  const hidden = <><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={r.id} /></>;
  const card = "rounded-brand border border-line bg-white p-4 md:p-5";
  const heading = "mb-2 text-sm font-medium";
  return (
    <div className="max-w-2xl space-y-4">
      <Link href={`${BASE}/${kind}s`} className="inline-block text-sm text-muted hover:text-ink">← Back to {kind === "lead" ? "leads" : "old prospects"}</Link>

      <section className={card}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl">{r.name}</h1>
            <p className="mt-0.5 text-sm tabular text-muted">{r.phone}</p>
          </div>
          <Pill value={r.status} />
        </div>
        {summary && <p className="mt-2 text-sm">{summary}</p>}
        {r.next_follow_up_at && <p className={`mt-1 text-sm ${late ? "text-red-700" : "text-muted"}`}>{late ? "Overdue · " : "Follow up · "}{formatDateTime(r.next_follow_up_at)}</p>}
        {r.notes && <p className="mt-2 whitespace-pre-line text-sm text-muted">{r.notes}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={`tel:${r.phone}`} className="flex min-h-12 items-center justify-center gap-2 rounded-brand bg-accent text-sm font-medium text-white hover:bg-accent-ink"><Icon name="phone" size={18} />Call</a>
          <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="flex min-h-12 items-center justify-center gap-2 rounded-brand border border-ink text-sm font-medium hover:bg-ink hover:text-white"><Icon name="whatsapp" size={18} />WhatsApp</a>
        </div>
        <form action={logCallAction} className="mt-2 flex flex-wrap items-center gap-x-1 text-sm text-muted">
          {hidden}
          <span>Mark as done:</span>
          <button type="submit" name="channel" value="call" className="min-h-10 px-2 text-accent-ink hover:underline">I called</button>
          <button type="submit" name="channel" value="whatsapp" className="min-h-10 px-2 text-accent-ink hover:underline">I messaged</button>
        </form>
      </section>

      <form action={setStatusAction} className={card}>
        {hidden}
        <h2 style={{ fontFamily: "var(--font-body)" }} className={heading}>Status</h2>
        <div className="flex flex-wrap gap-2">
          {LEAD_STATUSES.map((s) => (
            <button key={s} type="submit" name="status" value={s} aria-pressed={r.status === s} className={`min-h-11 rounded-brand border px-4 text-sm ${r.status === s ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-ink"}`}>{s}</button>
          ))}
        </div>
        {r.status === "Closed won" && (
          <Link href={`${BASE}/sales/new?${kind}=${r.id}`} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-brand bg-accent text-sm font-medium text-white hover:bg-accent-ink"><Icon name="rupee" size={16} />Record sale</Link>
        )}
      </form>

      <form action={addNoteAction} className={card}>
        {hidden}
        <label htmlFor="note-body" className={`block ${heading}`}>Add a note</label>
        <textarea id="note-body" name="body" rows={2} required className={inputCls} placeholder="What did they say? What do they need next?" />
        <button type="submit" className="mt-2 min-h-11 w-full rounded-brand border border-ink text-sm font-medium hover:bg-ink hover:text-white">Save note</button>
      </form>

      <form action={scheduleFollowUpAction} className={card}>
        {hidden}
        <h2 style={{ fontFamily: "var(--font-body)" }} className={heading}>Next follow-up</h2>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" name="date" min={todayIST()} required className={inputCls} aria-label="Follow-up date" />
          <input type="time" name="time" defaultValue="10:00" className={inputCls} aria-label="Follow-up time" />
        </div>
        <button type="submit" className="mt-2 min-h-11 w-full rounded-brand border border-ink text-sm font-medium hover:bg-ink hover:text-white">Set follow-up</button>
      </form>

      <section className={card}>
        <h2 style={{ fontFamily: "var(--font-body)" }} className="text-sm font-medium">History</h2>
        {activities.length === 0 ? <p className="mt-2 text-sm text-muted">Nothing yet.</p> : (
          <>
            <ul className="divide-y divide-line">{activities.slice(0, RECENT).map((a) => <HistoryItem key={a.id} a={a} />)}</ul>
            {activities.length > RECENT && (
              <details className="border-t border-line">
                <summary className="min-h-10 cursor-pointer py-2.5 text-sm text-muted hover:text-ink">Show all {activities.length}</summary>
                <ul className="divide-y divide-line">{activities.slice(RECENT).map((a) => <HistoryItem key={a.id} a={a} />)}</ul>
              </details>
            )}
          </>
        )}
      </section>

      <details className={card}>
        <summary className="cursor-pointer text-sm text-muted hover:text-ink">More details</summary>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {r.email && <Detail label="Email">{r.email}</Detail>}
          {r.budget && <Detail label="Budget">{r.budget}</Detail>}
          <Detail label="Source">{r.source}</Detail>
          <Detail label="WhatsApp opt-in">{r.whatsapp_opt_in ? "Yes" : "No"}</Detail>
          <Detail label="Added by">{lead ? (lead.created_by_name ?? "Website") : (prospect?.added_by_name ?? "—")}<span className="block text-xs text-muted">{formatDateTime(r.created_at)}</span></Detail>
          <Detail label="Assigned to">{r.assigned_name ?? "—"}</Detail>
          <Detail label="Assigned by">{r.assigned_by_name ?? "—"}</Detail>
          {prospect && <Detail label="Last contacted">{prospect.last_contacted_at ? relativeTime(prospect.last_contacted_at) : "Never"}</Detail>}
          {lead?.property_title && <Detail label="Property"><Link href={`/properties/${lead.property_slug}`} className="text-accent-ink hover:underline">{lead.property_title}</Link></Detail>}
          {lead?.project_name && <Detail label="Project"><Link href={`/projects/${lead.project_slug}`} className="text-accent-ink hover:underline">{lead.project_name}</Link></Detail>}
          {prospect?.project_name && <Detail label="Project"><Link href={`/projects/${prospect.project_slug}`} className="text-accent-ink hover:underline">{prospect.project_name}</Link></Detail>}
        </dl>
        {r.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{r.tags.map((t) => <span key={t} className="rounded-brand border border-line px-2 py-0.5 text-xs">{t}</span>)}</div>}
        <Link href={`${BASE}/${kind}s/${r.id}/edit`} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-brand border border-line text-sm hover:border-ink"><Icon name="edit" size={14} />Edit details</Link>
      </details>
    </div>
  );
}
