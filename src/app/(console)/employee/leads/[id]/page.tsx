import { notFound } from "next/navigation";
import SimpleRecordProfile from "@/components/console/SimpleRecordProfile";
import { requireUser } from "@/lib/auth";
import { getLead, leadActivities } from "@/lib/queries/leads";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("employee");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const record = await getLead(id, { userId: user.id });
  if (!record) notFound();
  const activities = await leadActivities(id);
  return <SimpleRecordProfile kind="lead" record={record} activities={activities} />;
}
