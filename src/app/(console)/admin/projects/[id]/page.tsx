import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import { requireUser } from "@/lib/auth";
import { listLocalities } from "@/lib/queries/common";
import { getProjectById, getProjectConfigs, getProjectMilestones, listDevelopers } from "@/lib/queries/content";
import ProjectForm from "../ProjectForm";
import { deleteProject, editProject, releaseEdits } from "../actions";

const FIELD_NAMES: Record<string, string> = {
  rera: "RERA number", size_range: "sizes", key_facts: "key facts", amenities: "amenities", location_highlights: "location highlights", address: "address",
  locality: "locality", city: "city", description: "description", highlights: "highlights", faqs: "questions", seo_title: "SEO title",
  seo_description: "SEO description", media: "images", developer: "developer", configurations: "configurations",
};

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [p, configs, milestones, localities, developers] = await Promise.all([getProjectById(id), getProjectConfigs(id), getProjectMilestones(id), listLocalities(), listDevelopers()]);
  if (!p) notFound();
  const edited = p.edited_fields ?? [];
  const path = `/projects/${p.slug}`;
  return (
    <>
      <PageHeader title={p.name} description={`${p.developer ?? "No developer"} · ${p.locality ?? ""} · ${path}`} actions={<>
        <Pill value={p.published ? "Published" : "Draft"} />
        {p.published
          ? <Link href={path} target="_blank" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">View on website</Link>
          : <Link href={`/admin/preview?to=${encodeURIComponent(path)}`} target="_blank" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">Preview draft</Link>}
      </>} />
      {edited.length > 0 && (
        <section className="mb-5 rounded-brand border border-line bg-white p-4 text-sm">
          <p className="font-medium">Fields you edited: kept as they are on re-import</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {edited.map((f) => (
              <li key={f} className="flex items-center gap-1 rounded-brand border border-line px-2 py-1 text-xs">
                {FIELD_NAMES[f] ?? f}
                <form action={releaseEdits.bind(null, id, [f])}><button type="submit" className="text-accent-ink hover:underline">let re-import update</button></form>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ProjectForm project={p} configs={configs} milestones={milestones} localities={localities} developers={developers} action={editProject.bind(null, id)} onDelete={deleteProject.bind(null, id)} />
    </>
  );
}
