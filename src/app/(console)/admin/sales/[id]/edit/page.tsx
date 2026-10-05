import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import SaleForm from "@/components/console/SaleForm";
import { requireUser } from "@/lib/auth";
import { listEmployees } from "@/lib/queries/common";
import { getSale, salePropertyOptions } from "@/lib/queries/sales";
import { leadOptions, prospectOptions } from "@/lib/queries/tasks";
import { formatINR } from "@/lib/format";
import { updateSale } from "../../actions";

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const sale = id ? await getSale(id) : null;
  if (!sale) notFound();
  const [employees, leads, prospects, properties] = await Promise.all([listEmployees(false), leadOptions(), prospectOptions(), salePropertyOptions()]);
  const saleDate = typeof sale.sale_date === "string" ? sale.sale_date.slice(0, 10) : sale.sale_date.toISOString().slice(0, 10);
  return (
    <div className="max-w-3xl">
      <PageHeader title={`Edit sale · ${sale.client_name ?? "Sale"} · ${formatINR(sale.deal_value)}`} actions={<Link href={`/admin/sales/${id}`} className="text-sm text-muted hover:text-ink">Cancel</Link>} />
      <SaleForm action={updateSale.bind(null, id)} employees={employees} leads={leads} prospects={prospects} properties={properties} submitLabel="Save changes" values={{ ...sale, sale_date: saleDate, deal_value: Number(sale.deal_value), commission: Number(sale.commission) }} />
    </div>
  );
}
