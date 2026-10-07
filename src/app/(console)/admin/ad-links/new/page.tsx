import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { site } from "@/data/site";
import { LINK_CHANNELS } from "@/lib/queries/lead-links";
import AdLinkForm from "../AdLinkForm";
import { upsertAdLink } from "../actions";

export default async function NewAdLinkPage() {
  await requireUser("admin");
  const projects = await q<{ id: number; name: string }>("SELECT id, name FROM projects ORDER BY name");
  return (<><PageHeader title="New ad link" description="A short address for a Facebook or Instagram ad. It opens a simple enquiry page, and every lead from it is tagged with this link." /><AdLinkForm projects={projects} channels={LINK_CHANNELS} siteUrl={site.url} action={upsertAdLink.bind(null, null)} /></>);
}
