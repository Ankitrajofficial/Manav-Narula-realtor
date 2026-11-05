import { notFound, redirect } from "next/navigation";
import { one } from "@/lib/db";
import SimpleRecordProfile from "@/components/console/SimpleRecordProfile";
import { requireUser } from "@/lib/auth";
import { getProspect, prospectActivities } from "@/lib/queries/prospects";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("employee");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const record = await getProspect(id, { userId: user.id });
  if (!record) {
    // Prospects were merged into leads: old links and notifications open the lead instead.
    const merged = await one<{ id: number }>("SELECT id FROM leads WHERE merged_from_prospect_id = $1", [id]);
    if (merged) redirect(`/employee/leads/${merged.id}`);
    notFound();
  }
  const activities = await prospectActivities(id);
  return <SimpleRecordProfile kind="prospect" record={record} activities={activities} />;
}
