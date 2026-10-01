import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { getSetting, listLocalityOptions, projectOptions } from "@/lib/queries/common";
import PropertyForm from "../PropertyForm";
import { createProperty } from "../actions";

export default async function NewPropertyPage() {
  await requireUser("admin");
  const [localities, types, projects] = await Promise.all([listLocalityOptions(), getSetting<string[]>("property_types", ["Kothi", "Apartment", "Plot", "Commercial", "Farmhouse"]), projectOptions()]);
  return (
    <>
      <PageHeader title="Add property" description="Save as draft to keep it off the website until it is ready." />
      <PropertyForm localities={localities} types={types} projects={projects} action={createProperty} />
    </>
  );
}
