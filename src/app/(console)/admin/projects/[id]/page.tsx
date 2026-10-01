import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import { requireUser } from "@/lib/auth";
import { listLocalities } from "@/lib/queries/common";
import { getProjectById, getProjectConfigs, getProjectMilestones } from "@/lib/queries/content";
import ProjectForm from "../ProjectForm";
import { deleteProject, editProject } from "../actions";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [p, configs, milestones, localities] = await Promise.all([getProjectById(id), getProjectConfigs(id), getProjectMilestones(id), listLocalities()]);
  if (!p) notFound();
  return (
    <>
      <PageHeader title={p.name} description={`${p.locality ?? ""} · ${p.progress ?? 0}% complete · /projects/${p.slug}`} actions={<>
        <Pill value={p.published ? "Published" : "Draft"} />
        {p.published && <Link href={`/projects/${p.slug}`} target="_blank" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">View on website</Link>}
      </>} />
      <ProjectForm project={p} configs={configs} milestones={milestones} localities={localities} action={editProject.bind(null, id)} onDelete={deleteProject.bind(null, id)} />
    </>
  );
}
