import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getBusiness } from "@/lib/site-data";
import { loadProject } from "../load";
import ProjectView, { projectMetadata } from "../ProjectView";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await loadProject((await params).slug);
  return p && typeof p !== "string" ? projectMetadata(p) : {};
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [p, business] = await Promise.all([loadProject((await params).slug), getBusiness()]);
  if (typeof p === "string") permanentRedirect(`/projects/${p}`);
  if (!p) notFound();
  return <ProjectView p={p} business={business} />;
}
