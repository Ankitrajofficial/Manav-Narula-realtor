"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { audit, slugify } from "@/lib/records";
import { saveUpload, saveUploads } from "@/lib/upload";
import { getProjectById, saveProject, uniqueSlug, type ProjectInput } from "@/lib/queries/content";

export interface ProjectFormState { errors?: Record<string, string>; message?: string }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (v: string) => (v ? v : null);
const file = (fd: FormData, k: string) => { const f = fd.get(k); return f instanceof File && f.size > 0 ? f : null; };

/** Resolve a single-file field: new upload wins, else the kept current URL, else null (cleared). */
async function single(fd: FormData, k: string, folder: string): Promise<string | null> {
  const f = file(fd, k);
  if (f) return saveUpload(f, folder);
  return opt(s(fd, `${k}_current`));
}

async function parse(fd: FormData, id: number | null): Promise<{ input?: ProjectInput; errors?: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const name = s(fd, "name"); if (name.length < 3) errors.name = "Enter the project name.";
  const locality = s(fd, "locality"); if (!locality) errors.locality = "Choose a locality.";
  const status = s(fd, "status") || "Upcoming";
  const cfgTypes = fd.getAll("cfg_type").map(String), cfgAreas = fd.getAll("cfg_area").map(String), cfgPrices = fd.getAll("cfg_price").map(String);
  const configurations = cfgTypes.map((t, i) => ({ type: t.trim(), area: (cfgAreas[i] ?? "").trim(), price: (cfgPrices[i] ?? "").trim() })).filter((c) => c.type);
  const msTitles = fd.getAll("ms_title").map(String), msDates = fd.getAll("ms_date").map(String), msDone = fd.getAll("ms_done").map(String);
  const milestones = msTitles.map((t, i) => ({ title: t.trim(), date: (msDates[i] ?? "").trim() || null, done: msDone[i] === "1" })).filter((m) => m.title);
  const kfL = fd.getAll("kf_label").map(String), kfV = fd.getAll("kf_value").map(String);
  const key_facts = kfL.map((l, i) => ({ label: l.trim(), value: (kfV[i] ?? "").trim() })).filter((k) => k.label);
  if (Object.keys(errors).length) return { errors };
  const slug = await uniqueSlug("projects", slugify(s(fd, "slug") || name), id);
  let image: string | null, master_plan: string | null, floor_plan: string | null, brochure: string | null, gallery: string[];
  try {
    image = await single(fd, "image", "projects");
    master_plan = await single(fd, "master_plan", "projects");
    floor_plan = await single(fd, "floor_plan", "projects");
    brochure = await single(fd, "brochure", "brochures");
    const kept = fd.getAll("gallery_urls").map(String).filter(Boolean);
    gallery = [...kept, ...(await saveUploads(fd.getAll("gallery").filter((f): f is File => f instanceof File && f.size > 0), "projects"))];
  } catch (e) {
    return { errors: { image: e instanceof Error ? e.message : "Upload failed." } };
  }
  return {
    input: {
      slug, name, developer: opt(s(fd, "developer")), locality, status, image, gallery, starting_price: opt(s(fd, "starting_price")), possession: opt(s(fd, "possession")), key_facts,
      amenities: fd.getAll("amenities").map(String), rera: opt(s(fd, "rera")), description: opt(s(fd, "description")), brochure, master_plan, floor_plan, published: s(fd, "intent") === "publish", configurations, milestones,
    },
  };
}

export async function createProject(_p: ProjectFormState, fd: FormData): Promise<ProjectFormState> {
  const user = await requireUser("admin");
  const { input, errors } = await parse(fd, null);
  if (!input) return { errors, message: "Fix the highlighted fields." };
  const id = await saveProject(null, input);
  await audit(user.id, "create", "project", id, { name: input.name, published: input.published });
  revalidatePath("/", "layout");
  redirect(`/admin/projects/${id}?toast=${encodeURIComponent(input.published ? "Project published" : "Draft saved")}`);
}

export async function editProject(id: number, _p: ProjectFormState, fd: FormData): Promise<ProjectFormState> {
  const user = await requireUser("admin");
  if (!(await getProjectById(id))) return { message: "Project no longer exists." };
  const { input, errors } = await parse(fd, id);
  if (!input) return { errors, message: "Fix the highlighted fields." };
  await saveProject(id, input);
  await audit(user.id, "update", "project", id, { name: input.name, published: input.published });
  revalidatePath("/", "layout");
  redirect(`/admin/projects/${id}?toast=${encodeURIComponent(input.published ? "Project published" : "Draft saved")}`);
}

export async function toggleProjectPublished(id: number, value: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE projects SET published = $1, updated_at = now() WHERE id = $2", [value, id]);
  await audit(user.id, value ? "publish" : "unpublish", "project", id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/projects");
}

export async function deleteProject(id: number) {
  const user = await requireUser("admin");
  const p = await one<{ name: string }>("SELECT name FROM projects WHERE id = $1", [id]);
  await q("DELETE FROM projects WHERE id = $1", [id]);
  await audit(user.id, "delete", "project", id, { name: p?.name });
  revalidatePath("/", "layout");
  redirect("/admin/projects?toast=Project+deleted");
}
