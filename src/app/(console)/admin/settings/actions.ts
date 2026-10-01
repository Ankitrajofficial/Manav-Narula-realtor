"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { audit } from "@/lib/records";
import { DEFAULT_BUSINESS, getSettingValue, setSetting, type Business } from "@/lib/queries/settings";

export interface BusinessState { errors?: Record<string, string>; message?: string }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function saveBusiness(_p: BusinessState, fd: FormData): Promise<BusinessState> {
  const user = await requireUser("admin");
  const errors: Record<string, string> = {};
  const b: Business = {
    name: s(fd, "name"), tagline: s(fd, "tagline"), phone: s(fd, "phone"), whatsapp: s(fd, "whatsapp"), email: s(fd, "email"), address: s(fd, "address"), hours: s(fd, "hours"), rera: s(fd, "rera"),
    rating: Number(s(fd, "rating")), reviews: Number(s(fd, "reviews")), instagram: s(fd, "instagram"), facebook: s(fd, "facebook"), youtube: s(fd, "youtube"),
  };
  if (b.name.length < 2) errors.name = "Enter the business name.";
  if (!b.phone) errors.phone = "Enter the phone number shown on the website.";
  if (b.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) errors.email = "Enter a valid email.";
  if (!(b.rating >= 0 && b.rating <= 5)) errors.rating = "Rating is between 0 and 5.";
  if (!(b.reviews >= 0)) errors.reviews = "Reviews cannot be negative.";
  for (const k of ["instagram", "facebook", "youtube"] as const) if (b[k] && !/^https?:\/\//.test(b[k])) errors[k] = "Start with https://";
  const notification = s(fd, "notification_email");
  if (notification && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(notification)) errors.notification_email = "Enter a valid email.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const before = await getSettingValue<Business>("business", DEFAULT_BUSINESS);
  await setSetting("business", b);
  await setSetting("notification_email", notification);
  const changed = (Object.keys(b) as (keyof Business)[]).filter((k) => String(before[k] ?? "") !== String(b[k] ?? ""));
  await audit(user.id, "update", "settings", "business", { changed });
  revalidatePath("/", "layout");
  redirect("/admin/settings?toast=Business+details+saved");
}

type ListKind = "sources" | "localities" | "tags" | "types";
const tables: Record<Exclude<ListKind, "types">, string> = { sources: "lead_sources", localities: "localities", tags: "tags" };

export async function addListItem(kind: ListKind, fd: FormData) {
  const user = await requireUser("admin");
  const name = s(fd, "name");
  if (!name) redirect("/admin/settings?error=Enter+a+name");
  if (kind === "types") {
    const cur = await getSettingValue<string[]>("property_types", []);
    if (!cur.includes(name)) await setSetting("property_types", [...cur, name]);
  } else if (kind === "localities") {
    const next = await one<{ n: number }>("SELECT COALESCE(max(sort_order),-1)+1 AS n FROM localities");
    await q("INSERT INTO localities (name, sort_order) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING", [name, Number(next?.n ?? 0)]);
  } else {
    await q(`INSERT INTO ${tables[kind]} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
  }
  await audit(user.id, "add", `settings_${kind}`, name);
  revalidatePath("/", "layout");
  redirect(`/admin/settings?toast=${encodeURIComponent(`Added ${name}`)}#${kind}`);
}

export async function removeListItem(kind: ListKind, name: string) {
  const user = await requireUser("admin");
  if (kind === "types") {
    const cur = await getSettingValue<string[]>("property_types", []);
    await setSetting("property_types", cur.filter((t) => t !== name));
  } else {
    await q(`DELETE FROM ${tables[kind]} WHERE name = $1`, [name]);
  }
  await audit(user.id, "remove", `settings_${kind}`, name);
  revalidatePath("/", "layout");
  redirect(`/admin/settings?toast=${encodeURIComponent(`Removed ${name}`)}#${kind}`);
}

export async function moveLocality(id: number, dir: -1 | 1) {
  const user = await requireUser("admin");
  const ids = (await q<{ id: number }>("SELECT id FROM localities ORDER BY sort_order, name")).map((r) => r.id);
  const i = ids.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) redirect("/admin/settings#localities");
  [ids[i], ids[j]] = [ids[j], ids[i]];
  for (const [k, lid] of ids.entries()) await q("UPDATE localities SET sort_order = $1 WHERE id = $2", [k, lid]);
  await audit(user.id, "reorder", "settings_localities", id);
  revalidatePath("/", "layout");
  redirect("/admin/settings#localities");
}
