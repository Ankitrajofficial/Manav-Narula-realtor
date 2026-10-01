import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import EmptyState from "@/components/console/EmptyState";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/queries/common";
import { formatDateTime } from "@/lib/format";

export default async function NotificationsPage() {
  const user = await requireUser("admin");
  const items = await listNotifications(user.id, user.role);
  return (
    <>
      <PageHeader title="Notifications" description="Follow-ups due today or overdue, and new leads waiting for assignment." />
      {items.length === 0 ? <EmptyState text="Nothing needs attention right now." /> : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white">
          {items.map((n, i) => (
            <li key={i}>
              <Link href={n.href} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-bg">
                <span><span className="mr-3 inline-block w-20 text-xs uppercase tracking-wide text-muted">{n.kind}</span>{n.title}<span className="ml-2 text-sm text-muted">{n.detail}</span></span>
                <span className="whitespace-nowrap text-sm tabular text-muted">{formatDateTime(n.at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
