import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import RecordProfile from "@/components/console/RecordProfile";
import { requireUser } from "@/lib/auth";
import { getLead, leadActivities } from "@/lib/queries/leads";
import { listEmployees } from "@/lib/queries/common";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const record = await getLead(id);
  if (!record) notFound();
  const [activities, employees] = await Promise.all([leadActivities(id), listEmployees()]);
  return (
    <>
      <PageHeader title={record.name} description={`Lead #${record.id}`} />
      <RecordProfile kind="lead" record={record} activities={activities} isAdmin={true} base="/admin" employees={employees} />
    </>
  );
}
