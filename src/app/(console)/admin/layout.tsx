import Shell from "@/components/console/Shell";
import { requireUser } from "@/lib/auth";
import { adminNav } from "@/lib/console";
import { latestNotificationId, notificationCount } from "@/lib/queries/common";
import { one } from "@/lib/db";

export const metadata = { title: "Admin console", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  const [count, latestId, older] = await Promise.all([notificationCount(user.id, user.role), latestNotificationId(user.id), one<{ n: number }>("SELECT count(*)::int AS n FROM prospects")]);
  // Everything is a lead now. Old prospects stay reachable until they are merged (scripts/merge-prospects-into-leads.mjs), then this entry disappears.
  const nav = older?.n ? [...adminNav.slice(0, 2), { href: "/admin/prospects", label: "Old prospects", icon: "userPlus", group: "Sales" }, ...adminNav.slice(2)] : adminNav;
  return (
    <Shell user={user} nav={nav} home="/admin" notifications={{ count, latestId, href: "/admin/notifications" }} quick={[
      { label: "Lead", href: "/admin/leads/new" },
      { label: "Task", href: "/admin/tasks/new" },
      { label: "Property", href: "/admin/properties/new" },
      { label: "Project", href: "/admin/projects/new" },
      { label: "Blog post", href: "/admin/blog/new" },
      { label: "Employee", href: "/admin/employees/new" },
      { label: "Sale", href: "/admin/sales/new" },
    ]}>
      {children}
    </Shell>
  );
}
