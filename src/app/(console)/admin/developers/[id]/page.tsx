import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import ConfirmButton from "@/components/console/ConfirmButton";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { getDeveloper, listDevelopers } from "@/lib/queries/content";
import DeveloperForm from "../DeveloperForm";
import { deleteDeveloper, editDeveloper, moveProject } from "../actions";

export default async function EditDeveloperPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [d, developers, projects] = await Promise.all([
    getDeveloper(id), listDevelopers(),
    q<{ id: number; name: string; slug: string; published: boolean; units: { label: string }[] }>("SELECT id, name, slug, published, units FROM projects WHERE developer_id = $1 ORDER BY name", [id]),
  ]);
  if (!d) notFound();
  const others = developers.filter((x) => x.id !== id);
  return (
    <>
      <PageHeader title={d.name} description={`/developers/${d.slug} · ${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
        actions={projects.some((p) => p.published) ? <Link href={`/developers/${d.slug}`} target="_blank" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">View on website</Link> : <Link href={`/admin/preview?to=${encodeURIComponent(`/developers/${d.slug}`)}`} target="_blank" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">Preview</Link>} />
      <DeveloperForm developer={d} action={editDeveloper.bind(null, id)} />
      <section className="mt-6 rounded-brand border border-line bg-white p-5">
        <h2 className="text-base">Projects</h2>
        <p className="mt-1 text-xs text-muted">Moving a project here keeps it with the new developer even after a re-import.</p>
        {projects.length === 0 ? <p className="mt-3 text-sm text-muted">No projects yet.</p> : (
          <ul className="mt-3 divide-y divide-line">
            {projects.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <Link href={`/admin/projects/${p.id}`} className="font-medium hover:text-accent-ink">{p.name}</Link>
                <Pill value={p.published ? "Published" : "Draft"} />
                {(p.units ?? []).length > 0 && <span className="text-xs text-muted">{p.units.map((u) => u.label).join(" · ")}</span>}
                {others.length > 0 && (
                  <form action={moveProject.bind(null, p.id)} className="ml-auto flex items-center gap-2">
                    <label className="sr-only" htmlFor={`move-${p.id}`}>Move {p.name} to</label>
                    <select id={`move-${p.id}`} name="developer_id" defaultValue="" required className="rounded-brand border border-line bg-white px-2 py-1.5 text-sm">
                      <option value="" disabled>Move to…</option>
                      {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <button type="submit" className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Move</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {projects.length === 0 && <div className="mt-6"><ConfirmButton label="Delete developer" confirmLabel="Delete developer" action={deleteDeveloper.bind(null, id)} /></div>}
    </>
  );
}
