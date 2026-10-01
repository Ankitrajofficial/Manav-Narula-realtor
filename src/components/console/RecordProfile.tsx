import Link from "next/link";
import Icon from "@/components/Icon";
import Pill from "./Pill";
import ConfirmButton from "./ConfirmButton";
import { inputCls } from "./Form";
import { LEAD_STATUSES } from "@/lib/console";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { LeadRow, ActivityRow } from "@/lib/queries/leads";
import type { ProspectRow } from "@/lib/queries/prospects";
import { addNoteAction, assignAction, deleteRecordAction, logCallAction, scheduleFollowUpAction, setStatusAction } from "@/app/(console)/records/actions";

type Kind = "lead" | "prospect";
interface Props { kind: Kind; record: LeadRow | ProspectRow; activities: ActivityRow[]; isAdmin: boolean; base: "/admin" | "/employee"; employees?: { id: number; name: string }[] }

const typeLabel: Record<string, string> = { created: "Created", note: "Note", status: "Status", call: "Call", whatsapp: "WhatsApp", follow_up: "Follow-up", assign: "Assignment", sale: "Sale" };
const typeIcon: Record<string, string> = { created: "plus", note: "edit", status: "check", call: "phone", whatsapp: "whatsapp", follow_up: "calendar", assign: "users", sale: "rupee" };

