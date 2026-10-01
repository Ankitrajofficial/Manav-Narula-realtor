"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { q, one } from "@/lib/db";
import { audit, slugify } from "@/lib/records";
import { saveUploads } from "@/lib/upload";
import { getPropertyById, getPropertyImages, insertProperty, replacePropertyImages, uniqueSlug, updateProperty, type PropertyInput } from "@/lib/queries/content";

export interface PropertyFormState { errors?: Record<string, string>; message?: string }

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string) => { const v = s(fd, k); if (!v) return null; const x = Number(v.replace(/,/g, "")); return Number.isFinite(x) ? x : null; };
const opt = (v: string) => (v ? v : null);

async function parse(fd: FormData, id: number | null): Promise<{ input?: PropertyInput; errors?: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const title = s(fd, "title");
  if (title.length < 3) errors.title = "Enter a title of at least 3 characters.";
  const type = s(fd, "type"); if (!type) errors.type = "Choose a type.";
  const purpose = s(fd, "purpose") === "Rent" ? "Rent" : "Buy";
  const locality = s(fd, "locality"); if (!locality) errors.locality = "Choose a locality.";
  const price = n(fd, "price"); if (!price || price <= 0) errors.price = "Enter the price in rupees.";
  const area = n(fd, "area"); if (!area || area <= 0) errors.area = "Enter the area.";
  const status = s(fd, "status") || "Ready";
  if (Object.keys(errors).length) return { errors };
  const base = slugify(s(fd, "slug") || title);
  const slug = await uniqueSlug("properties", base, id);
  const nearbyNames = fd.getAll("nearby_name").map(String);
  const nearbyDist = fd.getAll("nearby_distance").map(String);
  const nearby = nearbyNames.map((name, i) => ({ name: name.trim(), distance: (nearbyDist[i] ?? "").trim() })).filter((x) => x.name);
  const trust: string[] = [];
  if (fd.get("trust_verified")) trust.push("verified");
  const rera = opt(s(fd, "rera"));
  if (rera) trust.push("rera");
  if (fd.get("trust_visit")) trust.push("visit");
  return {
    input: {
      slug, title, type, purpose, locality, project_id: n(fd, "project_id"), price: price!, bhk: n(fd, "bhk"), baths: n(fd, "baths"), area, area_unit: s(fd, "area_unit") === "sq.yd" ? "sq.yd" : "sq.ft",
      super_area: n(fd, "super_area"), floor: opt(s(fd, "floor")), facing: opt(s(fd, "facing")), furnishing: opt(s(fd, "furnishing")), parking: opt(s(fd, "parking")), possession: opt(s(fd, "possession")), status,
      description: opt(s(fd, "description")), long_description: opt(s(fd, "long_description")), amenities: fd.getAll("amenities").map(String), trust, rera, nearby,
      featured: !!fd.get("featured"), published: s(fd, "intent") === "publish", meta_title: opt(s(fd, "meta_title")), meta_description: opt(s(fd, "meta_description")),
    },
  };
}

async function images(fd: FormData): Promise<{ urls: string[]; cover: string | null }> {
  const kept = fd.getAll("images_urls").map(String).filter(Boolean);
  const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const added = await saveUploads(files, "properties");
  const urls = [...kept, ...added];
  const cover = String(fd.get("images_cover") ?? "") || urls[0] || null;
  return { urls, cover: cover && urls.includes(cover) ? cover : urls[0] ?? null };
}

export async function createProperty(_prev: PropertyFormState, fd: FormData): Promise<PropertyFormState> {
  const user = await requireUser("admin");
  const { input, errors } = await parse(fd, null);
  if (!input) return { errors, message: "Fix the highlighted fields." };
  let id: number;
  try {
    id = await insertProperty(input);
    const img = await images(fd);
    await replacePropertyImages(id, img.urls, img.cover);
  } catch (e) {
    return { message: e instanceof Error ? e.message : "Could not save." };
  }
  await audit(user.id, "create", "property", id, { title: input.title, published: input.published });
  revalidatePath("/", "layout");
  redirect(`/admin/properties/${id}?toast=${encodeURIComponent(input.published ? "Property published" : "Draft saved")}`);
}

export async function editProperty(id: number, _prev: PropertyFormState, fd: FormData): Promise<PropertyFormState> {
  const user = await requireUser("admin");
  const existing = await getPropertyById(id);
  if (!existing) return { message: "Property no longer exists." };
  const { input, errors } = await parse(fd, id);
  if (!input) return { errors, message: "Fix the highlighted fields." };
  try {
    await updateProperty(id, input);
    const img = await images(fd);
    await replacePropertyImages(id, img.urls, img.cover);
  } catch (e) {
    return { message: e instanceof Error ? e.message : "Could not save." };
  }
  await audit(user.id, "update", "property", id, { title: input.title, published: input.published });
  revalidatePath("/", "layout");
  redirect(`/admin/properties/${id}?toast=${encodeURIComponent(input.published ? "Property published" : "Draft saved")}`);
}

export async function togglePropertyFlag(id: number, flag: "published" | "featured", value: boolean) {
  const user = await requireUser("admin");
  await q(`UPDATE properties SET ${flag} = $1, updated_at = now() WHERE id = $2`, [value, id]);
  await audit(user.id, value ? `${flag}_on` : `${flag}_off`, "property", id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/properties");
}

export async function duplicateProperty(id: number) {
  const user = await requireUser("admin");
  const p = await getPropertyById(id);
  if (!p) redirect("/admin/properties?error=Property+not+found");
  const slug = await uniqueSlug("properties", `${p.slug}-copy`);
  const newId = await insertProperty({
    slug, title: `${p.title} (copy)`, type: p.type, purpose: p.purpose, locality: p.locality, project_id: p.project_id, price: Number(p.price), bhk: p.bhk, baths: p.baths, area: p.area == null ? null : Number(p.area), area_unit: p.area_unit,
    super_area: p.super_area == null ? null : Number(p.super_area), floor: p.floor, facing: p.facing, furnishing: p.furnishing, parking: p.parking, possession: p.possession, status: p.status, description: p.description, long_description: p.long_description,
    amenities: p.amenities ?? [], trust: p.trust ?? [], rera: p.rera, nearby: p.nearby ?? [], featured: false, published: false, meta_title: p.meta_title, meta_description: p.meta_description,
  });
  const imgs = await getPropertyImages(id);
  await replacePropertyImages(newId, imgs.map((i) => i.url), imgs.find((i) => i.is_cover)?.url ?? null);
  await audit(user.id, "duplicate", "property", newId, { from: id });
  redirect(`/admin/properties/${newId}?toast=Duplicated+as+draft`);
}

export async function deleteProperty(id: number) {
  const user = await requireUser("admin");
  const p = await one<{ title: string }>("SELECT title FROM properties WHERE id = $1", [id]);
  await q("DELETE FROM properties WHERE id = $1", [id]);
  await audit(user.id, "delete", "property", id, { title: p?.title });
  revalidatePath("/", "layout");
  redirect("/admin/properties?toast=Property+deleted");
}

