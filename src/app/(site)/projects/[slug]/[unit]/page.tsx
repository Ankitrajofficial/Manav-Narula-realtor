import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getBusiness } from "@/lib/site-data";
import ProjectView, { projectMetadata } from "../../ProjectView";
import { loadProject } from "../../load";

export const revalidate = 60;

/** SEO page of one unit type, e.g. /projects/mexmon-dreams-jalandhar/2-bhk-flats-jalandhar: the project's data with that unit first. */
async function load(slug: string, unitSlug: string) {
  const p = await loadProject(slug);
  if (typeof p === "string") return { redirect: `/projects/${p}/${unitSlug}` };
  const unit = p?.units?.find((u) => u.slug === unitSlug);
  return p && unit ? { p, unit } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; unit: string }> }): Promise<Metadata> {
  const { slug, unit } = await params;
  const r = await load(slug, unit);
  return r && "p" in r && r.p ? projectMetadata(r.p, r.unit) : {};
}

export default async function UnitPage({ params }: { params: Promise<{ slug: string; unit: string }> }) {
  const { slug, unit } = await params;
  const [r, business] = await Promise.all([load(slug, unit), getBusiness()]);
  if (r && "redirect" in r) permanentRedirect(r.redirect!);
  if (!r || !r.p) notFound();
  return <ProjectView p={r.p} business={business} unit={r.unit} />;
}
