import PageHeader from "@/components/console/PageHeader";
import RecordForm from "@/components/console/RecordForm";
import { requireUser } from "@/lib/auth";
import { listEmployees, listLocalities, listSources, listTags, projectOptions } from "@/lib/queries/common";
import { saveProspectAction } from "@/app/(console)/records/actions";

export default async function NewProspectPage({ searchParams }: { searchParams: Promise<{ toast?: string }> }) {
  await requireUser("admin");
  const { toast } = await searchParams;
  const [localities, sources, tags, employees, projects] = await Promise.all([listLocalities(), listSources(), listTags(), listEmployees(), projectOptions()]);
  return (
    <>
      <PageHeader title="Add prospect" description="One structured record per person. The phone number must be unique." />
      <div className="max-w-3xl"><RecordForm key={toast ?? "new"} kind="prospect" action={saveProspectAction} isAdmin andAnother returnTo="/admin/prospects/new" cancelHref="/admin/prospects" opts={{ localities, sources: sources.filter((s) => s !== "Website"), tags, employees, projects }} /></div>
    </>
  );
}
