import Link from "next/link";
import Icon from "@/components/Icon";
import PageHeader from "@/components/console/PageHeader";
import LeadsTable from "@/components/console/LeadsTable";
import { requireUser } from "@/lib/auth";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employee");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Leads" description="Leads assigned to you or added by you." actions={<Link href="/employee/leads/new" className="inline-flex min-h-11 items-center gap-2 rounded-brand bg-accent px-4 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />Add lead</Link>} />
      <LeadsTable sp={sp} base="/employee" userId={user.id} />
    </>
  );
}
