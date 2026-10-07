import Link from "next/link";
import { Suspense } from "react";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import SortSelect from "@/components/SortSelect";
import { Breadcrumbs, Section } from "@/components/ui";
import type { Property } from "@/data/properties";
import { getActiveOffers, getDeveloperBySlug, getLocalityFilterOptions, getProjects, getProjectsByDeveloper, getProperties } from "@/lib/site-data";
import ProjectCard from "@/components/ProjectCard";
import { developerCredit, propertyDevelopers } from "@/data/site";
import { previewView } from "@/lib/preview";
import type { Project } from "@/data/projects";
import { AGI } from "@/lib/project-import";
import { unsplash } from "@/lib/format";
import Image from "next/image";

export const revalidate = 60;

export const metadata = { title: "Properties in Jalandhar", description: "Kothis, apartments, plots, commercial spaces and farmhouses for sale and rent across Jalandhar, all with verified titles." };

const PAGE = 9;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const inRange = (v: number, r: string) => { if (!r) return true; const [lo, hi] = r.split("-"); return v >= Number(lo || 0) && (hi === "" || hi === undefined ? true : v <= Number(hi)); };

function filter(properties: Property[], sp: SP): Property[] {
  const purpose = one(sp.purpose) || "Buy";
  const type = one(sp.type), locality = one(sp.locality), bhk = Number(one(sp.bhk)), budget = one(sp.budget), area = one(sp.area), status = one(sp.status), sort = one(sp.sort);
  let list = properties.filter((p) =>
    p.purpose === purpose &&
    (!type || p.type === type) &&
    (!locality || p.locality === locality) &&
    (!bhk || (p.bhk ?? 0) >= bhk && (bhk < 5 ? (p.bhk ?? 0) === bhk : true)) &&
    inRange(p.price, budget) &&
    inRange(p.areaUnit === "sq.yd" ? p.area * 9 : p.area, area) &&
    (!status || p.status === status),
  );
  if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  else if (sort === "area-desc") list = [...list].sort((a, b) => (b.areaUnit === "sq.yd" ? b.area * 9 : b.area) - (a.areaUnit === "sq.yd" ? a.area * 9 : a.area));
  else list = [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  return list;
}

/** A developer's projects, each with links to its unit types (2 BHK, 3 BHK, ...). */
function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => (
        <li key={p.slug} className="flex flex-col gap-3">
          <ProjectCard p={p} />
          {(p.units ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {p.units!.map((u) => <Link key={u.slug} href={`/projects/${p.slug}/${u.slug}`} className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">{u.label}</Link>)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** All | AGI Infra | Mexmon Group: the developer tabs of the Properties page (also in the header's Properties menu). */
function DeveloperTabs({ current }: { current: string }) {
  const tabs = [{ slug: "", label: "All" }, ...propertyDevelopers];
  return (
    <nav aria-label="Show properties by developer" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <Link key={t.slug} href={t.slug ? `/properties?developer=${t.slug}` : "/properties"} aria-current={current === t.slug ? "page" : undefined}
          className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm ${current === t.slug ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const preview = await previewView();
  const devSlug = one(sp.developer);
  const developer = devSlug ? propertyDevelopers.find((d) => d.slug === devSlug) : undefined;

  // A developer's tab lists that developer's projects only.
  if (developer) {
    const d = await getDeveloperBySlug(developer.slug);
    const projects = d ? await getProjectsByDeveloper(d.id, preview) : [];
    return (
      <Section>
        <Breadcrumbs items={[{ label: "Properties", href: "/properties" }, { label: developer.label }]} />
        <h1 className="mt-6 text-4xl md:text-5xl">{developer.label} properties</h1>
        <p className="mt-3 max-w-2xl text-muted">Projects by {d?.name ?? developer.label} in Jalandhar and Ludhiana, sold through us as sales agents. {developerCredit}</p>
        <DeveloperTabs current={developer.slug} />
        <p className="mb-6 mt-6 text-sm text-muted"><span className="tabular text-ink">{projects.length}</span> {projects.length === 1 ? "project" : "projects"}</p>
        {projects.length ? <ProjectGrid projects={projects} /> : (
          <div className="rounded-brand border border-line bg-white p-8">
            <p className="text-lg">{developer.label} projects are coming soon.</p>
            <p className="mt-2 text-sm text-muted">Call us for plans, prices and availability in the meantime.</p>
            <Link href="/contact" className="mt-4 inline-block rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white">Ask about {developer.label}</Link>
          </div>
        )}
      </Section>
    );
  }

  const [properties, offers, localityOptions, allProjects] = await Promise.all([getProperties(), getActiveOffers(), getLocalityFilterOptions(), getProjects(preview)]);
  // "All" also lists the developers' projects (AGI Infra, Mexmon Group, ...), above the individual listings.
  const projects = allProjects.filter((p) => propertyDevelopers.some((d) => d.slug === p.developerSlug));
  // An old listing whose project is shown above (e.g. the AGI listings that became projects) is not listed twice.
  const shown = new Set(projects.map((p) => p.slug));
  const replaced = new Set(AGI.filter((a) => shown.has(a.slug)).map((a) => a.from));
  const listings = properties.filter((p) => !replaced.has(p.slug));
  const list = filter(listings, sp);
  // With developer projects on the page and no other listings at all, the empty listings block is left out.
  const showListings = listings.length > 0 || projects.length === 0;
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const slice = list.slice((page - 1) * PAGE, page * PAGE);
  const locality = one(sp.locality);
  const pageHref = (n: number) => { const q = new URLSearchParams(); for (const [k, v] of Object.entries(sp)) if (v && k !== "page") q.set(k, one(v)); q.set("page", String(n)); return `/properties?${q}`; };

  return (
    <Section>
      <Breadcrumbs items={[{ label: "Properties" }]} />
      <h1 className="mt-6 text-4xl md:text-5xl">{locality ? `Properties in ${locality}` : "Properties in Jalandhar"}</h1>
      {offers.length > 0 && (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {offers.slice(0, 2).map((o) => (
            <li key={o.id}>
              <Link href={o.href} className="flex items-center gap-4 rounded-brand border border-[#c9c9c6] bg-white p-3 transition-colors hover:border-ink">
                {o.image && <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-brand bg-line"><Image src={unsplash(o.image, 400, 300)} alt="" fill sizes="96px" className="object-cover" /></span>}
                <span><span className="text-xs uppercase tracking-wide text-accent-ink">Offer</span><span className="block text-base">{o.title}</span>{o.text && <span className="block text-sm text-muted">{o.text}</span>}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <DeveloperTabs current="" />
      {projects.length > 0 && page === 1 && (
        <section aria-labelledby="dev-projects" className="mt-8">
          <h2 id="dev-projects" className="text-2xl">Developer projects</h2>
          <p className="mb-4 mt-1 text-sm text-muted">{developerCredit}</p>
          <ProjectGrid projects={projects} />
        </section>
      )}
      {showListings && projects.length > 0 && page === 1 && <h2 className="mt-12 text-2xl">Resale and rental listings</h2>}
      {showListings && <div className={`${projects.length > 0 && page === 1 ? "mt-6" : "mt-10"} grid gap-10 md:grid-cols-12`}>
        <div className="md:col-span-3">
          <Suspense><PropertyFilters localities={localityOptions} /></Suspense>
        </div>
        <div className="md:col-span-9">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-muted"><span className="tabular text-ink">{list.length}</span> {list.length === 1 ? "property" : "properties"}</p>
            <Suspense><SortSelect /></Suspense>
          </div>
          {slice.length === 0 ? (
            <div className="rounded-brand border border-line bg-white p-8">
              <p className="text-lg">Nothing matches these filters yet.</p>
              <p className="mt-2 text-sm text-muted">Tell us what you need and we will source it. Most requirements are matched within a week.</p>
              <Link href="/contact" className="mt-4 inline-block rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white">Send a requirement</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {slice.map((p) => <PropertyCard key={p.slug} p={p} fixed={false} />)}
            </div>
          )}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2 text-sm">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={pageHref(n)} aria-current={n === page ? "page" : undefined} className={`flex h-9 w-9 items-center justify-center rounded-brand border ${n === page ? "border-accent bg-accent text-white" : "border-line hover:border-ink"}`}>{n}</Link>
              ))}
            </nav>
          )}
        </div>
      </div>}
    </Section>
  );
}
