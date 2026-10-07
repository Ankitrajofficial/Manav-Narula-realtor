import { permanentRedirect } from "next/navigation";
import { propertyDevelopers } from "@/data/site";

/**
 * The projects list now lives under Properties (All | AGI Infra | Mexmon Group). Old links keep working: a developer
 * filter goes to that developer's tab. Project pages (/projects/<slug>) are unchanged.
 */
export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ developer?: string }> }) {
  const want = ((await searchParams).developer ?? "").toLowerCase();
  const dev = propertyDevelopers.find((d) => want && (d.slug === want || d.label.toLowerCase() === want || want.startsWith(d.label.toLowerCase())));
  permanentRedirect(dev ? `/properties?developer=${dev.slug}` : "/properties");
}
