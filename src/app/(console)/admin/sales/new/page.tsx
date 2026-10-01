import PageHeader from "@/components/console/PageHeader";
import SaleForm from "@/components/console/SaleForm";
import { requireUser } from "@/lib/auth";
import { listEmployees } from "@/lib/queries/common";
import { salePropertyOptions } from "@/lib/queries/sales";
import { leadOptions, prospectOptions } from "@/lib/queries/tasks";
import { one } from "@/lib/db";
import { createSale } from "../actions";

export default async function NewSalePage({ searchParams }: { searchParams: Promise<{ lead?: string; prospect?: string }> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const [employees, leads, prospects, properties] = await Promise.all([listEmployees(), leadOptions(), prospectOptions(), salePropertyOptions()]);
  const lead_id = sp.lead ? Number(sp.lead) : null;
  const prospect_id = sp.prospect ? Number(sp.prospect) : null;
  const linked = lead_id ? await one<{ assigned_to: number | null; property_id: number | null }>("SELECT assigned_to, property_id FROM leads WHERE id=$1", [lead_id])
    : prospect_id ? await one<{ assigned_to: number | null; property_id: number | null }>("SELECT assigned_to, NULL::int AS property_id FROM prospects WHERE id=$1", [prospect_id]) : null;
  return (
    <div className="max-w-3xl">
      <PageHeader title="Record sale" description="Sales recorded by the admin are approved immediately." />
      <SaleForm action={createSale} employees={employees} leads={leads} prospects={prospects} properties={properties} submitLabel="Record sale" values={{ lead_id, prospect_id, employee_id: linked?.assigned_to ?? null, property_id: linked?.property_id ?? null }} />
    </div>
  );
}
