import NotificationsView from "@/components/console/NotificationsView";
import { requireUser } from "@/lib/auth";

export default async function NotificationsPage() {
  return <NotificationsView user={await requireUser("employee")} />;
}
