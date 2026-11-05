import { redirect } from "next/navigation";

/** Imports create leads. Kept so old bookmarks land in the right place. */
export default function ImportProspectsPage() {
  redirect("/admin/leads/import");
}
