import { requireExporter } from "@/lib/export-guard";
import { csvResponse, toCsv } from "@/lib/csv";
import { listProjects, type ProjectRow } from "@/lib/queries/content";
import { audit } from "@/lib/records";

export async function GET(req: Request) {
  const user = await requireExporter(req); if (user instanceof Response) return user;
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const all: ProjectRow[] = [];
  for (let page = 1; page < 100; page++) {
    const r = await listProjects({ ...sp, page: String(page) });
    all.push(...r.rows);
    if (all.length >= r.total || r.rows.length === 0) break;
  }
  await audit(user.id, "export_csv", "project", null, { count: all.length, filters: sp });
  return csvResponse(toCsv<ProjectRow>(all, [
    { key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "slug", label: "Slug" }, { key: "developer", label: "Developer" }, { key: "locality", label: "Locality" }, { key: "status", label: "Status" },
    { key: "progress", label: "Progress %" }, { key: "starting_price", label: "Starting price" }, { key: "possession", label: "Possession" }, { key: "rera", label: "RERA" }, { key: "published", label: "Published", value: (r) => (r.published ? "Yes" : "No") }, { key: "updated_at", label: "Updated" },
  ]), `projects-${new Date().toISOString().slice(0, 10)}.csv`);
}
