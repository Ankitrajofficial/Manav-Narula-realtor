"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { audit } from "@/lib/records";
import { LOCALITY_ORDER, ZONES } from "@/lib/localities";
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
    const zone = (ZONES as readonly string[]).includes(s(fd, "zone")) ? s(fd, "zone") : "Central";
    const next = await one<{ n: number }>("SELECT COALESCE(max(sort_order),-1)+1 AS n FROM localities");
    await q("INSERT INTO localities (name, zone, sort_order) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING", [name, zone, Number(next?.n ?? 0)]);
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

/** Moves a locality up or down within its zone. */
export async function moveLocality(id: number, dir: -1 | 1) {
  const user = await requireUser("admin");
  const ids = (await q<{ id: number }>(`SELECT l.id FROM localities l WHERE l.zone = (SELECT zone FROM localities WHERE id = $1) ORDER BY ${LOCALITY_ORDER}`, [id])).map((r) => r.id);
  const i = ids.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) redirect("/admin/settings#localities");
  [ids[i], ids[j]] = [ids[j], ids[i]];
  const base = (await one<{ n: number }>("SELECT COALESCE(min(sort_order), 0) AS n FROM localities WHERE id = ANY($1::int[])", [ids]))?.n ?? 0;
  for (const [k, lid] of ids.entries()) await q("UPDATE localities SET sort_order = $1 WHERE id = $2", [Number(base) + k, lid]);
  await audit(user.id, "reorder", "settings_localities", id);
  revalidatePath("/", "layout");
  redirect("/admin/settings#localities");
}

/** Renames a locality everywhere it is used (properties, projects, leads, prospects), so filters and records stay matched. */
export async function renameLocality(id: number, fd: FormData) {
  const user = await requireUser("admin");
  const name = s(fd, "name");
  const cur = await one<{ name: string }>("SELECT name FROM localities WHERE id = $1", [id]);
  if (!cur || !name || name === cur.name) redirect("/admin/settings#localities");
  if (await one("SELECT 1 FROM localities WHERE lower(name) = lower($1) AND id <> $2", [name, id])) redirect(`/admin/settings?error=${encodeURIComponent(`${name} already exists`)}#localities`);
  await q("UPDATE localities SET name = $1 WHERE id = $2", [name, id]);
  for (const t of ["properties", "projects", "leads", "prospects"]) await q(`UPDATE ${t} SET locality = $1 WHERE locality = $2`, [name, cur.name]);
  await audit(user.id, "rename", "settings_localities", id, { from: cur.name, to: name });
  revalidatePath("/", "layout");
  redirect(`/admin/settings?toast=${encodeURIComponent(`Renamed to ${name}`)}#localities`);
}

export async function setLocalityZone(id: number, fd: FormData) {
  const user = await requireUser("admin");
  const zone = s(fd, "zone");
  if (!(ZONES as readonly string[]).includes(zone)) redirect("/admin/settings?error=Choose+a+zone#localities");
  const next = await one<{ n: number }>("SELECT COALESCE(max(sort_order),-1)+1 AS n FROM localities WHERE zone = $1", [zone]);
  await q("UPDATE localities SET zone = $1, sort_order = $2 WHERE id = $3 AND zone <> $1", [zone, Number(next?.n ?? 0), id]);
  await audit(user.id, "zone", "settings_localities", id, { zone });
  revalidatePath("/", "layout");
  redirect(`/admin/settings?toast=${encodeURIComponent(`Moved to ${zone}`)}#localities`);
}

/** Inactive localities disappear from the website filters and new-record forms; existing records keep them. */
export async function toggleLocality(id: number, value: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE localities SET is_active = $1 WHERE id = $2", [value, id]);
  await audit(user.id, value ? "activate" : "deactivate", "settings_localities", id);
  revalidatePath("/", "layout");
}
