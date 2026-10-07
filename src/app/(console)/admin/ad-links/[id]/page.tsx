import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { site } from "@/data/site";
import { LINK_CHANNELS, getLeadLink } from "@/lib/queries/lead-links";
import AdLinkForm from "../AdLinkForm";
import { deleteAdLink, upsertAdLink } from "../actions";

export default async function EditAdLinkPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const [k, projects] = await Promise.all([Number.isInteger(id) ? getLeadLink(id) : null, q<{ id: number; name: string }>("SELECT id, name FROM projects ORDER BY name")]);
  if (!k) notFound();
  return (<><PageHeader title="Edit ad link" description={`${k.name}. Changing the address breaks ads that still use the old one.`} /><AdLinkForm link={k} projects={projects} channels={LINK_CHANNELS} siteUrl={site.url} action={upsertAdLink.bind(null, id)} onDelete={deleteAdLink.bind(null, id)} /></>);
}
