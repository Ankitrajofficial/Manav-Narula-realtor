import Link from "next/link";
import { Suspense } from "react";
import PageHeader from "@/components/console/PageHeader";
import DataTable, { queryString, type Column } from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import Pill from "@/components/console/Pill";
import SaleTotals from "@/components/console/SaleTotals";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { listSales, type SaleRow } from "@/lib/queries/sales";
import { formatINR, formatShortDate } from "@/lib/format";

export default async function MySalesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employee");
  const sp = await searchParams;
  const data = await listSales(sp, { employeeId: user.id });
  const rangeLabel = data.from || data.to ? `${data.from ? formatShortDate(data.from) : "Start"} to ${data.to ? formatShortDate(data.to) : "today"}` : null;
  const columns: Column<SaleRow>[] = [
    { key: "sale_date", label: "Date", sortable: true, render: (s) => <span className="tabular">{formatShortDate(s.sale_date)}</span> },
    { key: "client", label: "Client", sortable: true, render: (s) => s.lead_id ? <Link href={`/employee/leads/${s.lead_id}`} className="hover:text-accent-ink">{s.client_name ?? s.lead_name}</Link> : s.prospect_id ? <Link href={`/employee/prospects/${s.prospect_id}`} className="hover:text-accent-ink">{s.client_name ?? s.prospect_name}</Link> : (s.client_name ?? "—") },
    { key: "property", label: "Property", sortable: true, render: (s) => s.property_title ?? s.property_name ?? "—" },
    { key: "deal_value", label: "Deal value", sortable: true, className: "text-right", render: (s) => <span className="tabular">{formatINR(s.deal_value)}</span> },
    { key: "commission", label: "Commission", sortable: true, className: "text-right", render: (s) => <span className="tabular">{formatINR(s.commission)}</span> },
    { key: "status", label: "Status", sortable: true, render: (s) => <Pill value={s.status} /> },
    { key: "document", label: "Document", render: (s) => s.document_url ? <a href={s.document_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-accent-ink hover:underline"><Icon name="file" size={14} />Agreement</a> : <span className="text-muted">—</span> },
  ];
  return (
    <>
      <PageHeader title="My Sales" description="Deals you have closed. New sales wait for admin approval." actions={
        <Link href="/employee/sales/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Record sale</Link>
      } />
      <Suspense>
        <FilterBar searchPlaceholder="Search client or property" dates filters={[{ key: "status", label: "Status", options: [{ value: "Pending approval", label: "Pending approval" }, { value: "Approved", label: "Approved" }] }]} />
      </Suspense>
      <SaleTotals total={data.total} totalValue={data.totalValue} totalCommission={data.totalCommission} months={data.months} rangeLabel={rangeLabel} />
      <DataTable columns={columns} rows={data.rows} total={data.total} page={data.page} pageSize={data.size} sp={sp} basePath="/employee/sales" sortKey={data.sortKey} sortDir={data.sortDir} rowId={(s) => s.id}
        exportHref={`/employee/downloads/export?${queryString({ type: "sales", from: sp.from, to: sp.to })}`}
        empty={{ text: "You have not recorded a sale yet.", action: { label: "Record sale", href: "/employee/sales/new" } }} />
    </>
  );
}
