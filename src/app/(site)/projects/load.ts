import "server-only";
import { getProjectBySlug } from "@/lib/site-data";
import { previewView } from "@/lib/preview";

/** A published project, or a draft while an admin has preview on. Short slugs (e.g. mexmon-dreams) redirect to the full one. */
export async function loadProject(slug: string) {
  const view = await previewView();
  const p = await getProjectBySlug(slug, view);
  if (p) return p;
  if (!slug.endsWith("-jalandhar") && (await getProjectBySlug(`${slug}-jalandhar`, view))) return `${slug}-jalandhar`;
  return null;
}
