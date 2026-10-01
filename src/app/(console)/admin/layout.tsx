import Shell from "@/components/console/Shell";
import { requireUser } from "@/lib/auth";
import { adminNav } from "@/lib/console";
import { notificationCount } from "@/lib/queries/common";

export const metadata = { title: "Admin console", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  const count = await notificationCount(user.id, user.role);
  return (
    <Shell user={user} nav={adminNav} home="/admin" notifications={{ count, href: "/admin/notifications" }} quick={[
      { label: "Lead", href: "/admin/leads/new" },
      { label: "Prospect", href: "/admin/prospects/new" },
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
