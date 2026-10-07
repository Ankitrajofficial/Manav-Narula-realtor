"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { flash } from "@/lib/flash";
import { one, q } from "@/lib/db";
import { audit, slugify } from "@/lib/records";
import { saveUpload } from "@/lib/upload";
import { getProjectById, releaseEditedFields, saveProject, setDeveloperImages, uniqueSlug, type ProjectInput } from "@/lib/queries/content";
import { buildAgiFacts, buildMexmonFacts, importProjects, type ProjectCopy, type RawPage, type StoredUnit } from "@/lib/project-import";
import type { ProjectMedia, ProjectMediaKind } from "@/data/projects";
import projectCopy from "../../../../../data/projects-copy.json";

export interface ProjectFormState { errors?: Record<string, string>; message?: string }
// Browsers send textarea line breaks as \r\n; store \n so unchanged text compares equal.
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").replace(/\r\n?/g, "\n").trim();
const opt = (v: string) => (v ? v : null);
const file = (fd: FormData, k: string) => { const f = fd.get(k); return f instanceof File && f.size > 0 ? f : null; };
const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);

/** Resolve a single-file field: new upload wins, else the kept current URL, else null (cleared). */
async function single(fd: FormData, k: string, folder: string): Promise<string | null> {
  const f = file(fd, k);
  if (f) return saveUpload(f, folder);
  return opt(s(fd, `${k}_current`));
}

const KINDS = new Set<string>(["elevation", "interior", "gallery", "floor-plan", "master-plan", "amenity", "location-map"]);

/** The Images manager rows (fields prefixed with `prefix`), in order: a chosen file replaces the row's image; empty rows are dropped. */
async function parseMedia(fd: FormData, name: string, prefix = ""): Promise<ProjectMedia[]> {
  const all = (k: string) => fd.getAll(`${prefix}media_${k}`).map(String);
  const keys = all("key"), urls = all("url"), kinds = all("kind"), alts = all("alt"), shown = all("published"), dev = all("developer");
  const out: ProjectMedia[] = [];
  for (const [i, key] of keys.entries()) {
    const upload = await saveUpload(file(fd, `${prefix}media_file_${key}`), "projects");
    const url = upload ?? urls[i] ?? "";
    if (!url) continue;
    const kind = (KINDS.has(kinds[i]) ? kinds[i] : "gallery") as ProjectMediaKind;
    // A file uploaded here is ours, not the developer's: it replaces their image and is shown.
    const developer = !upload && dev[i] === "1";
    out.push({ url, kind, alt: (alts[i] ?? "").trim().slice(0, 200) || name, ...(developer ? { developer: true } : {}), published: upload ? true : shown[i] !== "0" });
  }
  return out;
}

async function parseUnits(fd: FormData, projectName: string): Promise<StoredUnit[]> {
  const out: StoredUnit[] = [];
  for (const key of fd.getAll("unit_key").map(String)) {
    const g = (k: string) => s(fd, `unit_${k}_${key}`);
    const label = g("label");
    if (!label) continue;
    out.push({
      slug: slugify(g("slug") || g("name") || label), label, name: g("name") || label, source_url: opt(g("source_url")), rera: opt(g("rera")),
      rera_source: (g("rera_source") || "missing") as StoredUnit["rera_source"], configurations: g("configurations").split(",").map((c) => c.trim()).filter(Boolean),
      size_range: opt(g("sizes")), description: opt(g("description")), highlights: lines(g("highlights")), seo_title: opt(g("seo_title")), seo_description: opt(g("seo_description")),
      media: await parseMedia(fd, `${projectName} ${label}`, `unit_${key}_`), edited: [],
    });
  }
  return out;
}

