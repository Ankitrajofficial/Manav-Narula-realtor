import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { Breadcrumbs, Section } from "@/components/ui";
import type { ProjectStatus } from "@/data/projects";
import { getProjects } from "@/lib/site-data";

export const revalidate = 60;

export const metadata = { title: "Projects in Jalandhar", description: "Societies and plotted colonies in Jalandhar we are authorised to sell, with configurations and construction progress." };

const statuses: ("All" | ProjectStatus)[] = ["All", "Upcoming", "Under construction", "Ready"];

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "All" } = await searchParams;
  const projects = await getProjects();
  const list = status === "All" ? projects : projects.filter((p) => p.status === status);
  return (
    <Section>
      <Breadcrumbs items={[{ label: "Projects" }]} />
      <h1 className="mt-6 text-4xl md:text-5xl">Projects</h1>
      <p className="mt-3 max-w-2xl text-muted">Developer projects we are authorised to sell. We have checked the land title of every one ourselves.</p>
      <div className="mt-8 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link key={s} href={s === "All" ? "/projects" : `/projects?status=${encodeURIComponent(s)}`} aria-current={status === s ? "page" : undefined} className={`rounded-brand border px-4 py-2 text-sm ${status === s ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-ink"}`}>{s}</Link>
        ))}
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {list.map((p) => <ProjectCard key={p.slug} p={p} showProgress />)}
      </div>
      {list.length === 0 && <p className="mt-8 text-muted">No projects in this stage right now.</p>}
    </Section>
  );
}
