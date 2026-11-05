import Shell from "@/components/console/Shell";
import { requireUser } from "@/lib/auth";
import { employeeNav } from "@/lib/console";
import { latestNotificationId, notificationCount } from "@/lib/queries/common";
import { one } from "@/lib/db";

export const metadata = { title: "Employee console", robots: { index: false } };

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("employee");
  const [count, latestId, older] = await Promise.all([notificationCount(user.id, user.role), latestNotificationId(user.id), one<{ n: number }>("SELECT count(*)::int AS n FROM prospects WHERE assigned_to = $1 OR added_by = $1", [user.id])]);
  // New entries are always leads. Only people who still have earlier prospects see them, so nothing they were working on disappears.
  const nav = older?.n ? [...employeeNav.slice(0, 2), { href: "/employee/prospects", label: "Old prospects", icon: "userPlus" }, ...employeeNav.slice(2)] : employeeNav;
  return (
    <Shell user={user} nav={nav} home="/employee" notifications={{ count, latestId, href: "/employee/notifications" }} quick={[
      { label: "Lead", href: "/employee/leads/new" },
      { label: "Sale", href: "/employee/sales/new" },
    ]}>
      {children}
    </Shell>
  );
}
