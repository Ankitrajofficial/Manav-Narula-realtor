"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { flash } from "@/lib/flash";
import { q } from "@/lib/db";
import { audit } from "@/lib/records";
import { saveUpload } from "@/lib/upload";
import { parsePagePaths, type PopupKind } from "@/lib/popups";
import { savePopup, type PopupInput } from "@/lib/queries/popups";

export interface PopupFormState { errors?: Record<string, string>; message?: string }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (v: string) => (v ? v : null);

export async function upsertPopup(id: number | null, _p: PopupFormState, fd: FormData): Promise<PopupFormState> {
  const user = await requireUser("admin");
  const errors: Record<string, string> = {};
  const kinds: PopupKind[] = ["promo", "consultation", "enquiry"];
  const kind: PopupKind = kinds.includes(s(fd, "kind") as PopupKind) ? (s(fd, "kind") as PopupKind) : "promo";
  const title = s(fd, "title").slice(0, 90);
  if (title.length < 3) errors.title = "Enter a title of at least 3 characters.";
  const text = s(fd, "text").slice(0, 400);
  const ctaLabel = s(fd, "cta_label").slice(0, 40);
  const ctaHref = s(fd, "cta_href");
  if (kind === "promo") {
    if (ctaHref && !/^(\/|https?:\/\/|tel:|mailto:)/.test(ctaHref)) errors.cta_href = "Link must start with /, https://, tel: or mailto:";
    if (ctaLabel && !ctaHref) errors.cta_href = "Add the link the button opens.";
    if (ctaHref && !ctaLabel) errors.cta_label = "Add the button text.";
  }
  const showOn = s(fd, "show_on");
  const paths = parsePagePaths(s(fd, "page_paths"));
  if (showOn === "pages" && !paths.length) errors.page_paths = "Add at least one page, e.g. /properties";
  const pages = showOn === "home" ? "home" : showOn === "pages" ? paths.join("\n") : "all";
  const delay = Number(s(fd, "delay_seconds"));
  if (!Number.isInteger(delay) || delay < 0 || delay > 600) errors.delay_seconds = "Whole seconds between 0 and 600.";
  const start = s(fd, "start_date"), end = s(fd, "end_date");
  if (start && end && end < start) errors.end_date = "End date is before the start date.";
  let image: string | null = null;
  try {
    const f = fd.get("image");
    image = f instanceof File && f.size > 0 ? await saveUpload(f, "popups") : opt(s(fd, "image_current"));
    if (image?.endsWith(".pdf") || image?.endsWith(".mp4") || image?.endsWith(".3gp")) errors.image = "Choose a JPG, PNG or WebP image.";
  } catch (e) {
    errors.image = e instanceof Error ? e.message : "Upload failed.";
  }
  if (kind === "promo" && !image && !text) errors.text = "A promotion needs an image or some text.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };

  const input: PopupInput = {
    kind, title, text: opt(text), image,
    // For an enquiry form the button text is the submit button's label.
    cta_label: kind === "consultation" ? null : opt(ctaLabel), cta_href: kind === "promo" ? opt(ctaHref) : null,
    project_id: kind === "enquiry" ? Number(s(fd, "project_id")) || null : null,
    pages, delay_seconds: delay, start_date: opt(start), end_date: opt(end), active: !!fd.get("active"),
  };
  const newId = await savePopup(id, input);
  await audit(user.id, id ? "update" : "create", "popup", newId, { title, kind, active: input.active });
  revalidatePath("/", "layout");
  redirect("/admin/popups?toast=Pop-up+saved");
}

export async function togglePopupActive(id: number, value: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE popups SET active = $1, updated_at = now() WHERE id = $2", [value, id]);
  await audit(user.id, value ? "activate" : "deactivate", "popup", id);
  await flash(value ? "Pop-up is live on the website" : "Pop-up switched off");
  revalidatePath("/", "layout");
  revalidatePath("/admin/popups");
}

export async function deletePopup(id: number) {
  const user = await requireUser("admin");
  await q("DELETE FROM popups WHERE id = $1", [id]);
  await audit(user.id, "delete", "popup", id);
  revalidatePath("/", "layout");
  redirect("/admin/popups?toast=Pop-up+deleted");
}
