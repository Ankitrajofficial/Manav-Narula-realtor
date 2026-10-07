"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { flash } from "@/lib/flash";
import { q } from "@/lib/db";
import { audit } from "@/lib/records";
import { saveUpload } from "@/lib/upload";
import { moveTeamMember, saveTeamMember } from "@/lib/queries/team";

export interface TeamFormState { errors?: Record<string, string>; message?: string }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").replace(/\r\n?/g, "\n").trim();
const opt = (v: string) => (v ? v : null);

export async function upsertTeamMember(id: number | null, _p: TeamFormState, fd: FormData): Promise<TeamFormState> {
  const user = await requireUser("admin");
  const errors: Record<string, string> = {};
  const name = s(fd, "name").slice(0, 80); if (name.length < 2) errors.name = "Enter the person's name.";
  let photo: string | null = null;
  try {
    const f = fd.get("photo");
    photo = f instanceof File && f.size > 0 ? await saveUpload(f, "team") : opt(s(fd, "photo_current"));
    if (photo && /\.(pdf|mp4|3gp)$/i.test(photo)) errors.photo = "Choose a JPG, PNG or WebP photo.";
  } catch (e) { errors.photo = e instanceof Error ? e.message : "Upload failed."; }
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const newId = await saveTeamMember(id, { name, role: opt(s(fd, "role").slice(0, 80)), bio: opt(s(fd, "bio").slice(0, 300)), photo, active: fd.get("active") === "on" });
  await audit(user.id, id ? "update" : "create", "team_member", newId, { name });
  revalidatePath("/about");
  redirect("/admin/team?toast=Team+member+saved");
}

export async function toggleTeamMember(id: number, value: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE team_members SET active = $1, updated_at = now() WHERE id = $2", [value, id]);
  await audit(user.id, value ? "show" : "hide", "team_member", id);
  await flash(value ? "Shown on the About page" : "Hidden from the About page");
  revalidatePath("/about"); revalidatePath("/admin/team");
}

export async function moveTeamMemberAction(id: number, dir: -1 | 1) {
  await requireUser("admin");
  await moveTeamMember(id, dir);
  revalidatePath("/about"); revalidatePath("/admin/team");
}

export async function deleteTeamMember(id: number) {
  const user = await requireUser("admin");
  await q("DELETE FROM team_members WHERE id = $1", [id]);
  await audit(user.id, "delete", "team_member", id);
  revalidatePath("/about");
  redirect("/admin/team?toast=Team+member+deleted");
}
