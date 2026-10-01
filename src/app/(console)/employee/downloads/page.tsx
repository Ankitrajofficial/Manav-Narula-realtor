import { redirect } from "next/navigation";

/** Downloads were removed from the employee console; old links land on My Dashboard. */
export default function DownloadsPage() {
  redirect("/employee");
}
