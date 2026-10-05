import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import ConfirmButton from "@/components/console/ConfirmButton";
import SaleDetails from "@/components/console/SaleDetails";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { getSale, listSaleDocuments } from "@/lib/queries/sales";
import { formatINR } from "@/lib/format";
import { approveSale, deleteSale } from "../actions";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser("admin");
  const id = Number((await params).id);
  const sale = id ? await getSale(id) : null;
  if (!sale) notFound();
  const docs = await listSaleDocuments(id);
  return (
    <>
      <PageHeader title={`${sale.client_name ?? "Sale"} · ${formatINR(sale.deal_value)}`} description={`Closed by ${sale.employee_name ?? "—"}`} actions={
        <>
          {sale.status === "Pending approval" && <form action={approveSale}><input type="hidden" name="id" value={sale.id} /><input type="hidden" name="back" value={`/admin/sales/${sale.id}`} /><button type="submit" className="rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink">Approve</button></form>}
          <Link href={`/admin/sales/${sale.id}/edit`} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="edit" size={14} />Edit</Link>
          <form action={deleteSale}><input type="hidden" name="id" value={sale.id} /><ConfirmButton label="Delete" confirmLabel="Delete sale" /></form>
        </>
      } />
      <SaleDetails sale={sale} docs={docs} base="/admin" viewerId={me.id} isAdmin />
    </>
  );
}
