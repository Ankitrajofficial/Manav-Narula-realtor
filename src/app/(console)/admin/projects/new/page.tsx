import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { listLocalities } from "@/lib/queries/common";
import { listDevelopers } from "@/lib/queries/content";
import ProjectForm from "../ProjectForm";
import { createProject } from "../actions";

export default async function NewProjectPage() {
  await requireUser("admin");
  const [localities, developers] = await Promise.all([listLocalities(), listDevelopers()]);
  return (
    <>
      <PageHeader title="Add project" />
      <ProjectForm localities={localities} developers={developers} action={createProject} />
    </>
  );
}
