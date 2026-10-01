import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import DataTable, { queryString } from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import Pill from "@/components/console/Pill";
import ToggleForm from "@/components/console/ToggleForm";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { PROJECT_STATUSES } from "@/lib/console";
import { formatShortDate } from "@/lib/format";
import { listProjects, type ProjectRow } from "@/lib/queries/content";
import { toggleProjectPublished } from "./actions";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const { rows, total, page, size, sort } = await listProjects(sp);
  return (
    <>
      <PageHeader title="Projects" description="Developer projects shown on the website with their construction progress." actions={<Link href="/admin/projects/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />Add project</Link>} />
      <FilterBar searchPlaceholder="Search name, locality or developer" filters={[
        { key: "status", label: "Status", options: PROJECT_STATUSES.map((s) => ({ value: s, label: s })) },
        { key: "published", label: "Published", options: [{ value: "1", label: "Published" }, { value: "0", label: "Draft" }] },
      ]} />
      <DataTable<ProjectRow>
        rows={rows} total={total} page={page} pageSize={size} sp={sp} basePath="/admin/projects" sortKey={sort.key} sortDir={sort.dir}
        exportHref={`/admin/projects/export?${queryString(sp)}`} rowId={(r) => r.id}
        empty={{ text: "No projects yet.", action: { label: "Add project", href: "/admin/projects/new" } }}
        columns={[
          { key: "name", label: "Name", sortable: true, render: (r) => <Link href={`/admin/projects/${r.id}`} className="font-medium hover:text-accent-ink">{r.name}</Link> },
          { key: "locality", label: "Locality", sortable: true },
          { key: "status", label: "Status", sortable: true, render: (r) => <Pill value={r.status} /> },
          { key: "progress", label: "Progress", render: (r) => <span className="flex items-center gap-2"><span className="h-1.5 w-20 rounded-brand bg-line"><span className="block h-1.5 rounded-brand bg-accent" style={{ width: `${r.progress ?? 0}%` }} /></span><span className="tabular text-xs text-muted">{r.progress ?? 0}%</span></span> },
          { key: "starting_price", label: "Starting price", sortable: true, className: "tabular" },
          { key: "possession", label: "Possession" },
          { key: "published", label: "Published", render: (r) => <ToggleForm on={r.published} label={r.published ? "Unpublish" : "Publish"} action={toggleProjectPublished.bind(null, r.id, !r.published)} /> },
          { key: "updated_at", label: "Updated", sortable: true, className: "whitespace-nowrap text-muted", render: (r) => formatShortDate(r.updated_at) },
        ]}
      />
    </>
  );
}
