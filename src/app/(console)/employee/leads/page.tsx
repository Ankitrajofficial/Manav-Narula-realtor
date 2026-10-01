import PageHeader from "@/components/console/PageHeader";
import LeadsTable from "@/components/console/LeadsTable";
import { requireUser } from "@/lib/auth";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employee");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="My Leads" description="Leads assigned to you or added by you." />
      <LeadsTable sp={sp} base="/employee" userId={user.id} />
    </>
  );
}
