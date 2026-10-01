import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import ConfirmButton from "@/components/console/ConfirmButton";
import SaleForm from "@/components/console/SaleForm";
import { requireUser } from "@/lib/auth";
import { listEmployees } from "@/lib/queries/common";
import { getSale, salePropertyOptions } from "@/lib/queries/sales";
import { leadOptions, prospectOptions } from "@/lib/queries/tasks";
import { formatDateTime, formatINR } from "@/lib/format";
import { approveSale, deleteSale, updateSale } from "../actions";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const sale = id ? await getSale(id) : null;
  if (!sale) notFound();
  const [employees, leads, prospects, properties] = await Promise.all([listEmployees(false), leadOptions(), prospectOptions(), salePropertyOptions()]);
  const saleDate = typeof sale.sale_date === "string" ? sale.sale_date.slice(0, 10) : sale.sale_date.toISOString().slice(0, 10);
  return (
    <div className="max-w-3xl">
      <PageHeader title={`${sale.client_name ?? "Sale"} · ${formatINR(sale.deal_value)}`} description={`Recorded ${formatDateTime(sale.created_at)} by ${sale.employee_name ?? "admin"}`} actions={
        <>
          <Pill value={sale.status} />
          {sale.status === "Pending approval" && <form action={approveSale}><input type="hidden" name="id" value={sale.id} /><input type="hidden" name="back" value={`/admin/sales/${sale.id}`} /><button type="submit" className="rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink">Approve</button></form>}
          <form action={deleteSale}><input type="hidden" name="id" value={sale.id} /><ConfirmButton label="Delete" confirmLabel="Delete sale" /></form>
        </>
      } />
      <SaleForm action={updateSale.bind(null, id)} employees={employees} leads={leads} prospects={prospects} properties={properties} values={{ ...sale, sale_date: saleDate, deal_value: Number(sale.deal_value), commission: Number(sale.commission) }} />
    </div>
  );
}
