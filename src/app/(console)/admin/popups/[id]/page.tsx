import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { getPopup } from "@/lib/queries/popups";
import PopupForm from "../PopupForm";
import { upsertPopup } from "../actions";

export default async function EditPopupPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await getPopup(id) : null;
  if (!p) notFound();
  return (<><PageHeader title="Edit pop-up" description={p.title} /><PopupForm popup={p} action={upsertPopup.bind(null, id)} /></>);
}
