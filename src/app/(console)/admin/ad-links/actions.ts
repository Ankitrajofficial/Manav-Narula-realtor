"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { flash } from "@/lib/flash";
import { q } from "@/lib/db";
import { audit } from "@/lib/records";
import { LINK_CHANNELS, linkSlug, saveLeadLink, slugTaken } from "@/lib/queries/lead-links";

export interface AdLinkFormState { errors?: Record<string, string>; message?: string }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").replace(/\r\n?/g, "\n").trim();
const opt = (v: string) => (v ? v : null);

export async function upsertAdLink(id: number | null, _p: AdLinkFormState, fd: FormData): Promise<AdLinkFormState> {
  const user = await requireUser("admin");
  const errors: Record<string, string> = {};
  const name = s(fd, "name").slice(0, 80); if (name.length < 2) errors.name = "Give the link a name, e.g. Mexmon Dreams, October ad.";
  const channel = s(fd, "channel"); if (!(LINK_CHANNELS as readonly string[]).includes(channel)) errors.channel = "Choose where the link is used.";
  const slug = linkSlug(s(fd, "slug") || name);
  if (slug.length < 2) errors.slug = "Use letters and numbers, e.g. fb-mexmon-dreams.";
  else if (await slugTaken(slug, id)) errors.slug = "Another link already uses this address.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const newId = await saveLeadLink(id, { slug, name, channel, project_id: Number(s(fd, "project_id")) || null, headline: opt(s(fd, "headline").slice(0, 120)), intro: opt(s(fd, "intro").slice(0, 300)), active: fd.get("active") === "on" }, user.id);
  await audit(user.id, id ? "update" : "create", "lead_link", newId, { name, slug });
  revalidatePath("/admin/ad-links");
  redirect("/admin/ad-links?toast=Ad+link+saved");
}

export async function toggleAdLink(id: number, value: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE lead_links SET active = $1, updated_at = now() WHERE id = $2", [value, id]);
  await audit(user.id, value ? "enable" : "disable", "lead_link", id);
  await flash(value ? "Link is on: it takes enquiries" : "Link is off: visitors go to the website instead");
  revalidatePath("/admin/ad-links");
}

export async function deleteAdLink(id: number) {
  const user = await requireUser("admin");
  // Leads from the link stay; they keep their Facebook / Instagram source.
  await q("DELETE FROM lead_links WHERE id = $1", [id]);
  await audit(user.id, "delete", "lead_link", id);
  redirect("/admin/ad-links?toast=Ad+link+deleted");
}
