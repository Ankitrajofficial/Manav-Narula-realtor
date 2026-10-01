import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import RecordProfile from "@/components/console/RecordProfile";
import { requireUser } from "@/lib/auth";
import { getLead, leadActivities } from "@/lib/queries/leads";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("employee");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const record = await getLead(id, { userId: user.id });
  if (!record) notFound();
  const [activities, employees] = await Promise.all([leadActivities(id), Promise.resolve([])]);
  return (
    <>
      <PageHeader title={record.name} description={`Lead #${record.id}`} />
      <RecordProfile kind="lead" record={record} activities={activities} isAdmin={false} base="/employee" employees={employees} />
    </>
  );
}
