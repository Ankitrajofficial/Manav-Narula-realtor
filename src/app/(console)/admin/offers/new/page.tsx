import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { projectOptions, propertyOptions } from "@/lib/queries/common";
import OfferForm from "../OfferForm";
import { upsertOffer } from "../actions";

export default async function NewOfferPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  await requireUser("admin");
  const section = (await searchParams).section === "home_loan" ? "home_loan" : "property";
  const [properties, projects] = await Promise.all([propertyOptions(), projectOptions()]);
  return (<><PageHeader title={section === "home_loan" ? "Add home loan offer" : "Add offer"} /><OfferForm section={section} properties={properties} projects={projects} action={upsertOffer.bind(null, null)} /></>);
}
