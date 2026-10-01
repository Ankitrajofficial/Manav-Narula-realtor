import Link from "next/link";
import DataTable, { queryString } from "./DataTable";
import FilterBar from "./FilterBar";
import Pill from "./Pill";
import BulkBar from "./BulkBar";
import { inputCls } from "./Form";
import { LEAD_STATUSES, INTERESTS } from "@/lib/console";
import { maskPhone, relativeTime } from "@/lib/format";
import { listProspects, type ProspectRow } from "@/lib/queries/prospects";
import type { SP } from "@/lib/queries/leads";
import { listEmployees, listLocalities, listTags } from "@/lib/queries/common";
import { bulkAssignAction, bulkCreateTaskAction, bulkStatusAction } from "@/app/(console)/records/actions";

export default async function ProspectsTable({ sp, base, userId }: { sp: SP; base: "/admin" | "/employee"; userId?: number }) {
  const isAdmin = base === "/admin";
  const [data, employees, localities, tags] = await Promise.all([listProspects(sp, userId ? { userId } : {}), isAdmin ? listEmployees() : Promise.resolve([]), listLocalities(), listTags()]);
  const columns = [
    { key: "name", label: "Name", sortable: true, render: (r: ProspectRow) => <Link href={`${base}/prospects/${r.id}`} className="font-medium hover:text-accent-ink">{r.name}</Link> },
    { key: "phone", label: "Phone", sortable: true, className: "tabular whitespace-nowrap", render: (r: ProspectRow) => isAdmin ? <a href={`tel:${r.phone}`} className="hover:text-accent-ink">{r.phone}</a> : <Link href={`${base}/prospects/${r.id}`} className="text-muted hover:text-accent-ink" title="Open the profile to see the full number">{maskPhone(r.phone)}</Link> },
    { key: "locality", label: "Locality", sortable: true, render: (r: ProspectRow) => r.locality ?? "—" },
    { key: "budget", label: "Budget", sortable: true, hideOnMobile: true, render: (r: ProspectRow) => r.budget ?? "—" },
    { key: "interest", label: "Interest", sortable: true, hideOnMobile: true, render: (r: ProspectRow) => r.interest ?? "—" },
    { key: "tags", label: "Tags", hideOnMobile: true, render: (r: ProspectRow) => r.tags?.length ? <span className="flex flex-wrap gap-1">{r.tags.map((t) => <span key={t} className="rounded-brand border border-line px-1.5 text-xs">{t}</span>)}</span> : "—" },
    { key: "optin", label: "WA opt-in", hideOnMobile: true, render: (r: ProspectRow) => r.whatsapp_opt_in ? "Yes" : <span className="text-muted">No</span> },
    { key: "status", label: "Status", sortable: true, render: (r: ProspectRow) => <Pill value={r.status} /> },
    { key: "assigned", label: "Assigned to", sortable: true, render: (r: ProspectRow) => r.assigned_name ?? <span className="text-muted">Unassigned</span> },
    { key: "added_by", label: "Added by", sortable: true, hideOnMobile: true, render: (r: ProspectRow) => r.added_by_name ?? "—" },
    { key: "contacted", label: "Last contacted", sortable: true, className: "whitespace-nowrap text-muted", render: (r: ProspectRow) => r.last_contacted_at ? relativeTime(r.last_contacted_at) : "Never" },
  ];
  const qs = queryString(sp, { page: undefined });
  const table = (
    <DataTable columns={columns} rows={data.rows} total={data.total} page={data.page} pageSize={data.size} sp={sp} basePath={`${base}/prospects`} sortKey={data.sort.key} sortDir={data.sort.dir}
      exportHref={isAdmin ? `${base}/prospects/export?format=csv${qs ? `&${qs}` : ""}` : undefined} exportPdfHref={isAdmin ? `${base}/prospects/export?format=pdf${qs ? `&${qs}` : ""}` : undefined}
      selectable={isAdmin} rowId={(r) => r.id}
      empty={{ text: isAdmin ? "No prospects match these filters." : "No prospects of yours match these filters.", action: { label: "Add prospect", href: isAdmin ? "/admin/prospects/new" : "/employee/data-entry" } }} />
  );
  return (
    <>
      <FilterBar dates filters={[
        { key: "status", label: "Status", options: LEAD_STATUSES.map((s) => ({ value: s, label: s })) },
        { key: "tag", label: "Tag", options: tags.map((t) => ({ value: t, label: t })) },
        { key: "optin", label: "WhatsApp opt-in", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
        ...(isAdmin ? [{ key: "assigned", label: "Assigned", options: [{ value: "unassigned", label: "Unassigned" }, ...employees.map((e) => ({ value: String(e.id), label: e.name }))] }, { key: "added_by", label: "Added by", options: employees.map((e) => ({ value: String(e.id), label: e.name })) }] : []),
        { key: "locality", label: "Locality", options: localities.map((l) => ({ value: l, label: l })) },
        { key: "interest", label: "Interest", options: INTERESTS.map((i) => ({ value: i, label: i })) },
      ]} />
      {isAdmin ? (
        <form>
          <input type="hidden" name="kind" value="prospect" />
          <input type="hidden" name="return" value={`/admin/prospects${qs ? `?${qs}` : ""}`} />
          <BulkBar>
            <select name="assigned_to" className={`${inputCls} w-auto py-1`} aria-label="Assign to employee" defaultValue=""><option value="">Assign to…</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
            <button type="submit" formAction={bulkAssignAction} className="rounded-brand border border-line px-3 py-1 text-sm hover:border-ink">Assign</button>
            <select name="status" className={`${inputCls} w-auto py-1`} aria-label="Change status" defaultValue=""><option value="">Change status…</option>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            <button type="submit" formAction={bulkStatusAction} className="rounded-brand border border-line px-3 py-1 text-sm hover:border-ink">Change status</button>
            <button type="submit" formAction={bulkCreateTaskAction} className="rounded-brand border border-accent px-3 py-1 text-sm text-accent-ink hover:bg-accent hover:text-white">Create task from selected</button>
          </BulkBar>
          {table}
        </form>
      ) : table}
    </>
  );
}
