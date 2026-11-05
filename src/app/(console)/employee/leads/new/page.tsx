import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import RecordForm from "@/components/console/RecordForm";
import CsvImporter from "@/components/console/CsvImporter";
import { requireUser } from "@/lib/auth";
import { listLocalities, listSources, listTags, propertyOptions, projectOptions } from "@/lib/queries/common";
import { saveLeadAction } from "@/app/(console)/records/actions";

/** The one place employees enter leads: the dashboard's big green button, Leads > Add lead and Import CSV all open it. The lead is assigned to whoever adds it. */
export default async function EmployeeNewLeadPage({ searchParams }: { searchParams: Promise<{ tab?: string; toast?: string }> }) {
  await requireUser("employee");
  const { tab = "one", toast } = await searchParams;
  const [localities, sources, tags, properties, projects] = await Promise.all([listLocalities(), listSources(), listTags(), propertyOptions(), projectOptions()]);
  const tabCls = (t: string) => `rounded-brand border px-4 py-2 text-sm ${tab === t ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-ink"}`;
  return (
    <>
      <PageHeader title="Add new lead" description="Name and phone are enough. Everything you enter is tagged with your name and visible to the admin." />
      <div className="mb-5 flex gap-2">
        <Link href="/employee/leads/new" className={tabCls("one")}>One at a time</Link>
        <Link href="/employee/leads/new?tab=import" className={tabCls("import")}>Import CSV</Link>
      </div>
      {tab === "import" ? <div className="max-w-4xl"><CsvImporter kind="lead" /></div> : (
        <div className="max-w-xl"><RecordForm key={toast ?? "new"} kind="lead" simple action={saveLeadAction} isAdmin={false} andAnother returnTo="/employee/leads/new" cancelHref="/employee/leads" defaults={{ source: "Data entry", whatsapp_opt_in: false }} opts={{ localities, sources: sources.filter((s) => s !== "Website"), tags, properties, projects }} /></div>
      )}
    </>
  );
}
