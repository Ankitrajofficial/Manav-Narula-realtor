import Link from "next/link";
import Icon from "@/components/Icon";
import SheetStatus from "./SheetStatus";
import { setStatusAction } from "@/app/(console)/records/actions";
import { formatShortDate, maskPhone } from "@/lib/format";
import type { SheetRecord } from "@/lib/queries/tasks";

const CONTACTED = ["Called", "Follow up", "Hot lead", "Site visit", "Closed won", "Closed lost"];

/**
 * The people attached to a task, with one-tap Call and WhatsApp and an inline status change per row.
 * `base` is /admin or /employee; `returnTo` is the task page to come back to after a status change.
 */
export default function TaskSheet({ records, base, returnTo }: { records: SheetRecord[]; base: string; returnTo: string }) {
  if (records.length === 0) return null;
  const leads = records.filter((r) => r.kind === "lead").length;
  const prospects = records.length - leads;
  const contacted = records.filter((r) => CONTACTED.includes(r.status)).length;
  const visits = records.filter((r) => r.status === "Site visit").length;
  const won = records.filter((r) => r.status === "Closed won").length;
  const untouched = records.filter((r) => r.status === "New").length;
  const pct = Math.round((contacted / records.length) * 100);
  return (
    <section className="rounded-brand border border-line bg-white">
      <header className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Call sheet</h2>
          <p className="text-xs tabular text-muted">{[leads && `${leads} ${leads === 1 ? "lead" : "leads"}`, prospects && `${prospects} ${prospects === 1 ? "prospect" : "prospects"}`].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-brand bg-line"><div className="h-1.5 rounded-brand bg-accent" style={{ width: `${pct}%` }} /></div>
          <p className="whitespace-nowrap text-xs tabular text-muted">{contacted} of {records.length} contacted · {visits} site {visits === 1 ? "visit" : "visits"} · {won} won · {untouched} untouched</p>
        </div>
      </header>
      <ul className="divide-y divide-line">
        {records.map((r) => (
          <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
            <span className="w-16 text-xs uppercase tracking-wide text-muted">{r.kind}</span>
            <Link href={`${base}/${r.kind === "lead" ? "leads" : "prospects"}/${r.id}`} className="min-w-[180px] flex-1 hover:text-accent-ink">
              <span className="block truncate text-sm">{r.name}</span>
              <span className="block truncate text-xs text-muted">{[base === "/employee" ? maskPhone(r.phone) : r.phone, r.locality, r.interest, r.next_follow_up_at && `follow-up ${formatShortDate(r.next_follow_up_at)}`].filter(Boolean).join(" · ")}</span>
            </Link>
            <form action={setStatusAction} className="flex items-center">
              <input type="hidden" name="kind" value={r.kind} />
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="return" value={returnTo} />
              <SheetStatus value={r.status} />
            </form>
            {base !== "/employee" && (
              <>
                <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 rounded-brand border border-line px-2.5 py-1 text-xs hover:border-ink"><Icon name="phone" size={12} />Call</a>
                <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 rounded-brand border border-line px-2.5 py-1 text-xs hover:border-ink"><Icon name="whatsapp" size={12} />WhatsApp</a>
              </>
            )}
            <Link href={`${base}/${r.kind === "lead" ? "leads" : "prospects"}/${r.id}`} className="inline-flex items-center gap-1 rounded-brand border border-line px-2.5 py-1 text-xs hover:border-ink" title="Open profile to call, add a note or schedule a follow-up"><Icon name="edit" size={12} />{base === "/employee" ? "Open" : "Note"}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
