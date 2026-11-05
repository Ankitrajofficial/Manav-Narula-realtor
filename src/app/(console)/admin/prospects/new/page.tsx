import { redirect } from "next/navigation";

/** New entries are leads. Kept so old bookmarks land in the right place. */
export default function NewProspectPage() {
  redirect("/admin/leads/new");
}
