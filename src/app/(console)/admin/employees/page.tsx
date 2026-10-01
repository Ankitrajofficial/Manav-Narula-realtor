import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import DataTable from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import Pill from "@/components/console/Pill";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { listEmployeeRows, type EmployeeRow } from "@/lib/queries/employees";
import { setEmployeeStatus } from "./actions";

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireUser("admin");
  const sp = await searchParams;
  const { rows, total, page, size, sort } = await listEmployeeRows(sp);
  return (
    <>
      <PageHeader title="Employees" description="Who can sign in to the consoles. Blocked accounts keep their records but cannot log in." actions={<Link href="/admin/employees/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />Create employee</Link>} />
      <FilterBar searchPlaceholder="Search name, email or phone" filters={[
        { key: "role", label: "Role", options: [{ value: "employee", label: "Employee" }, { value: "admin", label: "Admin" }] },
        { key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "blocked", label: "Blocked" }] },
      ]} />
      <DataTable<EmployeeRow>
        rows={rows} total={total} page={page} pageSize={size} sp={sp} basePath="/admin/employees" sortKey={sort.key} sortDir={sort.dir} rowId={(r) => r.id}
        empty={{ text: "No employees match." }}
        columns={[
          { key: "name", label: "Name", sortable: true, render: (r) => <Link href={`/admin/employees/${r.id}`} className="font-medium hover:text-accent-ink">{r.name}{r.id === me.id && <span className="ml-2 text-xs text-muted">(you)</span>}</Link> },
          { key: "email", label: "Email", sortable: true },
          { key: "phone", label: "Phone", className: "tabular", render: (r) => r.phone ?? "—" },
          { key: "role", label: "Role", sortable: true, render: (r) => (r.role === "admin" ? "Admin" : "Employee") },
          { key: "status", label: "Status", sortable: true, render: (r) => <Pill value={r.status === "blocked" ? "Blocked" : "Active"} /> },
          { key: "open_leads", label: "Open leads", sortable: true, className: "tabular" },
          { key: "last_login_at", label: "Last login", sortable: true, className: "whitespace-nowrap text-muted", render: (r) => formatDateTime(r.last_login_at) || "Never" },
          { key: "actions", label: "", render: (r) => (
            <span className="flex gap-1">
              <Link href={`/admin/employees/${r.id}`} className="rounded-brand border border-line px-2 py-1 text-xs hover:border-ink">Edit</Link>
              {r.id !== me.id && (
                <form action={setEmployeeStatus.bind(null, r.id, r.status === "blocked" ? "active" : "blocked")}>
                  <button type="submit" className={`rounded-brand border px-2 py-1 text-xs ${r.status === "blocked" ? "border-line hover:border-ink" : "border-line text-red-700 hover:border-red-700"}`}>{r.status === "blocked" ? "Unblock" : "Block"}</button>
                </form>
              )}
            </span>
          ) },
        ]}
      />
    </>
  );
}
