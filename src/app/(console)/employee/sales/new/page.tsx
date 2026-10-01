import PageHeader from "@/components/console/PageHeader";
import SaleForm from "@/components/console/SaleForm";
import { requireUser } from "@/lib/auth";
import { salePropertyOptions } from "@/lib/queries/sales";
import { leadOptions, prospectOptions } from "@/lib/queries/tasks";
import { employeeCreateSale } from "../actions";

export default async function NewMySalePage({ searchParams }: { searchParams: Promise<{ lead?: string; prospect?: string }> }) {
  const user = await requireUser("employee");
  const sp = await searchParams;
  const [leads, prospects, properties] = await Promise.all([leadOptions(user.id), prospectOptions(user.id), salePropertyOptions()]);
  return (
    <div className="max-w-3xl">
      <PageHeader title="Record sale" description="Only your own leads and prospects are listed. The admin approves each sale." />
      <SaleForm action={employeeCreateSale} leads={leads} prospects={prospects} properties={properties} submitLabel="Record sale" values={{ lead_id: sp.lead ? Number(sp.lead) : null, prospect_id: sp.prospect ? Number(sp.prospect) : null }} />
    </div>
  );
}
