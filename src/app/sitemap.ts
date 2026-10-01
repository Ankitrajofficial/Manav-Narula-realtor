import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { getArticles, getProjects, getProperties } from "@/lib/site-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [properties, projects, articles] = await Promise.all([getProperties(), getProjects(), getArticles()]);
  const fixed = ["", "/properties", "/projects", "/services", "/about", "/blog", "/contact", "/faq", "/privacy", "/terms", "/disclaimer"];
  return [
    ...fixed.map((p) => ({ url: `${site.url}${p}`, lastModified: now })),
    ...properties.map((p) => ({ url: `${site.url}/properties/${p.slug}`, lastModified: now })),
    ...projects.map((p) => ({ url: `${site.url}/projects/${p.slug}`, lastModified: now })),
    ...articles.map((a) => ({ url: `${site.url}/blog/${a.slug}`, lastModified: new Date(a.date) })),
  ];
}
