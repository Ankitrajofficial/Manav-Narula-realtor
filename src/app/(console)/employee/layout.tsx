import Shell from "@/components/console/Shell";
import { requireUser } from "@/lib/auth";
import { employeeNav } from "@/lib/console";
import { latestNotificationId, notificationCount } from "@/lib/queries/common";

export const metadata = { title: "Employee console", robots: { index: false } };

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("employee");
  const [count, latestId] = await Promise.all([notificationCount(user.id, user.role), latestNotificationId(user.id)]);
  return (
    <Shell user={user} nav={employeeNav} home="/employee" notifications={{ count, latestId, href: "/employee/notifications" }} quick={[
      { label: "Prospect", href: "/employee/data-entry" },
      { label: "Sale", href: "/employee/sales/new" },
    ]}>
      {children}
    </Shell>
  );
}
