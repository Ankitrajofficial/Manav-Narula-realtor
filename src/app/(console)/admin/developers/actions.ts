"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { flash } from "@/lib/flash";
import { one, q } from "@/lib/db";
import { audit, slugify } from "@/lib/records";
import { getDeveloper, moveProjectToDeveloper, saveDeveloper } from "@/lib/queries/content";

export interface DeveloperFormState { errors?: Record<string, string>; message?: string }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

async function parse(fd: FormData, id: number | null) {
  const errors: Record<string, string> = {};
  const name = s(fd, "name"); if (name.length < 2) errors.name = "Enter the developer's name.";
  const slug = slugify(s(fd, "slug") || name);
  let website = s(fd, "website");
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (website) { try { new URL(website); } catch { errors.website = "Enter a web address such as https://example.com"; } }
  const clash = await one<{ id: number; name: string; slug: string }>("SELECT id, name, slug FROM developers WHERE (lower(name) = lower($1) OR slug = $2) AND id <> $3", [name, slug, id ?? 0]);
  if (clash) errors[clash.slug === slug && clash.name.toLowerCase() !== name.toLowerCase() ? "slug" : "name"] = `${clash.name} already uses this name or page address.`;
  return { errors, input: { name, slug, website: website || null, logo_permission: fd.get("logo_permission") === "on", description: s(fd, "description") || null } };
}

export async function createDeveloper(_p: DeveloperFormState, fd: FormData): Promise<DeveloperFormState> {
  const user = await requireUser("admin");
  const { errors, input } = await parse(fd, null);
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const id = await saveDeveloper(null, input);
  await audit(user.id, "create", "developer", id, { name: input.name });
  revalidatePath("/admin/developers");
  redirect(`/admin/developers/${id}?toast=Developer+added`);
}

export async function editDeveloper(id: number, _p: DeveloperFormState, fd: FormData): Promise<DeveloperFormState> {
  const user = await requireUser("admin");
  if (!(await getDeveloper(id))) return { message: "This developer no longer exists." };
  const { errors, input } = await parse(fd, id);
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  await saveDeveloper(id, input);
  await audit(user.id, "update", "developer", id, { name: input.name });
  revalidatePath("/", "layout");
  redirect(`/admin/developers/${id}?toast=Developer+saved`);
}

/** Moves one project to the developer chosen in its row. */
export async function moveProject(projectId: number, fd: FormData) {
  const user = await requireUser("admin");
  const to = Number(fd.get("developer_id"));
  const d = await one<{ name: string }>("SELECT name FROM developers WHERE id = $1", [to]);
  if (!d) { await flash("Choose a developer", "error"); return; }
  await moveProjectToDeveloper(projectId, to);
  await audit(user.id, "move", "project", projectId, { developer: d.name });
  await flash(`Moved to ${d.name}`);
  revalidatePath("/", "layout");
}

export async function deleteDeveloper(id: number) {
  const user = await requireUser("admin");
  const n = await one<{ n: number }>("SELECT count(*)::int AS n FROM projects WHERE developer_id = $1", [id]);
  if (Number(n?.n ?? 0) > 0) { await flash("Move this developer's projects to another developer first", "error"); return; }
  await q("DELETE FROM developers WHERE id = $1", [id]);
  await audit(user.id, "delete", "developer", id);
  redirect("/admin/developers?toast=Developer+deleted");
}
