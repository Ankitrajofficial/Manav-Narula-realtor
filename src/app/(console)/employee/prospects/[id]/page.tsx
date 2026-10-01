import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import RecordProfile from "@/components/console/RecordProfile";
import { requireUser } from "@/lib/auth";
import { getProspect, prospectActivities } from "@/lib/queries/prospects";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("employee");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const record = await getProspect(id, { userId: user.id });
  if (!record) notFound();
  const [activities, employees] = await Promise.all([prospectActivities(id), Promise.resolve([])]);
  return (
    <>
      <PageHeader title={record.name} description={`Prospect #${record.id}`} />
      <RecordProfile kind="prospect" record={record} activities={activities} isAdmin={false} base="/employee" employees={employees} />
    </>
  );
}
