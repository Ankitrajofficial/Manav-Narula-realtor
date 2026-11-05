import PageHeader from "@/components/console/PageHeader";
import ProspectsTable from "@/components/console/ProspectsTable";
import { requireUser } from "@/lib/auth";

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Old prospects" description="Earlier entries. New entries are added as leads." />
      <ProspectsTable sp={sp} base="/admin" />
    </>
  );
}
