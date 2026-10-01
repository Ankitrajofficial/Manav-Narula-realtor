import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import RecordForm from "@/components/console/RecordForm";
import { requireUser } from "@/lib/auth";
import { getLead } from "@/lib/queries/leads";
import { listLocalities, listSources, listTags, propertyOptions, projectOptions } from "@/lib/queries/common";
import { saveLeadAction } from "@/app/(console)/records/actions";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("employee");
  const id = Number((await params).id);
  const record = await getLead(id, { userId: user.id });
  if (!record) notFound();
  const [localities, sources, tags, employees, properties, projects] = await Promise.all([listLocalities(), listSources(), listTags(), Promise.resolve([]), propertyOptions(), projectOptions()]);
  return (
    <>
      <PageHeader title={`Edit ${record.name}`} />
      <div className="max-w-3xl">
        <RecordForm kind="lead" id={record.id} action={saveLeadAction} isAdmin={false} cancelHref={`/employee/leads/${record.id}`}
          opts={{ localities, sources, tags, employees, properties, projects }}
          defaults={{ name: record.name, phone: record.phone, email: record.email, interest: record.interest, budget: record.budget, locality: record.locality, source: record.source, notes: record.notes, tags: record.tags, whatsapp_opt_in: record.whatsapp_opt_in, assigned_to: record.assigned_to, property_id: record.property_id, project_id: record.project_id }} />
      </div>
    </>
  );
}
