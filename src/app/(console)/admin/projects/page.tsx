import { redirect } from "next/navigation";

/** Developer projects are managed under Properties, as on the website. Old links keep working. */
export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  redirect(sp.developer ? `/admin/properties?dev=${encodeURIComponent(sp.developer)}` : "/admin/properties");
}
