import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { listDevelopers } from "@/lib/queries/content";

export default async function DevelopersPage() {
  await requireUser("admin");
  const rows = await listDevelopers();
  return (
    <>
      <PageHeader title="Developers" description="Every project belongs to a developer. Each developer with published projects gets a page at /developers/<address>."
        actions={<Link href="/admin/developers/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />Add developer</Link>} />
      <div className="overflow-x-auto rounded-brand border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-muted"><tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Page</th><th className="px-4 py-3 font-medium">Website</th><th className="px-4 py-3 font-medium">Logo permission</th><th className="px-4 py-3 text-right font-medium">Projects</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3"><Link href={`/admin/developers/${d.id}`} className="font-medium hover:text-accent-ink">{d.name}</Link></td>
                <td className="px-4 py-3 text-muted">/developers/{d.slug}</td>
                <td className="px-4 py-3 text-muted">{d.website?.replace(/^https?:\/\//, "") ?? "—"}</td>
                <td className="px-4 py-3">{d.logo_permission ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right tabular"><Link href={`/admin/properties?dev=${d.id}`} className="hover:text-accent-ink">{d.projects}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
