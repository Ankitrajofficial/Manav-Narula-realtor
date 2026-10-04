import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import PopupForm from "../PopupForm";
import { upsertPopup } from "../actions";

export default async function NewPopupPage() {
  await requireUser("admin");
  return (<><PageHeader title="New pop-up" /><PopupForm action={upsertPopup.bind(null, null)} /></>);
}
