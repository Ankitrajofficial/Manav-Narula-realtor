import PageHeader from "@/components/console/PageHeader";
import CsvImporter from "@/components/console/CsvImporter";
import { requireUser } from "@/lib/auth";

export default async function ImportleadsPage() {
  await requireUser("admin");
  return (
    <>
      <PageHeader title="Import leads from CSV" description="Map your columns, check the preview, then import. Rows with a missing name, an invalid phone or a number already in the system are skipped." />
      <div className="max-w-4xl"><CsvImporter kind="lead" /></div>
    </>
  );
}
