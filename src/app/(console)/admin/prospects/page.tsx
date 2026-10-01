import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import ProspectsTable from "@/components/console/ProspectsTable";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Prospects" description="People entered by staff, not from the website. Phone numbers are unique." actions={<>
        <Link href="/admin/prospects/import" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="upload" size={14} />Import CSV</Link>
        <Link href="/admin/prospects/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Add prospect</Link>
      </>} />
      <ProspectsTable sp={sp} base="/admin" />
    </>
  );
}
