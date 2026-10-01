import PageHeader from "@/components/console/PageHeader";
import RecordForm from "@/components/console/RecordForm";
import { requireUser } from "@/lib/auth";
import { listEmployees, listLocalities, listSources, listTags, propertyOptions, projectOptions } from "@/lib/queries/common";
import { saveLeadAction } from "@/app/(console)/records/actions";

export default async function NewLeadPage() {
  await requireUser("admin");
  const [localities, sources, tags, employees, properties, projects] = await Promise.all([listLocalities(), listSources(), listTags(), listEmployees(), propertyOptions(), projectOptions()]);
  return (
    <>
      <PageHeader title="Add lead" description="Manual entry for walk-ins, referrals and phone enquiries. Website enquiries are added automatically." />
      <div className="max-w-3xl"><RecordForm kind="lead" action={saveLeadAction} isAdmin cancelHref="/admin/leads" opts={{ localities, sources: sources.filter((s) => s !== "Website"), tags, employees, properties, projects }} /></div>
    </>
  );
}
