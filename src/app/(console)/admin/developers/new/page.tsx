import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import DeveloperForm from "../DeveloperForm";
import { createDeveloper } from "../actions";

export default async function NewDeveloperPage() {
  await requireUser("admin");
  return (
    <>
      <PageHeader title="Add developer" />
      <DeveloperForm action={createDeveloper} />
    </>
  );
}
