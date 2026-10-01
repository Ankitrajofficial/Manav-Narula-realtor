"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { audit } from "@/lib/records";
import { saveUpload } from "@/lib/upload";
import { saveOffer, type OfferInput } from "@/lib/queries/content";

export interface OfferFormState { errors?: Record<string, string>; message?: string }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (v: string) => (v ? v : null);

export async function upsertOffer(id: number | null, _p: OfferFormState, fd: FormData): Promise<OfferFormState> {
  const user = await requireUser("admin");
  const errors: Record<string, string> = {};
  const title = s(fd, "title"); if (title.length < 3) errors.title = "Enter a title.";
  const linkType = s(fd, "link_type");
  const link = s(fd, "link");
  const property_id = linkType === "property" ? Number(s(fd, "property_id")) || null : null;
  const project_id = linkType === "project" ? Number(s(fd, "project_id")) || null : null;
  if (linkType === "url" && link && !/^(\/|https?:\/\/)/.test(link)) errors.link = "Link must start with / or https://";
  if (linkType === "property" && !property_id) errors.property_id = "Choose a property.";
  if (linkType === "project" && !project_id) errors.project_id = "Choose a project.";
  const start = s(fd, "start_date"), end = s(fd, "end_date");
  if (start && end && end < start) errors.end_date = "End date is before the start date.";
  let image: string | null = null;
  try { const f = fd.get("image"); image = f instanceof File && f.size > 0 ? await saveUpload(f, "offers") : opt(s(fd, "image_current")); } catch (e) { errors.image = e instanceof Error ? e.message : "Upload failed."; }
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const input: OfferInput = { title, image, text: opt(s(fd, "text")), link: linkType === "url" ? opt(link) : null, property_id, project_id, active: !!fd.get("active"), start_date: opt(start), end_date: opt(end) };
  const newId = await saveOffer(id, input);
  await audit(user.id, id ? "update" : "create", "offer", newId, { title });
  revalidatePath("/", "layout");
  redirect("/admin/offers?toast=Offer+saved");
}

export async function toggleOfferActive(id: number, value: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE offers SET active = $1, updated_at = now() WHERE id = $2", [value, id]);
  await audit(user.id, value ? "activate" : "deactivate", "offer", id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/offers");
}

export async function deleteOffer(id: number) {
  const user = await requireUser("admin");
  await q("DELETE FROM offers WHERE id = $1", [id]);
  await audit(user.id, "delete", "offer", id);
  revalidatePath("/", "layout");
  redirect("/admin/offers?toast=Offer+deleted");
}
