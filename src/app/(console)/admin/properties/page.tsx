import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import DataTable, { queryString } from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import Pill from "@/components/console/Pill";
import ToggleForm from "@/components/console/ToggleForm";
import ContentThumb from "@/components/console/ContentThumb";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { PROPERTY_STATUSES } from "@/lib/console";
import { formatPrice, formatShortDate } from "@/lib/format";
import { getSetting, listLocalities } from "@/lib/queries/common";
import { listProperties, type PropertyRow } from "@/lib/queries/content";
import { togglePropertyFlag } from "./actions";
import { q } from "@/lib/db";
import { AGI } from "@/lib/project-import";
import { toggleDeveloperImages, toggleProjectFeatured, toggleProjectPublished } from "../projects/actions";
import ReimportPanel from "../projects/ReimportPanel";

interface DevProjectRow {
  id: number; slug: string; name: string; developer: string | null; developer_id: number | null; locality: string | null; status: string; published: boolean; featured: boolean;
  image: string | null; rera: string | null; show_developer_images: boolean; media: { url: string; kind: string; developer?: boolean }[] | null; units: { label: string; media?: { developer?: boolean }[] }[] | null;
}

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  // Developer projects (Mexmon Group, AGI Infra, ...) are shown on the website's Properties page too; they are edited under Projects.
  const allProjects = await q<DevProjectRow>("SELECT id, slug, name, developer, developer_id, locality, status, published, featured, image, rera, show_developer_images, media, units FROM projects ORDER BY developer, name");
  const developers = [...new Map(allProjects.filter((p) => p.developer_id).map((p) => [p.developer_id, p.developer])).entries()];
  const dev = Number(sp.dev) || null;
  const devProjects = dev ? allProjects.filter((p) => p.developer_id === dev) : allProjects;
  const hasDevImages = (p: DevProjectRow) => [...(p.media ?? []), ...(p.units ?? []).flatMap((u) => u.media ?? [])].some((m) => m.developer);
  // The AGI listings that became developer projects belong to those projects: they are listed with them, not as individual listings.
  const matched = AGI.filter((a) => allProjects.some((p) => p.slug === a.slug));
  const oldListings = new Map((await q<{ id: number; slug: string }>("SELECT id, slug FROM properties WHERE slug = ANY($1::text[])", [matched.map((a) => a.from)])).map((r) => [r.slug, r.id]));
  const oldListingOf = (projectSlug: string) => { const from = matched.find((a) => a.slug === projectSlug)?.from; return from ? oldListings.get(from) : undefined; };
  const [{ rows, total, page, size, sort }, localities, types] = await Promise.all([listProperties(sp, matched.map((a) => a.from)), listLocalities(), getSetting<string[]>("property_types", ["Kothi", "Apartment", "Plot", "Commercial", "Farmhouse"])]);
  const opts = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x }));
  const thumb = (p: DevProjectRow) => p.image ?? p.media?.find((m) => m.kind === "elevation")?.url ?? null;
  return (
    <>
      <PageHeader title="Properties" description="Everything shown under Properties on the website: developer projects and individual listings. Only published ones are visible to visitors." actions={<>
        <Link href="/admin/projects/new" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-4 py-2 text-sm hover:border-ink"><Icon name="plus" size={16} />Add developer project</Link>
        <Link href="/admin/properties/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />Add listing</Link>
      </>} />
      <section className="mb-8 rounded-brand border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-base">Developer projects <span className="tabular text-muted">({devProjects.length})</span></h2>
            <p className="text-xs text-muted">Shown on the website under Properties (All, AGI Infra, Mexmon Group). Edit opens the full details, images and unit types. A project needs its RERA number before it can be published.</p>
          </div>
          <nav aria-label="Filter by developer" className="flex flex-wrap gap-1 text-sm">
            {[[null, "All"] as const, ...developers].map(([id, name]) => (
              <Link key={id ?? "all"} href={id ? `/admin/properties?dev=${id}` : "/admin/properties"} aria-current={dev === id ? "page" : undefined}
                className={`rounded-brand border px-3 py-1.5 ${dev === id ? "border-accent bg-accent/10 text-accent-ink" : "border-line hover:border-ink"}`}>{name}</Link>
            ))}
          </nav>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted"><tr className="border-b border-line">
              <th className="w-16 px-4 py-2.5 font-medium" /><th className="px-2 py-2.5 font-medium">Project</th><th className="px-2 py-2.5 font-medium">Developer</th><th className="px-2 py-2.5 font-medium">Unit types</th>
              <th className="px-2 py-2.5 font-medium">Locality</th><th className="px-2 py-2.5 font-medium">RERA</th><th className="px-2 py-2.5 font-medium">Status</th>
              <th className="px-2 py-2.5 font-medium">Developer images</th><th className="px-2 py-2.5 font-medium">Published</th><th className="px-2 py-2.5 font-medium">Featured</th><th className="px-4 py-2.5" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {devProjects.map((p) => (
                <tr key={p.id} className="hover:bg-bg">
                  <td className="px-4 py-2"><ContentThumb src={thumb(p)} /></td>
                  <td className="px-2 py-2"><Link href={`/admin/projects/${p.id}`} className="font-medium hover:text-accent-ink">{p.name}</Link></td>
                  <td className="px-2 py-2">{p.developer ?? "—"}</td>
                  <td className="px-2 py-2 text-muted">{(p.units ?? []).map((u) => u.label).join(", ") || "—"}</td>
                  <td className="px-2 py-2">{p.locality ?? "—"}</td>
                  <td className="px-2 py-2">{p.rera ? <span className="tabular text-xs">{p.rera}</span> : <span className="text-xs text-red-700">Missing</span>}</td>
                  <td className="px-2 py-2"><Pill value={p.status} /></td>
                  <td className="px-2 py-2">{hasDevImages(p)
                    ? <ToggleForm on={p.show_developer_images} label={p.show_developer_images ? "Hide developer images" : "Show developer images"} action={toggleDeveloperImages.bind(null, p.id, !p.show_developer_images)} />
                    : <span className="text-xs text-muted">—</span>}</td>
                  <td className="px-2 py-2"><ToggleForm on={p.published} label={p.published ? "Unpublish" : "Publish"} action={toggleProjectPublished.bind(null, p.id, !p.published)} /></td>
                  <td className="px-2 py-2"><ToggleForm on={p.featured} label={p.featured ? "Remove from featured" : "Mark featured"} action={toggleProjectFeatured.bind(null, p.id, !p.featured)} /></td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <Link href={`/admin/projects/${p.id}`} className="text-accent-ink hover:underline">Edit</Link>
                    {p.published
                      ? <> · <Link href={`/projects/${p.slug}`} target="_blank" className="text-muted hover:text-ink">View</Link></>
                      : <> · <Link href={`/admin/preview?to=${encodeURIComponent(`/projects/${p.slug}`)}`} target="_blank" className="text-muted hover:text-ink">Preview</Link></>}
                    {oldListingOf(p.slug) && <span className="mt-0.5 block text-xs"><Link href={`/admin/properties/${oldListingOf(p.slug)}`} className="text-muted underline hover:text-ink" title="The listing this project was created from; the website sends its visitors to the project page">Old listing</Link></span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <h2 className="text-base">Individual listings</h2>
      <p className="mb-3 text-xs text-muted">Single properties you add yourself (a kothi, flat, plot or shop for sale or rent). Developer projects are listed above.</p>
      <FilterBar searchPlaceholder="Search title or locality" filters={[
        { key: "type", label: "Type", options: opts(types) },
        { key: "purpose", label: "Listing", options: opts(["Buy", "Rent"]) },
        { key: "locality", label: "Locality", options: opts(localities) },
        { key: "status", label: "Status", options: opts(PROPERTY_STATUSES) },
        { key: "published", label: "Published", options: [{ value: "1", label: "Published" }, { value: "0", label: "Draft" }] },
      ]} />
      <DataTable<PropertyRow>
        rows={rows} total={total} page={page} pageSize={size} sp={sp} basePath="/admin/properties" sortKey={sort.key} sortDir={sort.dir}
        exportHref={`/admin/properties/export?${queryString(sp)}`}
        rowId={(r) => r.id}
        empty={{ text: Object.keys(sp).length ? "No individual listings match." : "No individual listings yet. Add a kothi, flat, plot or shop for sale or rent; developer projects are listed above.", action: { label: "Add property", href: "/admin/properties/new" } }}
        columns={[
          { key: "cover", label: "", className: "w-16", render: (r) => <ContentThumb src={r.cover} /> },
          { key: "title", label: "Title", sortable: true, render: (r) => (
            <Link href={`/admin/properties/${r.id}`} className="font-medium hover:text-accent-ink">{r.title}</Link>
          ) },
          { key: "type", label: "Type", sortable: true },
          { key: "purpose", label: "Listing", render: (r) => r.purpose === "Rent" ? "Rent" : "Buy" },
          { key: "locality", label: "Locality", sortable: true },
          { key: "price", label: "Price", sortable: true, className: "tabular", render: (r) => formatPrice(Number(r.price), r.purpose === "Rent" ? "Rent" : "Buy") },
          { key: "status", label: "Status", sortable: true, render: (r) => <Pill value={r.status} /> },
          { key: "published", label: "Published", render: (r) => <ToggleForm on={r.published} label={r.published ? "Unpublish" : "Publish"} action={togglePropertyFlag.bind(null, r.id, "published", !r.published)} /> },
          { key: "featured", label: "Featured", render: (r) => <ToggleForm on={r.featured} label={r.featured ? "Remove from featured" : "Mark featured"} action={togglePropertyFlag.bind(null, r.id, "featured", !r.featured)} /> },
          { key: "updated_at", label: "Updated", sortable: true, className: "whitespace-nowrap text-muted", render: (r) => formatShortDate(r.updated_at) },
        ]}
      />

      <div className="mt-8"><ReimportPanel /></div>
    </>
  );
}
