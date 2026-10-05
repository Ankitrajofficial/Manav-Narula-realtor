import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import SaleDetails from "@/components/console/SaleDetails";
import { requireUser } from "@/lib/auth";
import { getSale, listSaleDocuments } from "@/lib/queries/sales";
import { formatINR } from "@/lib/format";

export default async function MySaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("employee");
  const id = Number((await params).id);
  const sale = id ? await getSale(id) : null;
  if (!sale || sale.employee_id !== user.id) notFound();
  const docs = await listSaleDocuments(id);
  return (
    <>
      <PageHeader title={`${sale.client_name ?? "Sale"} · ${formatINR(sale.deal_value)}`} description={sale.status === "Pending approval" ? "Waiting for admin approval. You can still add or remove your documents." : "Approved. Ask the admin to change details or remove documents."} />
      <SaleDetails sale={sale} docs={docs} base="/employee" viewerId={user.id} isAdmin={false} />
    </>
  );
}
