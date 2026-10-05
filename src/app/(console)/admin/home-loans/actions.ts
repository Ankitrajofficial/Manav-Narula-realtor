"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { flash } from "@/lib/flash";
import { one, q } from "@/lib/db";
import { audit } from "@/lib/records";
import { saveUpload } from "@/lib/upload";
import { youtubeId } from "@/lib/youtube";

export interface ItemFormState { errors?: Record<string, string>; message?: string; ok?: number }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const refresh = () => { revalidatePath("/home-loans"); revalidatePath("/admin/home-loans"); };

export async function saveBank(id: number | null, _p: ItemFormState, fd: FormData): Promise<ItemFormState> {
  const user = await requireUser("admin");
  const errors: Record<string, string> = {};
  const name = s(fd, "name"); if (name.length < 2) errors.name = "Enter the bank's name.";
  const tagline = s(fd, "tagline").slice(0, 80) || null;
  let logo: string | null = fd.get("remove_logo") ? null : s(fd, "logo_current") || null;
  try { const f = fd.get("logo"); if (f instanceof File && f.size > 0) logo = await saveUpload(f, "banks"); } catch (e) { errors.logo = e instanceof Error ? e.message : "Upload failed."; }
  if (logo && !/\.(png|jpe?g|webp)$/i.test(logo)) errors.logo = "Use a PNG, JPG or WebP logo.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const active = !!fd.get("is_active");
  let bankId = id;
  if (id) {
    await q("UPDATE partner_banks SET name=$1, tagline=$2, logo_url=$3, is_active=$4, updated_at=now() WHERE id=$5", [name, tagline, logo, active, id]);
  } else {
    const r = await one<{ id: number }>("INSERT INTO partner_banks (name, tagline, logo_url, is_active, sort_order) VALUES ($1,$2,$3,$4,(SELECT COALESCE(max(sort_order),-1)+1 FROM partner_banks)) RETURNING id", [name, tagline, logo, active]);
    bankId = r!.id;
  }
  await audit(user.id, id ? "update" : "create", "partner_bank", bankId, { name });
  refresh();
  await flash(id ? "Bank saved" : "Bank added");
  return { ok: Date.now() };
}

export async function deleteBank(id: number) {
  const user = await requireUser("admin");
  const b = await one<{ name: string }>("SELECT name FROM partner_banks WHERE id=$1", [id]);
  await q("DELETE FROM partner_banks WHERE id=$1", [id]);
  await audit(user.id, "delete", "partner_bank", id, { name: b?.name });
  await flash(`${b?.name ?? "Bank"} removed`);
  refresh();
}

export async function toggleBank(id: number, value: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE partner_banks SET is_active=$1, updated_at=now() WHERE id=$2", [value, id]);
  await audit(user.id, value ? "activate" : "deactivate", "partner_bank", id);
  await flash(value ? "Bank shown on the website" : "Bank hidden from the website");
  refresh();
}

export async function reorderBanks(ids: number[]) {
  const user = await requireUser("admin");
  for (const [i, id] of ids.entries()) await q("UPDATE partner_banks SET sort_order=$1 WHERE id=$2", [i, Number(id)]);
  await audit(user.id, "reorder", "partner_bank", null, { ids });
  await flash("Bank order saved");
  refresh();
}

/** Confirms the video exists through YouTube's public oEmbed endpoint; returns its title. Network trouble is not treated as an error. */
async function checkVideo(id: string): Promise<{ ok: boolean; title?: string }> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (res.status === 400 || res.status === 404) return { ok: false };
    if (!res.ok) return { ok: true };
    const j = (await res.json()) as { title?: string };
    return { ok: true, title: j.title };
  } catch {
    return { ok: true };
  }
}

export async function saveVideo(id: number | null, _p: ItemFormState, fd: FormData): Promise<ItemFormState> {
  const user = await requireUser("admin");
  const errors: Record<string, string> = {};
  const url = s(fd, "url");
  const vid = youtubeId(url);
  if (!vid) errors.url = "Paste a YouTube link, for example https://www.youtube.com/watch?v=…";
  let title = s(fd, "title").slice(0, 120);
  if (vid) {
    const check = await checkVideo(vid);
    if (!check.ok) errors.url = "YouTube could not find this video. Check that it is public or unlisted.";
    if (!title && check.title) title = check.title.slice(0, 120);
  }
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const active = !!fd.get("is_active");
  let videoId = id;
  if (id) {
    await q("UPDATE page_videos SET youtube_id=$1, title=$2, is_active=$3, updated_at=now() WHERE id=$4", [vid, title || null, active, id]);
  } else {
    const r = await one<{ id: number }>("INSERT INTO page_videos (page_key, youtube_id, title, is_active, sort_order) VALUES ('home_loans',$1,$2,$3,(SELECT COALESCE(max(sort_order),-1)+1 FROM page_videos WHERE page_key='home_loans')) RETURNING id", [vid, title || null, active]);
    videoId = r!.id;
  }
  await audit(user.id, id ? "update" : "create", "page_video", videoId, { youtube_id: vid, title });
  refresh();
  await flash(id ? "Video saved" : "Video added");
  return { ok: Date.now() };
}

export async function deleteVideo(id: number) {
  const user = await requireUser("admin");
  await q("DELETE FROM page_videos WHERE id=$1", [id]);
  await audit(user.id, "delete", "page_video", id);
  await flash("Video removed");
  refresh();
}

export async function toggleVideo(id: number, value: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE page_videos SET is_active=$1, updated_at=now() WHERE id=$2", [value, id]);
  await audit(user.id, value ? "activate" : "deactivate", "page_video", id);
  await flash(value ? "Video shown on the website" : "Video hidden from the website");
  refresh();
}

export async function reorderVideos(ids: number[]) {
  const user = await requireUser("admin");
  for (const [i, id] of ids.entries()) await q("UPDATE page_videos SET sort_order=$1 WHERE id=$2", [i, Number(id)]);
  await audit(user.id, "reorder", "page_video", null, { ids });
  await flash("Video order saved");
  refresh();
}
