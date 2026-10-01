import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { listLocalities } from "@/lib/queries/common";
import ProjectForm from "../ProjectForm";
import { createProject } from "../actions";

export default async function NewProjectPage() {
  await requireUser("admin");
  const localities = await listLocalities();
  return (
    <>
      <PageHeader title="Add project" />
      <ProjectForm localities={localities} action={createProject} />
    </>
  );
}
