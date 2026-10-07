import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import PopupForm from "../PopupForm";
import { upsertPopup } from "../actions";

export default async function NewPopupPage() {
  await requireUser("admin");
  // Enquiry pop-ups can tag their leads with a project.
  const projects = await q<{ id: number; name: string }>("SELECT id, name FROM projects ORDER BY name");
  return (<><PageHeader title="New pop-up" /><PopupForm projects={projects} action={upsertPopup.bind(null, null)} /></>);
}
