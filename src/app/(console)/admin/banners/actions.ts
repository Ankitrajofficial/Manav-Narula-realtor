"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { flash } from "@/lib/flash";
import { one, q } from "@/lib/db";
import { audit } from "@/lib/records";
import { saveUpload } from "@/lib/upload";
import { reorderBanners, saveBanner, type BannerInput } from "@/lib/queries/content";

export interface BannerFormState { errors?: Record<string, string>; message?: string }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (v: string) => (v ? v : null);
const isDate = (v: string) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v);

async function parse(fd: FormData): Promise<{ input?: BannerInput; errors?: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const headline = s(fd, "headline"); if (headline.length < 3) errors.headline = "Enter a headline.";
  const group = s(fd, "group") === "offer" ? "offer" : "carousel";
  const start = s(fd, "start_date"), end = s(fd, "end_date");
  if (!isDate(start) || !isDate(end)) errors.start_date = "Use YYYY-MM-DD.";
  if (start && end && end < start) errors.end_date = "End date is before the start date.";
  const ctaHref = s(fd, "cta_href");
  if (ctaHref && !/^(\/|https?:\/\/)/.test(ctaHref)) errors.cta_href = "Link must start with / or https://";
  let image: string | null = null;
  try {
    const f = fd.get("image");
    image = f instanceof File && f.size > 0 ? await saveUpload(f, "banners") : opt(s(fd, "image_current"));
  } catch (e) { errors.image = e instanceof Error ? e.message : "Upload failed."; }
  if (!image) errors.image = errors.image ?? "Upload a banner image.";
  if (Object.keys(errors).length) return { errors };
  return { input: { group, image, headline, line: opt(s(fd, "line")), cta_label: opt(s(fd, "cta_label")), cta_href: opt(ctaHref), active: !!fd.get("active"), start_date: opt(start), end_date: opt(end) } };
}

export async function upsertBanner(id: number | null, _p: BannerFormState, fd: FormData): Promise<BannerFormState> {
  const user = await requireUser("admin");
  const { input, errors } = await parse(fd);
  if (!input) return { errors, message: "Fix the highlighted fields." };
  const newId = await saveBanner(id, input);
  await audit(user.id, id ? "update" : "create", "banner", newId, { group: input.group, headline: input.headline });
  revalidatePath("/", "layout");
  redirect(`/admin/banners?toast=${encodeURIComponent("Banner saved")}`);
}

export async function toggleBannerActive(id: number, value: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE banners SET active = $1, updated_at = now() WHERE id = $2", [value, id]);
  await audit(user.id, value ? "activate" : "deactivate", "banner", id);
  await flash(value ? "Banner shown on the website" : "Banner hidden from the website");
  revalidatePath("/", "layout");
  revalidatePath("/admin/banners");
}

export async function moveBanner(id: number, dir: -1 | 1) {
  const user = await requireUser("admin");
  const b = await one<{ group: string }>('SELECT "group" FROM banners WHERE id = $1', [id]);
  if (!b) return;
  const ids = (await q<{ id: number }>('SELECT id FROM banners WHERE "group" = $1 ORDER BY sort_order, id', [b.group])).map((r) => r.id);
  const i = ids.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await reorderBanners(b.group, ids);
  await audit(user.id, "reorder", "banner", id, { order: ids });
  await flash("Banner order saved");
  revalidatePath("/", "layout");
  revalidatePath("/admin/banners");
}

export async function reorderBannerGroup(group: string, ids: number[]) {
  const user = await requireUser("admin");
  await reorderBanners(group === "offer" ? "offer" : "carousel", ids.map(Number).filter(Number.isInteger));
  await audit(user.id, "reorder", "banner", null, { group, order: ids });
  await flash("Banner order saved");
  revalidatePath("/", "layout");
  revalidatePath("/admin/banners");
}

export async function deleteBanner(id: number) {
  const user = await requireUser("admin");
  await q("DELETE FROM banners WHERE id = $1", [id]);
  await audit(user.id, "delete", "banner", id);
  revalidatePath("/", "layout");
  redirect("/admin/banners?toast=Banner+deleted");
}
