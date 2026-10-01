import Link from "next/link";
import DataTable, { queryString } from "./DataTable";
import FilterBar from "./FilterBar";
import Pill from "./Pill";
import BulkBar from "./BulkBar";
import { inputCls } from "./Form";
import { LEAD_STATUSES, INTERESTS } from "@/lib/console";
import { formatShortDate, relativeTime } from "@/lib/format";
import { listLeads, type LeadRow, type SP } from "@/lib/queries/leads";
import { listEmployees, listLocalities, listSources } from "@/lib/queries/common";
import { bulkAssignAction, bulkCreateTaskAction, bulkStatusAction } from "@/app/(console)/records/actions";

/** Shared leads list for admin (bulk actions, all rows) and employee (own rows). */
export default async function LeadsTable({ sp, base, userId }: { sp: SP; base: "/admin" | "/employee"; userId?: number }) {
  const isAdmin = base === "/admin";
  const [data, employees, localities, sources] = await Promise.all([listLeads(sp, userId ? { userId } : {}), isAdmin ? listEmployees() : Promise.resolve([]), listLocalities(), listSources()]);
  const columns = [
    { key: "name", label: "Name", sortable: true, render: (r: LeadRow) => <Link href={`${base}/leads/${r.id}`} className="font-medium hover:text-accent-ink">{r.name}</Link> },
    { key: "phone", label: "Phone", sortable: true, className: "tabular", render: (r: LeadRow) => <a href={`tel:${r.phone}`} className="hover:text-accent-ink">{r.phone}</a> },
    { key: "source", label: "Source", sortable: true, hideOnMobile: true },
    { key: "interest", label: "Interest", sortable: true, hideOnMobile: true, render: (r: LeadRow) => r.interest ?? "—" },
    { key: "property", label: "Property / project", hideOnMobile: true, render: (r: LeadRow) => <span className="block max-w-[200px] truncate" title={r.property_title ?? r.project_name ?? ""}>{r.property_title ?? r.project_name ?? "—"}</span> },
    { key: "locality", label: "Locality", sortable: true, render: (r: LeadRow) => r.locality ?? "—" },
    { key: "status", label: "Status", sortable: true, render: (r: LeadRow) => <Pill value={r.status} /> },
    { key: "assigned", label: "Assigned to", sortable: true, render: (r: LeadRow) => r.assigned_name ?? <span className="text-muted">Unassigned</span> },
    { key: "created", label: "Created", sortable: true, hideOnMobile: true, className: "tabular whitespace-nowrap", render: (r: LeadRow) => formatShortDate(r.created_at) },
    { key: "activity", label: "Last activity", sortable: true, className: "whitespace-nowrap text-muted", render: (r: LeadRow) => relativeTime(r.last_activity_at) },
  ];
  const qs = queryString(sp, { page: undefined });
  const table = (
    <DataTable columns={columns} rows={data.rows} total={data.total} page={data.page} pageSize={data.size} sp={sp} basePath={`${base}/leads`} sortKey={data.sort.key} sortDir={data.sort.dir}
      exportHref={isAdmin ? `${base}/leads/export?format=csv${qs ? `&${qs}` : ""}` : undefined} exportPdfHref={isAdmin ? `${base}/leads/export?format=pdf${qs ? `&${qs}` : ""}` : undefined}
      selectable={isAdmin} rowId={(r) => r.id}
      empty={{ text: isAdmin ? "No leads match. Website enquiries appear here automatically." : "No leads assigned to you match these filters.", action: isAdmin ? { label: "Add lead", href: "/admin/leads/new" } : undefined }} />
  );
  return (
    <>
      <FilterBar dates filters={[
        { key: "status", label: "Status", options: LEAD_STATUSES.map((s) => ({ value: s, label: s })) },
        { key: "source", label: "Source", options: sources.map((s) => ({ value: s, label: s })) },
        ...(isAdmin ? [{ key: "assigned", label: "Assigned", options: [{ value: "unassigned", label: "Unassigned" }, ...employees.map((e) => ({ value: String(e.id), label: e.name }))] }] : []),
        { key: "locality", label: "Locality", options: localities.map((l) => ({ value: l, label: l })) },
        { key: "interest", label: "Interest", options: INTERESTS.map((i) => ({ value: i, label: i })) },
      ]} />
      {isAdmin ? (
        <form>
          <input type="hidden" name="kind" value="lead" />
          <input type="hidden" name="return" value={`/admin/leads${qs ? `?${qs}` : ""}`} />
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
