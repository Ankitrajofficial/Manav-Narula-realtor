import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { getArticles, getDevelopersWithProjects, getProjects, getProperties } from "@/lib/site-data";

// Rebuilt at most hourly, so properties, projects and posts added in the console reach Google without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [properties, projects, articles, developers] = await Promise.all([getProperties(), getProjects(), getArticles(), getDevelopersWithProjects()]);
  const fixed = ["", "/properties", "/services", "/home-loans", "/about", "/blog", "/contact", "/faq", "/privacy", "/terms", "/disclaimer"];
  return [
    ...fixed.map((p) => ({ url: `${site.url}${p}`, lastModified: now })),
    ...properties.map((p) => ({ url: `${site.url}/properties/${p.slug}`, lastModified: now })),
    ...projects.map((p) => ({ url: `${site.url}/projects/${p.slug}`, lastModified: now })),
    ...projects.flatMap((p) => (p.units ?? []).map((u) => ({ url: `${site.url}/projects/${p.slug}/${u.slug}`, lastModified: now }))),
    ...developers.map((d) => ({ url: `${site.url}/developers/${d.slug}`, lastModified: now })),
    ...articles.map((a) => ({ url: `${site.url}/blog/${a.slug}`, lastModified: new Date(a.date) })),
  ];
}
