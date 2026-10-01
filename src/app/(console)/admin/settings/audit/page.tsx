import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import DataTable, { queryString } from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { auditEntities, listAudit, type AuditRow } from "@/lib/queries/settings";

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const [{ rows, total, page, size }, entities] = await Promise.all([listAudit(sp), auditEntities()]);
  return (
    <>
      <PageHeader title="Audit log" description="Who changed what, and when. Written automatically by every console action." actions={<Link href="/admin/settings" className="text-sm text-muted hover:text-ink">Back to settings</Link>} />
      <FilterBar searchPlaceholder="Search action, entity or user" dates filters={[{ key: "entity", label: "Entity", options: entities.map((e) => ({ value: e, label: e })) }]} />
      <DataTable<AuditRow>
        rows={rows} total={total} page={page} pageSize={size} sp={sp} basePath="/admin/settings/audit" rowId={(r) => r.id}
        exportHref={`/admin/settings/audit/export?${queryString(sp)}`}
        empty={{ text: "No audit entries match." }}
        columns={[
          { key: "created_at", label: "When", className: "whitespace-nowrap tabular", render: (r) => formatDateTime(r.created_at) },
          { key: "user_name", label: "User", render: (r) => r.user_name ?? <span className="text-muted">System / visitor</span> },
          { key: "action", label: "Action" },
          { key: "entity", label: "Entity" },
          { key: "entity_id", label: "ID", className: "tabular text-muted" },
          { key: "details", label: "Details", className: "max-w-md truncate text-muted", render: (r) => r.details ? JSON.stringify(r.details) : "" },
        ]}
      />
    </>
  );
}