async function parse(fd: FormData, id: number | null): Promise<{ input?: ProjectInput; errors?: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const name = s(fd, "name"); if (name.length < 3) errors.name = "Enter the project name.";
  const locality = s(fd, "locality"); if (!locality) errors.locality = "Choose a locality.";
  const developer_id = Number(s(fd, "developer_id")) || null; if (!developer_id) errors.developer_id = "Choose the developer.";
  const status = s(fd, "status") || "Upcoming";
  const published = s(fd, "intent") === "publish";
  const rera = opt(s(fd, "rera"));
  // A project may only be advertised with its RERA registration number.
  if (published && !rera) errors.rera = "Add the Project RERA No. before publishing. Save as a draft until you have it.";
  const priceRaw = s(fd, "price_from").replace(/[,\s₹]/g, "");
  const price_from = priceRaw ? Number(priceRaw) : null;
  if (priceRaw && (!Number.isFinite(price_from) || price_from! <= 0)) errors.price_from = "Enter the price in rupees, e.g. 4500000, or leave it blank for \"Price on request\".";
  const cfgTypes = fd.getAll("cfg_type").map(String), cfgAreas = fd.getAll("cfg_area").map(String), cfgPrices = fd.getAll("cfg_price").map(String), cfgNotes = fd.getAll("cfg_note").map(String);
  const configurations = cfgTypes.map((t, i) => ({ type: t.trim(), area: (cfgAreas[i] ?? "").trim(), price: (cfgPrices[i] ?? "").trim(), note: (cfgNotes[i] ?? "").trim() })).filter((c) => c.type);
  const msTitles = fd.getAll("ms_title").map(String), msDates = fd.getAll("ms_date").map(String), msDone = fd.getAll("ms_done").map(String);
  const milestones = msTitles.map((t, i) => ({ title: t.trim(), date: (msDates[i] ?? "").trim() || null, done: msDone[i] === "1" })).filter((m) => m.title);
  const kfL = fd.getAll("kf_label").map(String), kfV = fd.getAll("kf_value").map(String);
  const key_facts = kfL.map((l, i) => ({ label: l.trim(), value: (kfV[i] ?? "").trim() })).filter((k) => k.label);
  const fqQ = fd.getAll("faq_q").map(String), fqA = fd.getAll("faq_a").map(String);
  const faqs = fqQ.map((x, i) => ({ q: x.trim(), a: (fqA[i] ?? "").trim() })).filter((f) => f.q && f.a);
  if (Object.keys(errors).length) return { errors };
  const slug = await uniqueSlug("projects", slugify(s(fd, "slug") || name), id);
  let brochure: string | null, media: ProjectMedia[], units: StoredUnit[];
  try {
    media = await parseMedia(fd, name);
    units = await parseUnits(fd, name);
    brochure = await single(fd, "brochure", "brochures");
  } catch (e) {
    return { errors: { image: e instanceof Error ? e.message : "Upload failed." } };
  }
  return {
    input: {
      slug, name, developer_id, locality, status, possession: opt(s(fd, "possession")), key_facts, amenities: lines(s(fd, "amenities")), rera,
      description: opt(s(fd, "description")), brochure, published, city: opt(s(fd, "city")), address: opt(s(fd, "address")), size_range: opt(s(fd, "size_range")),
      price_from, featured: fd.get("featured") === "on", featured_order: Number(s(fd, "featured_order")) || null, highlights: lines(s(fd, "highlights")), faqs,
      location_highlights: lines(s(fd, "location_highlights")), seo_title: opt(s(fd, "seo_title")), seo_description: opt(s(fd, "seo_description")),
      show_developer_images: fd.get("show_developer_images") === "on", media, units, configurations, milestones,
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
  if (value) {
    const p = await one<{ rera: string | null }>("SELECT rera FROM projects WHERE id = $1", [id]);
    if (!p?.rera) { await flash("Add the Project RERA No. before publishing", "error"); return; }
  }
  await q("UPDATE projects SET published = $1, updated_at = now() WHERE id = $2", [value, id]);
  await audit(user.id, value ? "publish" : "unpublish", "project", id);
  await flash(value ? "Project published" : "Project unpublished");
  revalidatePath("/", "layout");
  revalidatePath("/admin/properties");
}

/** Homepage "Featured properties" strip: a featured project is shown there. */
export async function toggleProjectFeatured(id: number, value: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE projects SET featured = $1, updated_at = now() WHERE id = $2", [value, id]);
  await audit(user.id, value ? "feature" : "unfeature", "project", id);
  await flash(value ? "Project featured on the homepage" : "Project removed from featured");
  revalidatePath("/", "layout");
  revalidatePath("/admin/properties");
  revalidatePath("/admin/properties");
}

/** The per-project "Show developer images" switch. */
export async function toggleDeveloperImages(id: number, value: boolean) {
  const user = await requireUser("admin");
  await setDeveloperImages(id, value);
  await audit(user.id, value ? "show developer images" : "hide developer images", "project", id);
  await flash(value ? "Developer images are now shown on the website" : "Developer images hidden; the website shows the placeholder");
  revalidatePath("/", "layout");
  revalidatePath("/admin/properties");
}

/** Lets the next re-import update fields the admin had edited. */
export async function releaseEdits(id: number, fields: string[]) {
  const user = await requireUser("admin");
  await releaseEditedFields(id, fields);
  await audit(user.id, "release edited fields", "project", id, { fields });
  await flash(fields.length === 1 ? `Re-import may now update ${fields[0]}` : `Re-import may now update ${fields.length} fields`);
  revalidatePath(`/admin/projects/${id}`);
}

export async function deleteProject(id: number) {
  const user = await requireUser("admin");
  const p = await one<{ name: string }>("SELECT name FROM projects WHERE id = $1", [id]);
  await q("DELETE FROM projects WHERE id = $1", [id]);
  await audit(user.id, "delete", "project", id, { name: p?.name });
  revalidatePath("/", "layout");
  redirect("/admin/properties?toast=Project+deleted");
}

/* ---------------- Re-import from JSON ---------------- */

export interface ReimportState {
  error?: string;
  summary?: string;
  rows?: { name: string; action: string; factsUpdated: string[]; keptEdited: string[]; toConfirm: number }[];
}

/**
 * Re-imports the developer data from an uploaded projects_tree.json (or projects.json) plus the AGI listings. Facts are
 * refreshed unless edited here; our copy and images only fill empty fields; nothing is published. Images are not in the
 * JSON, so they come only from the command-line import.
 */
export async function reimportProjects(_p: ReimportState, fd: FormData): Promise<ReimportState> {
  const user = await requireUser("admin");
  const f = file(fd, "json");
  if (!f) return { error: "Choose the projects_tree.json file from the scraper." };
  if (f.size > 20 * 1024 * 1024) return { error: "That file is larger than 20 MB; it is not the scraper's JSON." };
  let pages: RawPage[];
  try {
    const data = JSON.parse(await f.text());
    pages = Array.isArray(data) ? data : data.projects;
    if (!Array.isArray(pages) || !pages.every((p) => p && typeof p.url === "string")) throw new Error();
  } catch {
    return { error: "This is not the scraper's projects_tree.json or projects.json." };
  }
  const db = { query: async <T,>(text: string, params?: unknown[]) => ({ rows: await q<T>(text, params ?? []) }) };
  // Files were moved when the projects were first imported; here we only need their new paths.
  const moveUrl = (url: string, slug: string) => (url.startsWith("/properties/") ? `/projects/${slug}/${url.split("/").pop()}` : url);
  const facts = [...buildMexmonFacts(pages), ...(await buildAgiFacts(db, moveUrl))];
  const results = await importProjects(db, facts, projectCopy as Record<string, ProjectCopy>);
  const updated = results.reduce((n, r) => n + r.factsUpdated.length, 0);
  const kept = results.reduce((n, r) => n + r.keptEdited.length, 0);
  const created = results.filter((r) => r.action === "created").length;
  const summary = `${updated} ${updated === 1 ? "fact" : "facts"} updated, ${kept} edited ${kept === 1 ? "field" : "fields"} kept${created ? `, ${created} new ${created === 1 ? "project" : "projects"} added as drafts` : ""}`;
  await audit(user.id, "re-import", "project", null, { file: f.name, updated, kept, created });
  revalidatePath("/", "layout");
  await flash(`Re-import done: ${summary}`);
  return {
    summary,
    rows: results.map((r) => ({ name: r.name, action: r.action, factsUpdated: r.factsUpdated, keptEdited: r.keptEdited, toConfirm: r.toConfirm.length })),
  };
}
