import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import ProspectsTable from "@/components/console/ProspectsTable";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employee");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="My Prospects" description="Prospects assigned to you or entered by you." actions={<>
        <Link href="/employee/data-entry?tab=import" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="upload" size={14} />Import CSV</Link>
        <Link href="/employee/data-entry" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Add prospect</Link>
      </>} />
      <ProspectsTable sp={sp} base="/employee" userId={user.id} />
    </>
  );
}
