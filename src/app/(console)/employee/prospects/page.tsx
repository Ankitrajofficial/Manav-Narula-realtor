import PageHeader from "@/components/console/PageHeader";
import ProspectsTable from "@/components/console/ProspectsTable";
import { requireUser } from "@/lib/auth";

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employee");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Old prospects" description="Earlier entries assigned to you or entered by you. New entries are added as leads." />
      <ProspectsTable sp={sp} base="/employee" userId={user.id} />
    </>
  );
}
