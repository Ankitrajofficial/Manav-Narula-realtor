import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import TeamForm from "../TeamForm";
import { upsertTeamMember } from "../actions";

export default async function NewTeamMemberPage() {
  await requireUser("admin");
  return (<><PageHeader title="Add team member" /><TeamForm action={upsertTeamMember.bind(null, null)} /></>);
}
