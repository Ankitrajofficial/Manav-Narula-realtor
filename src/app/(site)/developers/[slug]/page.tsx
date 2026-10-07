import Link from "next/link";
import { notFound } from "next/navigation";
import { previewView } from "@/lib/preview";
import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import { Breadcrumbs, Section } from "@/components/ui";
import { developerCredit, site } from "@/data/site";
import { getDeveloperBySlug, getProjectsByDeveloper } from "@/lib/site-data";

export const revalidate = 60;

async function load(slug: string) {
  const view = await previewView();
  const d = await getDeveloperBySlug(slug);
  if (!d) return null;
  const projects = await getProjectsByDeveloper(d.id, view);
  return projects.length ? { d, projects } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await load((await params).slug);
  if (!r) return {};
  const title = `${r.d.name} projects in Jalandhar | ${site.name}`;
  const description = `${r.d.name} projects sold through ${site.name}, sales agents in Jalandhar: ${r.projects.map((p) => p.name).join(", ")}. Plans, availability and site visits.`;
  return { title: { absolute: title }, description, alternates: { canonical: `/developers/${r.d.slug}` }, openGraph: { title, description, type: "website" } };
}

/** All projects of one developer that we sell as sales agents, each with its unit types underneath. Never the developer's logo or contacts. */
export default async function DeveloperPage({ params }: { params: Promise<{ slug: string }> }) {
  const r = await load((await params).slug);
  if (!r) notFound();
  const { d, projects } = r;
  return (
    <Section>
      <Breadcrumbs items={[{ label: "Properties", href: "/properties" }, { label: d.name }]} />
      <h1 className="mt-6 text-4xl md:text-5xl">{d.name}</h1>
      {d.description && <p className="mt-3 max-w-2xl text-muted">{d.description}</p>}
      <p className="mt-3 max-w-2xl text-sm text-muted">{d.name} is the developer and {site.name} is a sales agent for these projects. {developerCredit} Call us for plans, prices and a site visit.</p>
      <p className="mt-6 text-sm text-muted"><span className="tabular text-ink">{projects.length}</span> {projects.length === 1 ? "project" : "projects"}</p>
      <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.slug} className="flex flex-col gap-3">
            <ProjectCard p={p} />
            {(p.units ?? []).length > 0 && (
              <div className="rounded-brand border border-line bg-white p-3">
                <p className="text-xs font-medium text-muted">Unit types at {p.name}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {p.units!.map((u) => (
                    <li key={u.slug}><Link href={`/projects/${p.slug}/${u.slug}`} className="inline-block rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">{u.label}</Link></li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm"><Link href="/properties" className="text-accent-ink hover:underline">← All properties</Link></p>
    </Section>
  );
}
