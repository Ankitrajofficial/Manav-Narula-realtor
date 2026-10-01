import Shell from "@/components/console/Shell";
import { requireUser } from "@/lib/auth";
import { employeeNav } from "@/lib/console";
import { notificationCount } from "@/lib/queries/common";

export const metadata = { title: "Employee console", robots: { index: false } };

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("employee");
  const count = await notificationCount(user.id, user.role);
  return (
    <Shell user={user} nav={employeeNav} home="/employee" notifications={{ count, href: "/employee/notifications" }} quick={[
      { label: "Prospect", href: "/employee/data-entry" },
      { label: "Sale", href: "/employee/sales/new" },
    ]}>
      {children}
    </Shell>
  );
}
