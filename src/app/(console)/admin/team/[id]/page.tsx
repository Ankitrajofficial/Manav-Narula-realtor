import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { getTeamMember } from "@/lib/queries/team";
import TeamForm from "../TeamForm";
import { deleteTeamMember, upsertTeamMember } from "../actions";

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const m = Number.isInteger(id) ? await getTeamMember(id) : null;
  if (!m) notFound();
  return (<><PageHeader title="Edit team member" description={m.name} /><TeamForm member={m} action={upsertTeamMember.bind(null, id)} onDelete={deleteTeamMember.bind(null, id)} /></>);
}
