import { requireUser } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { listAudit, type AuditRow } from "@/lib/queries/settings";

export async function GET(req: Request) {
  await requireUser("admin");
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const all: AuditRow[] = [];
  for (let page = 1; page < 200; page++) {
    const r = await listAudit({ ...sp, page: String(page) });
    all.push(...r.rows);
    if (all.length >= r.total || r.rows.length === 0) break;
  }
  return csvResponse(toCsv<AuditRow>(all, [
    { key: "created_at", label: "When" }, { key: "user_name", label: "User" }, { key: "action", label: "Action" }, { key: "entity", label: "Entity" }, { key: "entity_id", label: "Entity ID" }, { key: "details", label: "Details", value: (r) => (r.details ? JSON.stringify(r.details) : "") },
  ]), `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
}
