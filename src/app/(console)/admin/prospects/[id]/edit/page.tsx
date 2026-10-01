import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import RecordForm from "@/components/console/RecordForm";
import { requireUser } from "@/lib/auth";
import { getProspect } from "@/lib/queries/prospects";
import { listEmployees, listLocalities, listSources, listTags, propertyOptions, projectOptions } from "@/lib/queries/common";
import { saveProspectAction } from "@/app/(console)/records/actions";

export default async function EditProspectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const record = await getProspect(id);
  if (!record) notFound();
  const [localities, sources, tags, employees, properties, projects] = await Promise.all([listLocalities(), listSources(), listTags(), listEmployees(), propertyOptions(), projectOptions()]);
  return (
    <>
      <PageHeader title={`Edit ${record.name}`} />
      <div className="max-w-3xl">
        <RecordForm kind="prospect" id={record.id} action={saveProspectAction} isAdmin={true} cancelHref={`/admin/prospects/${record.id}`}
          opts={{ localities, sources, tags, employees, properties, projects }}
          defaults={{ name: record.name, phone: record.phone, email: record.email, interest: record.interest, budget: record.budget, locality: record.locality, source: record.source, notes: record.notes, tags: record.tags, whatsapp_opt_in: record.whatsapp_opt_in, assigned_to: record.assigned_to }} />
      </div>
    </>
  );
}
