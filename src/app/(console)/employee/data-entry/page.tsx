import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import RecordForm from "@/components/console/RecordForm";
import CsvImporter from "@/components/console/CsvImporter";
import { requireUser } from "@/lib/auth";
import { listLocalities, listSources, listTags } from "@/lib/queries/common";
import { saveProspectAction } from "@/app/(console)/records/actions";

export default async function DataEntryPage({ searchParams }: { searchParams: Promise<{ tab?: string; toast?: string }> }) {
  await requireUser("employee");
  const { tab = "one", toast } = await searchParams;
  const [localities, sources, tags] = await Promise.all([listLocalities(), listSources(), listTags()]);
  const tabCls = (t: string) => `rounded-brand border px-4 py-2 text-sm ${tab === t ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-ink"}`;
  return (
    <>
      <PageHeader title="Data entry" description="Add prospects one by one, or import a CSV. Everything you enter is tagged with your name and visible to the admin." />
      <div className="mb-5 flex gap-2">
        <Link href="/employee/data-entry" className={tabCls("one")}>One at a time</Link>
        <Link href="/employee/data-entry?tab=import" className={tabCls("import")}>Import CSV</Link>
      </div>
      <div className="max-w-4xl">
        {tab === "import" ? <CsvImporter kind="prospect" /> : (
          <div className="max-w-3xl"><RecordForm key={toast ?? "new"} kind="prospect" action={saveProspectAction} isAdmin={false} andAnother returnTo="/employee/data-entry" cancelHref="/employee/prospects" opts={{ localities, sources: sources.filter((s) => s !== "Website"), tags }} /></div>
        )}
      </div>
    </>
  );
}
