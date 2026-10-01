import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { projectOptions, propertyOptions } from "@/lib/queries/common";
import { getOffer } from "@/lib/queries/content";
import OfferForm from "../OfferForm";
import { upsertOffer } from "../actions";

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const [o, properties, projects] = await Promise.all([Number.isInteger(id) ? getOffer(id) : null, propertyOptions(), projectOptions()]);
  if (!o) notFound();
  return (<><PageHeader title="Edit offer" description={o.title} /><OfferForm offer={o} properties={properties} projects={projects} action={upsertOffer.bind(null, id)} /></>);
}
