import Link from "next/link";
import { Suspense } from "react";
import PageHeader from "@/components/console/PageHeader";
import DataTable, { queryString, type Column } from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import Pill from "@/components/console/Pill";
import SaleTotals from "@/components/console/SaleTotals";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { listEmployees } from "@/lib/queries/common";
import { listSales, type SaleRow } from "@/lib/queries/sales";
import { formatINR, formatShortDate } from "@/lib/format";
import { approveSale } from "./actions";

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const [employees, data] = await Promise.all([listEmployees(false), listSales(sp)]);
  const qs = queryString(sp);
  const back = `/admin/sales${qs ? `?${qs}` : ""}`;
  const rangeLabel = data.from || data.to ? `${data.from ? formatShortDate(data.from) : "Start"} to ${data.to ? formatShortDate(data.to) : "today"}` : null;
  const columns: Column<SaleRow>[] = [
    { key: "sale_date", label: "Date", sortable: true, render: (s) => <Link href={`/admin/sales/${s.id}`} className="tabular hover:text-accent-ink">{formatShortDate(s.sale_date)}</Link> },
    { key: "client", label: "Client", sortable: true, render: (s) => s.lead_id ? <Link href={`/admin/leads/${s.lead_id}`} className="hover:text-accent-ink">{s.client_name ?? s.lead_name}</Link> : s.prospect_id ? <Link href={`/admin/prospects/${s.prospect_id}`} className="hover:text-accent-ink">{s.client_name ?? s.prospect_name}</Link> : (s.client_name ?? "—") },
    { key: "property", label: "Property", sortable: true, render: (s) => s.property_id ? <Link href={`/admin/properties/${s.property_id}`} className="hover:text-accent-ink">{s.property_title ?? s.property_name}</Link> : (s.property_title ?? "—") },
    { key: "deal_value", label: "Deal value", sortable: true, className: "text-right", render: (s) => <span className="tabular">{formatINR(s.deal_value)}</span> },
    { key: "commission", label: "Commission", sortable: true, className: "text-right", render: (s) => <span className="tabular">{formatINR(s.commission)}</span> },
    { key: "employee", label: "Employee", sortable: true, render: (s) => s.employee_name ?? "—" },
    { key: "status", label: "Status", sortable: true, render: (s) => <Pill value={s.status} /> },
    { key: "document", label: "Documents", render: (s) => <Link href={`/admin/sales/${s.id}`} className="inline-flex items-center gap-1 text-accent-ink hover:underline"><Icon name="file" size={14} />{s.doc_count ? `${s.doc_count} ${s.doc_count === 1 ? "file" : "files"}` : "Add"}</Link> },
    { key: "actions", label: "", render: (s) => s.status === "Pending approval" ? (
      <form action={approveSale}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="back" value={back} /><button type="submit" className="rounded-brand border border-line px-2 py-1 text-xs hover:border-ink">Approve</button></form>
    ) : null },
    { key: "view", label: "", render: (s) => <Link href={`/admin/sales/${s.id}`} className="rounded-brand border border-line px-2 py-1 text-xs hover:border-ink">View</Link> },
  ];
  return (
    <>
      <PageHeader title="Sales" description="Every closed deal recorded by employees or admin." actions={
        <Link href="/admin/sales/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Record sale</Link>
      } />
      <Suspense>
        <FilterBar searchPlaceholder="Search client or property" dates filters={[
          { key: "employee", label: "Employee", options: employees.map((u) => ({ value: String(u.id), label: u.name })) },
          { key: "status", label: "Status", options: [{ value: "Pending approval", label: "Pending approval" }, { value: "Approved", label: "Approved" }] },
        ]} />
      </Suspense>
      <SaleTotals total={data.total} totalValue={data.totalValue} totalCommission={data.totalCommission} months={data.months} rangeLabel={rangeLabel} />
      <DataTable columns={columns} rows={data.rows} total={data.total} page={data.page} pageSize={data.size} sp={sp} basePath="/admin/sales" sortKey={data.sortKey} sortDir={data.sortDir} rowId={(s) => s.id}
        exportHref={`/admin/sales/export?${queryString(sp, { format: "csv" })}`} exportPdfHref={`/admin/sales/export?${queryString(sp, { format: "pdf" })}`}
        empty={{ text: "No sales match.", action: { label: "Record sale", href: "/admin/sales/new" } }} />
    </>
  );
}
