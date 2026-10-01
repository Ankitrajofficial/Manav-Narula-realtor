import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import RecordProfile from "@/components/console/RecordProfile";
import { requireUser } from "@/lib/auth";
import { getProspect, prospectActivities } from "@/lib/queries/prospects";
import { listEmployees } from "@/lib/queries/common";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const record = await getProspect(id);
  if (!record) notFound();
  const [activities, employees] = await Promise.all([prospectActivities(id), listEmployees()]);
  return (
    <>
      <PageHeader title={record.name} description={`Prospect #${record.id}`} />
      <RecordProfile kind="prospect" record={record} activities={activities} isAdmin={true} base="/admin" employees={employees} />
    </>
  );
}
