import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { getPopup } from "@/lib/queries/popups";
import PopupForm from "../PopupForm";
import { upsertPopup } from "../actions";

export default async function EditPopupPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  // Enquiry pop-ups can tag their leads with a project.
  const projects = await q<{ id: number; name: string }>("SELECT id, name FROM projects ORDER BY name");
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await getPopup(id) : null;
  if (!p) notFound();
  return (<><PageHeader title="Edit pop-up" description={p.title} /><PopupForm popup={p} projects={projects} action={upsertPopup.bind(null, id)} /></>);
}
