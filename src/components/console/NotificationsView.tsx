import Link from "next/link";
import PageHeader from "./PageHeader";
import EmptyState from "./EmptyState";
import PushToggle from "./PushToggle";
import type { SessionUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { KIND_LABEL } from "@/lib/notify";
import { pushPublicKey } from "@/lib/push";
import { listNotifications, listStoredNotifications } from "@/lib/queries/common";
import { markAllReadAction } from "@/app/(console)/notification-actions";

/** Admin and employee notifications page: new enquiries and assignments (stored, read/unread), then what needs attention today. */
export default async function NotificationsView({ user }: { user: SessionUser }) {
  const [stored, due] = await Promise.all([listStoredNotifications(user.id, { limit: 100 }), listNotifications(user.id, user.role)]);
  const unread = stored.filter((n) => !n.read_at).length;
  return (
    <>
      <PageHeader
        title="Notifications"
        description={user.role === "admin" ? "Every website enquiry, plus follow-ups due and leads waiting for assignment." : "Leads and tasks given to you, plus your follow-ups due."}
        actions={unread > 0 && <form action={markAllReadAction}><button type="submit" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">Mark all as read ({unread})</button></form>}
      />
      <PushToggle publicKey={pushPublicKey()} />

      <h2 className="mb-2 text-base">Recent</h2>
      {stored.length === 0 ? <EmptyState text="No notifications yet." /> : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white">
          {stored.map((n) => (
            <li key={n.id}>
              <a href={`/api/notifications/open/${n.id}`} className={`flex items-start justify-between gap-4 px-4 py-3 hover:bg-bg ${n.read_at ? "" : "bg-accent/5"}`}>
                <span className="flex min-w-0 items-start gap-3">
                  <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-accent"}`} />
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-wide text-muted">{KIND_LABEL[n.kind] ?? n.kind}{n.read_at ? "" : <span className="sr-only">, unread</span>}</span>
                    <span className={`block ${n.read_at ? "" : "font-medium"}`}>{n.title}</span>
                    {n.body && <span className="block text-sm text-muted">{n.body}</span>}
                  </span>
                </span>
                <span className="whitespace-nowrap text-sm tabular text-muted">{formatDateTime(n.created_at)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 mt-8 text-base">Needs attention</h2>
      {due.length === 0 ? <EmptyState text="Nothing needs attention right now." /> : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white">
          {due.map((n, i) => (
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
