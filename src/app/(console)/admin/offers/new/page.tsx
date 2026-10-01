import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { projectOptions, propertyOptions } from "@/lib/queries/common";
import OfferForm from "../OfferForm";
import { upsertOffer } from "../actions";

export default async function NewOfferPage() {
  await requireUser("admin");
  const [properties, projects] = await Promise.all([propertyOptions(), projectOptions()]);
  return (<><PageHeader title="Add offer" /><OfferForm properties={properties} projects={projects} action={upsertOffer.bind(null, null)} /></>);
}