export default function RecordProfile({ kind, record: r, activities, isAdmin, base, employees = [] }: Props) {
  const lead = kind === "lead" ? (r as LeadRow) : null;
  const prospect = kind === "prospect" ? (r as ProspectRow) : null;
  const digits = r.phone.replace(/\D/g, "");
  const listHref = `${base}/${kind}s`;
  const today = new Date().toISOString().slice(0, 10);
  const closedWon = r.status === "Closed won";
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left: contact card + actions */}
      <div className="space-y-4 lg:col-span-4">
        <div className="rounded-brand border border-line bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-heading text-xl">{r.name}</p>
              <p className="mt-0.5 text-sm tabular text-muted">{r.phone}{r.email ? ` · ${r.email}` : ""}</p>
            </div>
            <Pill value={r.status} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><dt className="text-xs text-muted">Interest</dt><dd>{r.interest ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted">Budget</dt><dd>{r.budget ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted">Locality</dt><dd>{r.locality ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted">Source</dt><dd>{r.source}</dd></div>
            <div><dt className="text-xs text-muted">WhatsApp opt-in</dt><dd>{r.whatsapp_opt_in ? "Yes" : "No"}</dd></div>
            <div><dt className="text-xs text-muted">{lead ? "Added" : "Added by"}</dt><dd>{lead ? formatDateTime(lead.created_at) : (prospect?.added_by_name ?? "—")}</dd></div>
            {prospect && <div><dt className="text-xs text-muted">Last contacted</dt><dd>{prospect.last_contacted_at ? relativeTime(prospect.last_contacted_at) : "Never"}</dd></div>}
            <div><dt className="text-xs text-muted">Next follow-up</dt><dd className={r.next_follow_up_at && new Date(r.next_follow_up_at) < new Date() ? "text-red-700" : ""}>{r.next_follow_up_at ? formatDateTime(r.next_follow_up_at) : "—"}</dd></div>
          </dl>
          {r.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{r.tags.map((t) => <span key={t} className="rounded-brand border border-line px-2 py-0.5 text-xs">{t}</span>)}</div>}
          {r.notes && <p className="mt-3 border-t border-line pt-3 text-sm text-muted">{r.notes}</p>}
          {lead && (lead.property_title || lead.project_name) && (
            <div className="mt-3 border-t border-line pt-3 text-sm">
              <p className="text-xs text-muted">Linked {lead.property_title ? "property" : "project"}</p>
              {lead.property_title && <Link href={isAdmin ? `/admin/properties/${lead.property_id}` : `/properties/${lead.property_slug}`} className="text-accent-ink hover:underline">{lead.property_title}</Link>}
              {lead.project_name && <Link href={isAdmin ? `/admin/projects/${lead.project_id}` : `/projects/${lead.project_slug}`} className="text-accent-ink hover:underline">{lead.project_name}</Link>}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 rounded-brand border border-ink px-3 py-1.5 text-sm hover:bg-ink hover:text-white"><Icon name="phone" size={14} />Call</a>
            <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-brand border border-ink px-3 py-1.5 text-sm hover:bg-ink hover:text-white"><Icon name="whatsapp" size={14} />WhatsApp</a>
            <Link href={`${base}/${kind}s/${r.id}/edit`} className="inline-flex items-center gap-1.5 rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink"><Icon name="edit" size={14} />Edit details</Link>
          </div>
          <form action={logCallAction} className="mt-2 flex gap-2 text-xs">
            <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={r.id} />
            <button type="submit" name="channel" value="call" className="text-muted hover:text-ink">Log a call</button>
            <span className="text-line">|</span>
            <button type="submit" name="channel" value="whatsapp" className="text-muted hover:text-ink">Log a WhatsApp message</button>
          </form>
        </div>

        {isAdmin && (
          <form action={assignAction} className="rounded-brand border border-line bg-white p-5">
            <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={r.id} />
            <label htmlFor="assigned_to" className="mb-1 block text-xs font-medium">Assigned to</label>
            <div className="flex gap-2">
              <select id="assigned_to" name="assigned_to" defaultValue={r.assigned_to ?? ""} className={inputCls}>
                <option value="">Unassigned</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button type="submit" className="rounded-brand border border-line px-3 py-2 text-sm hover:border-ink">Save</button>
            </div>
          </form>
        )}
        {!isAdmin && r.assigned_name && <p className="px-1 text-xs text-muted">Assigned to {r.assigned_name}</p>}

        {closedWon && (
          <Link href={`${base}/sales/new?${kind}=${r.id}`} className="flex items-center justify-center gap-2 rounded-brand bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="rupee" size={16} />Record sale</Link>
        )}

        {isAdmin && (
          <form className="flex justify-end">
            <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={r.id} />
            <ConfirmButton label={`Delete ${kind}`} confirmLabel="Yes, delete" action={deleteRecordAction} />
          </form>
        )}
      </div>

      {/* Right: status, note, follow-up, timeline */}
      <div className="space-y-4 lg:col-span-8">
        <form action={setStatusAction} className="rounded-brand border border-line bg-white p-5">
          <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={r.id} />
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-muted">Status</p>
          <div className="flex flex-wrap gap-2">
            {LEAD_STATUSES.map((s) => (
              <button key={s} type="submit" name="status" value={s} aria-pressed={r.status === s} className={`rounded-brand border px-4 py-2.5 text-sm ${r.status === s ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-ink"}`}>{s}</button>
            ))}
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          <form action={addNoteAction} className="rounded-brand border border-line bg-white p-5">
            <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={r.id} />
            <label htmlFor="note-body" className="mb-1 block text-xs font-medium">Add note</label>
            <textarea id="note-body" name="body" rows={3} required className={inputCls} placeholder="What was discussed, what they need next" />
            <button type="submit" className="mt-3 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Save note</button>
          </form>
          <form action={scheduleFollowUpAction} className="rounded-brand border border-line bg-white p-5">
            <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={r.id} />
            <p className="mb-1 text-xs font-medium">Schedule follow-up</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" name="date" min={today} required className={inputCls} aria-label="Follow-up date" />
              <input type="time" name="time" defaultValue="10:00" className={inputCls} aria-label="Follow-up time" />
            </div>
            <div className="mt-2"><input name="note" placeholder="Reminder note (optional)" className={inputCls} aria-label="Reminder note" /></div>
            <div className="mt-3"><button type="submit" className="rounded-brand border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-white">Set reminder</button></div>
          </form>
        </div>

        <section className="rounded-brand border border-line bg-white p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-muted">Activity</p>
          {activities.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : (
            <ol className="relative border-l border-line pl-6">
              {activities.map((a) => (
                <li key={a.id} className="relative pb-5 last:pb-0">
                  <span className="absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-white text-muted"><Icon name={typeIcon[a.type] ?? "check"} size={11} /></span>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm"><span className="text-muted">{typeLabel[a.type] ?? a.type}</span>{a.body ? ` · ${a.body}` : ""}{a.type === "status" && a.from_status ? <span className="text-muted"> (from {a.from_status})</span> : null}</p>
                    <time className="text-xs tabular text-muted" title={formatDateTime(a.created_at)}>{relativeTime(a.created_at)}</time>
                  </div>
                  <p className="text-xs text-muted">{a.user_name ?? "Website"}{a.scheduled_at ? ` · for ${formatDateTime(a.scheduled_at)}` : ""}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
        <p className="text-xs text-muted"><Link href={listHref} className="hover:text-ink">← Back to {kind === "lead" ? "leads" : "prospects"}</Link></p>
      </div>
    </div>
  );
}
