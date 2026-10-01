import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import { requireUser } from "@/lib/auth";
import { getSetting, listLocalities, projectOptions } from "@/lib/queries/common";
import { getPropertyById, getPropertyImages } from "@/lib/queries/content";
import PropertyForm from "../PropertyForm";
import { deleteProperty, duplicateProperty, editProperty } from "../actions";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [p, imgs, localities, types, projects] = await Promise.all([getPropertyById(id), getPropertyImages(id), listLocalities(), getSetting<string[]>("property_types", ["Kothi", "Apartment", "Plot", "Commercial", "Farmhouse"]), projectOptions()]);
  if (!p) notFound();
  const ordered = [...imgs].sort((a, b) => a.sort_order - b.sort_order);
  return (
    <>
      <PageHeader title={p.title} description={`${p.type} · ${p.locality ?? ""} · /properties/${p.slug}`} actions={<>
        <Pill value={p.published ? "Published" : "Draft"} />
        {p.published && <Link href={`/properties/${p.slug}`} target="_blank" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">View on website</Link>}
      </>} />
      <PropertyForm property={p} images={ordered.map((i) => i.url)} cover={imgs.find((i) => i.is_cover)?.url ?? null} localities={localities} types={types} projects={projects} action={editProperty.bind(null, id)} onDuplicate={duplicateProperty.bind(null, id)} onDelete={deleteProperty.bind(null, id)} />
    </>
  );
}
