import Link from "next/link";
import { Suspense } from "react";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import SortSelect from "@/components/SortSelect";
import { Breadcrumbs, Section } from "@/components/ui";
import type { Property } from "@/data/properties";
import { getActiveOffers, getProperties } from "@/lib/site-data";
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

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [properties, offers] = await Promise.all([getProperties(), getActiveOffers()]);
  const list = filter(properties, sp);
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
              <Link href={o.href} className="flex items-center gap-4 rounded-brand border border-line bg-white p-3 hover:border-ink">
                {o.image && <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-brand bg-line"><Image src={unsplash(o.image, 400, 300)} alt="" fill sizes="96px" className="object-cover" /></span>}
                <span><span className="text-xs uppercase tracking-wide text-accent-ink">Offer</span><span className="block text-base">{o.title}</span>{o.text && <span className="block text-sm text-muted">{o.text}</span>}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-10 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-3">
          <Suspense><PropertyFilters /></Suspense>
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
      </div>
    </Section>
  );
}
