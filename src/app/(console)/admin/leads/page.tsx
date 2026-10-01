import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import LeadsTable from "@/components/console/LeadsTable";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Leads" description="Every enquiry from the website plus leads added by staff." actions={<>
        <Link href="/admin/leads/import" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="upload" size={14} />Import CSV</Link>
        <Link href="/admin/leads/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Add lead</Link>
      </>} />
      <LeadsTable sp={sp} base="/admin" />
    </>
  );
}
