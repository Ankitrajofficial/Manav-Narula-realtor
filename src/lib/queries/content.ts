import "server-only";
import { json, one, q } from "@/lib/db";
import { pageOf, sortOf } from "@/lib/console";
import { levelLabel } from "@/lib/growth";
import { fromMedia, type StoredUnit } from "@/lib/project-import";
import type { ProjectMedia } from "@/data/projects";

type SP = Record<string, string | undefined>;
const like = (s: string) => `%${s.trim()}%`;

export { toDateInput } from "@/lib/dates";

/* ---------------- Properties ---------------- */
export interface PropertyRow { [key: string]: unknown;
  id: number; slug: string; title: string; type: string; purpose: string; locality: string | null; project_id: number | null;
  price: number | string; bhk: number | null; baths: number | null; area: number | string | null; area_unit: string; super_area: number | string | null;
  floor: string | null; facing: string | null; furnishing: string | null; parking: string | null; possession: string | null; status: string;
  description: string | null; long_description: string | null; amenities: string[]; trust: string[]; rera: string | null;
  nearby: { name: string; distance: string }[]; featured: boolean; published: boolean; meta_title: string | null; meta_description: string | null;
  address_line: string | null; street: string | null; city: string; pincode: string | null; maps_url: string | null;
  master_plan: string | null; floor_plan: string | null;
  created_at: Date; updated_at: Date; cover: string | null;
}
export interface PropertyImage { [key: string]: unknown; id: number; property_id: number; url: string; sort_order: number; is_cover: boolean }

const PROPERTY_SORT: Record<string, string> = { title: "p.title", price: "p.price", updated_at: "p.updated_at", locality: "p.locality", type: "p.type", status: "p.status" };
const COVER = "(SELECT url FROM property_images i WHERE i.property_id = p.id ORDER BY i.is_cover DESC, i.sort_order ASC LIMIT 1) AS cover";

/** `excludeSlugs`: listings shown elsewhere, e.g. the AGI listings that became developer projects. */
export async function listProperties(sp: SP, excludeSlugs: string[] = []) {
  const where: string[] = []; const params: unknown[] = [];
  if (excludeSlugs.length) { params.push(excludeSlugs); where.push(`NOT (p.slug = ANY($${params.length}::text[]))`); }
  if (sp.q) { params.push(like(sp.q)); where.push(`(p.title ILIKE $${params.length} OR p.locality ILIKE $${params.length} OR p.slug ILIKE $${params.length})`); }
  if (sp.type) { params.push(sp.type); where.push(`p.type = $${params.length}`); }
  if (sp.purpose) { params.push(sp.purpose); where.push(`p.purpose = $${params.length}`); }
  if (sp.locality) { params.push(sp.locality); where.push(`p.locality = $${params.length}`); }
  if (sp.status) { params.push(sp.status); where.push(`p.status = $${params.length}`); }
  if (sp.published === "1") where.push("p.published = true");
  if (sp.published === "0") where.push("p.published = false");
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sort = sortOf(sp, PROPERTY_SORT, "updated_at");
  const { page, size, offset } = pageOf(sp);
  // Count and page rows in parallel: one round trip to the database instead of two.
  const [countRow, rows] = await Promise.all([one<{ n: number }>(`SELECT count(*)::int AS n FROM properties p ${w}`, params), q<PropertyRow>(`SELECT p.*, ${COVER} FROM properties p ${w} ORDER BY ${sort.sql} LIMIT ${size} OFFSET ${offset}`, params)]);
  const total = Number(countRow?.n ?? 0);
  return { rows, total, page, size, sort };
}

export async function allPropertiesForExport(sp: SP) {
  const where: string[] = []; const params: unknown[] = [];
  if (sp.q) { params.push(like(sp.q)); where.push(`(p.title ILIKE $${params.length} OR p.locality ILIKE $${params.length})`); }
  if (sp.type) { params.push(sp.type); where.push(`p.type = $${params.length}`); }
  if (sp.purpose) { params.push(sp.purpose); where.push(`p.purpose = $${params.length}`); }
  if (sp.locality) { params.push(sp.locality); where.push(`p.locality = $${params.length}`); }
  if (sp.status) { params.push(sp.status); where.push(`p.status = $${params.length}`); }
  if (sp.published === "1") where.push("p.published = true");
  if (sp.published === "0") where.push("p.published = false");
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return q<PropertyRow>(`SELECT p.*, ${COVER} FROM properties p ${w} ORDER BY p.updated_at DESC`, params);
}

export const getPropertyById = (id: number) => one<PropertyRow>(`SELECT p.*, ${COVER} FROM properties p WHERE p.id = $1`, [id]);
export const getPropertyImages = (id: number) => q<PropertyImage>("SELECT * FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, sort_order ASC", [id]);

export async function uniqueSlug(table: "properties" | "projects" | "blog_posts", base: string, excludeId?: number | null): Promise<string> {
  let slug = base || "item";
  for (let i = 2; i < 100; i++) {
    const hit = await one<{ id: number }>(`SELECT id FROM ${table} WHERE slug = $1 ${excludeId ? `AND id <> ${Number(excludeId)}` : ""}`, [slug]);
    if (!hit) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export interface PropertyInput {
  slug: string; title: string; type: string; purpose: string; locality: string | null; project_id: number | null; price: number;
  bhk: number | null; baths: number | null; area: number | null; area_unit: string; super_area: number | null; floor: string | null; facing: string | null;
  furnishing: string | null; parking: string | null; possession: string | null; status: string; description: string | null; long_description: string | null;
  amenities: string[]; trust: string[]; rera: string | null; nearby: { name: string; distance: string }[]; featured: boolean; published: boolean;
  meta_title: string | null; meta_description: string | null;
  /** House/plot number: admin only, never shown on the website. */
  address_line: string | null; street: string | null; city: string; pincode: string | null; maps_url: string | null;
  master_plan: string | null; floor_plan: string | null;
}

export async function insertProperty(p: PropertyInput): Promise<number> {
  const r = await one<{ id: number }>(
    `INSERT INTO properties (slug,title,type,purpose,locality,project_id,price,bhk,baths,area,area_unit,super_area,floor,facing,furnishing,parking,possession,status,description,long_description,amenities,trust,rera,nearby,featured,published,meta_title,meta_description,address_line,street,city,pincode,maps_url,master_plan,floor_plan)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb,$22::jsonb,$23,$24::jsonb,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35) RETURNING id`,
    [p.slug, p.title, p.type, p.purpose, p.locality, p.project_id, p.price, p.bhk, p.baths, p.area, p.area_unit, p.super_area, p.floor, p.facing, p.furnishing, p.parking, p.possession, p.status, p.description, p.long_description, json(p.amenities), json(p.trust), p.rera, json(p.nearby), p.featured, p.published, p.meta_title, p.meta_description, p.address_line, p.street, p.city, p.pincode, p.maps_url, p.master_plan, p.floor_plan]);
  return r!.id;
}

export async function updateProperty(id: number, p: PropertyInput) {
  await q(
    `UPDATE properties SET slug=$1,title=$2,type=$3,purpose=$4,locality=$5,project_id=$6,price=$7,bhk=$8,baths=$9,area=$10,area_unit=$11,super_area=$12,floor=$13,facing=$14,furnishing=$15,parking=$16,possession=$17,status=$18,description=$19,long_description=$20,amenities=$21::jsonb,trust=$22::jsonb,rera=$23,nearby=$24::jsonb,featured=$25,published=$26,meta_title=$27,meta_description=$28,address_line=$29,street=$30,city=$31,pincode=$32,maps_url=$33,master_plan=$35,floor_plan=$36,updated_at=now() WHERE id=$34`,
    [p.slug, p.title, p.type, p.purpose, p.locality, p.project_id, p.price, p.bhk, p.baths, p.area, p.area_unit, p.super_area, p.floor, p.facing, p.furnishing, p.parking, p.possession, p.status, p.description, p.long_description, json(p.amenities), json(p.trust), p.rera, json(p.nearby), p.featured, p.published, p.meta_title, p.meta_description, p.address_line, p.street, p.city, p.pincode, p.maps_url, id, p.master_plan, p.floor_plan]);
}

export async function replacePropertyImages(propertyId: number, urls: string[], coverUrl: string | null) {
  await q("DELETE FROM property_images WHERE property_id = $1", [propertyId]);
  for (const [i, url] of urls.entries()) {
    await q("INSERT INTO property_images (property_id,url,sort_order,is_cover) VALUES ($1,$2,$3,$4)", [propertyId, url, i, coverUrl ? url === coverUrl : i === 0]);
  }
}

/* ---------------- Projects ---------------- */
export interface ProjectRow { [key: string]: unknown;
  id: number; slug: string; name: string; developer: string | null; locality: string | null; status: string; image: string | null; gallery: string[];
  starting_price: string | null; possession: string | null; key_facts: { label: string; value: string }[]; amenities: string[]; rera: string | null;
  description: string | null; brochure: string | null; master_plan: string | null; floor_plan: string | null; published: boolean; created_at: Date; updated_at: Date;
  media: ProjectMedia[]; floor_plans: { url: string; label: string }[] | null;
  developer_id: number | null; city: string | null; address: string | null; size_range: string | null; price_from: string | number | null;
  featured: boolean; featured_order: number | null; highlights: string[]; faqs: { q: string; a: string }[]; location_highlights: string[];
  seo_title: string | null; seo_description: string | null; source_url: string | null; edited_fields: string[]; units: StoredUnit[];
  show_developer_images: boolean;
  progress?: number; milestones_total?: number; milestones_done?: number;
}
export interface ProjectConfig { [key: string]: unknown; id: number; project_id: number; type: string; area: string | null; price: string | null; note: string | null; sort_order: number }
export interface ProjectMilestone { [key: string]: unknown; id: number; project_id: number; title: string; date: string | Date | null; done: boolean; sort_order: number }

const PROJECT_SORT: Record<string, string> = { name: "p.name", locality: "p.locality", status: "p.status", updated_at: "p.updated_at", developer: "p.developer", featured: "p.featured" };
const PROGRESS = "COALESCE((SELECT round(100.0 * count(*) FILTER (WHERE done) / NULLIF(count(*),0)) FROM project_milestones m WHERE m.project_id = p.id), 0)::int AS progress";

export async function listProjects(sp: SP) {
  const where: string[] = []; const params: unknown[] = [];
  if (sp.q) { params.push(like(sp.q)); where.push(`(p.name ILIKE $${params.length} OR p.locality ILIKE $${params.length} OR p.developer ILIKE $${params.length})`); }
  if (sp.status) { params.push(sp.status); where.push(`p.status = $${params.length}`); }
  if (sp.developer) { params.push(Number(sp.developer)); where.push(`p.developer_id = $${params.length}`); }
  if (sp.published === "1") where.push("p.published = true");
  if (sp.published === "0") where.push("p.published = false");
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sort = sortOf(sp, PROJECT_SORT, "updated_at");
  const { page, size, offset } = pageOf(sp);
  // Count and page rows in parallel: one round trip to the database instead of two.
  const [countRow, rows] = await Promise.all([one<{ n: number }>(`SELECT count(*)::int AS n FROM projects p ${w}`, params), q<ProjectRow>(`SELECT p.*, ${PROGRESS} FROM projects p ${w} ORDER BY ${sort.sql} LIMIT ${size} OFFSET ${offset}`, params)]);
  const total = Number(countRow?.n ?? 0);
  return { rows, total, page, size, sort };
}
export const getProjectById = (id: number) => one<ProjectRow>(`SELECT p.*, ${PROGRESS} FROM projects p WHERE p.id = $1`, [id]);
export const getProjectConfigs = (id: number) => q<ProjectConfig>("SELECT * FROM project_configurations WHERE project_id = $1 ORDER BY sort_order", [id]);
export const getProjectMilestones = (id: number) => q<ProjectMilestone>("SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY sort_order", [id]);

export interface ProjectInput {
  slug: string; name: string; developer_id: number | null; locality: string | null; status: string;
  possession: string | null; key_facts: { label: string; value: string }[]; amenities: string[]; rera: string | null; description: string | null;
  brochure: string | null; published: boolean;
  city: string | null; address: string | null; size_range: string | null; price_from: number | null; featured: boolean; featured_order: number | null;
  highlights: string[]; faqs: { q: string; a: string }[]; location_highlights: string[]; seo_title: string | null; seo_description: string | null;
  show_developer_images: boolean;
  /** Every image by section; image, gallery, floor_plans and master_plan are derived from it. */
  media: ProjectMedia[];
  units: StoredUnit[];
  configurations: { type: string; area: string; price: string; note: string }[]; milestones: { title: string; date: string | null; done: boolean }[];
}

/** Fields a re-import may refresh or fill: changing one here marks it as edited so the import keeps the admin's value. */
const TRACKED = ["rera", "size_range", "key_facts", "amenities", "location_highlights", "address", "locality", "city", "description", "highlights", "faqs", "seo_title", "seo_description", "media", "developer"] as const;
/** Compares values the way they are stored: key order ignored (Postgres reorders jsonb keys), "" same as empty, images by their fields. */
const sortKeys = (v: unknown): unknown => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])])) : v);
const normMedia = (m: unknown) => ((m as ProjectMedia[] | null) ?? []).map((x) => ({ url: x.url, alt: x.alt, kind: x.kind, developer: !!x.developer, published: x.published !== false }));
const norm = (v: unknown, key?: string) => JSON.stringify(sortKeys(key === "media" ? normMedia(v) : v === "" || v === undefined ? null : v));
const UNIT_TRACKED = ["rera", "size_range", "configurations", "description", "highlights", "seo_title", "seo_description", "media", "label", "name"] as const;

/** Developer images follow the project's switch: on shows them all, off hides them all. */
function applyDeveloperSwitch(media: ProjectMedia[], show: boolean): ProjectMedia[] {
  return media.map((m) => (m.developer ? { ...m, published: show } : m));
}

export async function saveProject(id: number | null, p: ProjectInput): Promise<number> {
  let pid = id;
  const dev = p.developer_id ? await one<{ name: string }>("SELECT name FROM developers WHERE id = $1", [p.developer_id]) : null;
  const before = pid ? await getProjectById(pid) : null;
  // The switch changes every developer image at once; otherwise each image keeps its own "show" setting.
  const switched = before ? before.show_developer_images !== p.show_developer_images : p.show_developer_images;
  const media = switched ? applyDeveloperSwitch(p.media, p.show_developer_images) : p.media;
  const units = p.units.map((u) => {
    const old = before?.units?.find((x) => x.slug === u.slug);
    const um = switched ? applyDeveloperSwitch(u.media, p.show_developer_images) : u.media;
    const changed = old ? UNIT_TRACKED.filter((k) => norm((old as unknown as Record<string, unknown>)[k], k) !== norm((u as unknown as Record<string, unknown>)[k], k)) : [];
    return { ...u, media: um, edited: [...new Set([...(old?.edited ?? []), ...changed.filter((k) => k !== "media" || !switched)])] };
  });
  const d = fromMedia(media.filter((m) => m.published !== false));
  const vals: Record<string, unknown> = {
    slug: p.slug, name: p.name, developer: dev?.name ?? null, developer_id: p.developer_id, locality: p.locality, status: p.status, possession: p.possession,
    key_facts: p.key_facts, amenities: p.amenities, rera: p.rera, description: p.description, brochure: p.brochure, published: p.published,
    city: p.city, address: p.address, size_range: p.size_range, price_from: p.price_from, featured: p.featured, featured_order: p.featured_order,
    highlights: p.highlights, faqs: p.faqs, location_highlights: p.location_highlights, seo_title: p.seo_title, seo_description: p.seo_description,
    show_developer_images: p.show_developer_images, media, units, image: d.image, gallery: d.gallery, floor_plans: d.floor_plans, master_plan: d.master_plan, floor_plan: null,
  };
  const JSONB = new Set(["key_facts", "amenities", "highlights", "faqs", "location_highlights", "media", "units", "gallery", "floor_plans"]);
  const cols = Object.keys(vals);
  const arg = (c: string) => (JSONB.has(c) ? json(vals[c]) : vals[c]);
  if (pid && before) {
    const prev = before as unknown as Record<string, unknown>;
    const edited = new Set(before.edited_fields ?? []);
    for (const k of TRACKED) {
      if (k === "media" && switched) continue; // the switch alone is not an edit of the images
      if (norm(prev[k], k) !== norm(vals[k], k)) edited.add(k);
    }
    const oldConfigs = (await getProjectConfigs(pid)).map((c) => ({ type: c.type, area: c.area ?? "" }));
    if (norm(oldConfigs) !== norm(p.configurations.map((c) => ({ type: c.type, area: c.area })))) edited.add("configurations");
    vals.edited_fields = [...edited]; JSONB.add("edited_fields"); cols.push("edited_fields");
    await q(`UPDATE projects SET ${cols.map((c, i) => `${c}=$${i + 1}${JSONB.has(c) ? "::jsonb" : ""}`).join(", ")}, updated_at=now() WHERE id=$${cols.length + 1}`, [...cols.map(arg), pid]);
  } else {
    const r = await one<{ id: number }>(`INSERT INTO projects (${cols.join(", ")}) VALUES (${cols.map((c, i) => `$${i + 1}${JSONB.has(c) ? "::jsonb" : ""}`).join(", ")}) RETURNING id`, cols.map(arg));
    pid = r!.id;
  }
  await q("DELETE FROM project_configurations WHERE project_id = $1", [pid]);
  for (const [i, c] of p.configurations.entries()) await q("INSERT INTO project_configurations (project_id,type,area,price,note,sort_order) VALUES ($1,$2,$3,$4,$5,$6)", [pid, c.type, c.area || null, c.price || null, c.note || null, i]);
  await q("DELETE FROM project_milestones WHERE project_id = $1", [pid]);
  for (const [i, m] of p.milestones.entries()) await q("INSERT INTO project_milestones (project_id,title,date,done,sort_order) VALUES ($1,$2,$3,$4,$5)", [pid, m.title, m.date || null, m.done, i]);
  return pid!;
}

/** "Show developer images" from the projects list: flips every developer image of the project and its unit types. */
export async function setDeveloperImages(id: number, show: boolean) {
  const p = await getProjectById(id);
  if (!p) return;
  const media = applyDeveloperSwitch(p.media ?? [], show);
  const units = (p.units ?? []).map((u) => ({ ...u, media: applyDeveloperSwitch(u.media ?? [], show) }));
  const d = fromMedia(media.filter((m) => m.published !== false));
  await q("UPDATE projects SET show_developer_images=$1, media=$2::jsonb, units=$3::jsonb, image=$4, gallery=$5::jsonb, floor_plans=$6::jsonb, master_plan=$7, updated_at=now() WHERE id=$8",
    [show, json(media), json(units), d.image, json(d.gallery), json(d.floor_plans), d.master_plan, id]);
}

/** Lets the next re-import update these fields again (removes them from edited_fields). */
export async function releaseEditedFields(id: number, fields: string[]) {
  await q("UPDATE projects SET edited_fields = (SELECT COALESCE(jsonb_agg(f), '[]'::jsonb) FROM jsonb_array_elements_text(edited_fields) f WHERE NOT (f = ANY($1::text[]))), updated_at = now() WHERE id = $2", [fields, id]);
}

/* ---------------- Developers ---------------- */
export interface DeveloperRow { [key: string]: unknown; id: number; name: string; slug: string; website: string | null; logo_permission: boolean; description: string | null; projects: number; updated_at: Date }
export const listDevelopers = () => q<DeveloperRow>("SELECT d.*, (SELECT count(*)::int FROM projects p WHERE p.developer_id = d.id) AS projects FROM developers d ORDER BY d.name");
export const getDeveloper = (id: number) => one<DeveloperRow>("SELECT d.*, (SELECT count(*)::int FROM projects p WHERE p.developer_id = d.id) AS projects FROM developers d WHERE d.id = $1", [id]);
export interface DeveloperInput { name: string; slug: string; website: string | null; logo_permission: boolean; description: string | null }
export async function saveDeveloper(id: number | null, d: DeveloperInput): Promise<number> {
  if (id) {
    await q("UPDATE developers SET name=$1, slug=$2, website=$3, logo_permission=$4, description=$5, updated_at=now() WHERE id=$6", [d.name, d.slug, d.website, d.logo_permission, d.description, id]);
    // projects.developer keeps the display name in step with the developer record.
    await q("UPDATE projects SET developer = $1 WHERE developer_id = $2 AND developer IS DISTINCT FROM $1", [d.name, id]);
    return id;
  }
  return (await one<{ id: number }>("INSERT INTO developers (name, slug, website, logo_permission, description) VALUES ($1,$2,$3,$4,$5) RETURNING id", [d.name, d.slug, d.website, d.logo_permission, d.description]))!.id;
}
/** Moves a project to another developer and marks the developer as edited, so a re-import does not move it back. */
export async function moveProjectToDeveloper(projectId: number, developerId: number) {
  await q(`UPDATE projects p SET developer_id = d.id, developer = d.name, updated_at = now(),
    edited_fields = CASE WHEN p.edited_fields ? 'developer' THEN p.edited_fields ELSE p.edited_fields || '["developer"]'::jsonb END
    FROM developers d WHERE d.id = $1 AND p.id = $2`, [developerId, projectId]);
}

/* ---------------- Banners ---------------- */
export type BannerTheme = "dark" | "light";
export interface BannerRow { [key: string]: unknown; id: number; group: string; image: string | null; mobile_image: string | null; eyebrow: string | null; headline: string; line: string | null; cta_label: string | null; cta_href: string | null; show_text: boolean; focal_x: number; focal_y: number; theme: BannerTheme; active: boolean; start_date: string | Date | null; end_date: string | Date | null; sort_order: number; updated_at: Date }
export const listBanners = () => q<BannerRow>('SELECT * FROM banners ORDER BY "group", sort_order, id');
export const getBanner = (id: number) => one<BannerRow>("SELECT * FROM banners WHERE id = $1", [id]);
export interface BannerInput { group: string; image: string | null; mobile_image: string | null; eyebrow: string | null; headline: string; line: string | null; cta_label: string | null; cta_href: string | null; show_text: boolean; focal_x: number; focal_y: number; theme: BannerTheme; active: boolean; start_date: string | null; end_date: string | null }
const BANNER_COLS = ["group", "image", "mobile_image", "eyebrow", "headline", "line", "cta_label", "cta_href", "show_text", "focal_x", "focal_y", "theme", "active", "start_date", "end_date"] as const;
export async function saveBanner(id: number | null, b: BannerInput): Promise<number> {
  const values = BANNER_COLS.map((c) => b[c]);
  if (id) {
    await q(`UPDATE banners SET ${BANNER_COLS.map((c, i) => `"${c}"=$${i + 1}`).join(",")},updated_at=now() WHERE id=$${values.length + 1}`, [...values, id]);
    return id;
  }
  const next = await one<{ n: number }>('SELECT COALESCE(max(sort_order),-1)+1 AS n FROM banners WHERE "group" = $1', [b.group]);
  const r = await one<{ id: number }>(`INSERT INTO banners (${BANNER_COLS.map((c) => `"${c}"`).join(",")},sort_order) VALUES (${values.map((_, i) => `$${i + 1}`).join(",")},$${values.length + 1}) RETURNING id`, [...values, Number(next?.n ?? 0)]);
  return r!.id;
}
export async function reorderBanners(group: string, ids: number[]) {
  for (const [i, id] of ids.entries()) await q('UPDATE banners SET sort_order = $1, updated_at = now() WHERE id = $2 AND "group" = $3', [i, id, group]);
}

/* ---------------- Offers ---------------- */
export interface OfferRow { [key: string]: unknown; id: number; title: string; image: string | null; text: string | null; link: string | null; property_id: number | null; project_id: number | null; active: boolean; start_date: string | Date | null; end_date: string | Date | null; updated_at: Date; property_title?: string | null; project_name?: string | null; section: OfferSection }
/** property: Properties page and home page; home_loan: the Home Loans page only. */
export type OfferSection = "property" | "home_loan";
export const listOffers = (section: OfferSection = "property") => q<OfferRow>("SELECT o.*, p.title AS property_title, j.name AS project_name FROM offers o LEFT JOIN properties p ON p.id = o.property_id LEFT JOIN projects j ON j.id = o.project_id WHERE o.section = $1 ORDER BY o.active DESC, o.updated_at DESC", [section]);
export const getOffer = (id: number) => one<OfferRow>("SELECT * FROM offers WHERE id = $1", [id]);
export interface OfferInput { section: OfferSection; title: string; image: string | null; text: string | null; link: string | null; property_id: number | null; project_id: number | null; active: boolean; start_date: string | null; end_date: string | null }
export async function saveOffer(id: number | null, o: OfferInput): Promise<number> {
  if (id) {
    await q("UPDATE offers SET title=$1,image=$2,text=$3,link=$4,property_id=$5,project_id=$6,active=$7,start_date=$8,end_date=$9,updated_at=now() WHERE id=$10", [o.title, o.image, o.text, o.link, o.property_id, o.project_id, o.active, o.start_date, o.end_date, id]);
    return id;
  }
  const r = await one<{ id: number }>("INSERT INTO offers (title,image,text,link,property_id,project_id,active,start_date,end_date,section) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id", [o.title, o.image, o.text, o.link, o.property_id, o.project_id, o.active, o.start_date, o.end_date, o.section]);
  return r!.id;
}

/* ---------------- Blog ---------------- */
export interface BlogRow { [key: string]: unknown; id: number; slug: string; title: string; category: string | null; author: string | null; cover: string | null; excerpt: string | null; body: string; meta_title: string | null; meta_description: string | null; status: string; published_at: Date | null; created_at: Date; updated_at: Date; author_id: number | null; writer_role: string | null; writer_level: string | null; writer_photo: string | null }
/** The linked writer (staff posts) without a JOIN, so the list's unqualified WHERE and ORDER BY columns stay unambiguous. */
const WRITER = "(SELECT u.role FROM users u WHERE u.id = blog_posts.author_id) AS writer_role, (SELECT u.level FROM users u WHERE u.id = blog_posts.author_id) AS writer_level, (SELECT u.photo FROM users u WHERE u.id = blog_posts.author_id) AS writer_photo";
const BLOG_SORT: Record<string, string> = { title: "title", category: "category", author: "author", status: "status", updated_at: "updated_at", published_at: "published_at" };
export async function listBlogPosts(sp: SP) {
  const where: string[] = []; const params: unknown[] = [];
  if (sp.q) { params.push(like(sp.q)); where.push(`(title ILIKE $${params.length} OR author ILIKE $${params.length})`); }
  if (sp.category) { params.push(sp.category); where.push(`category = $${params.length}`); }
  if (sp.status) { params.push(sp.status); where.push(`status = $${params.length}`); }
  if (sp.writer === "staff") where.push("author_id IS NOT NULL");
  else if (sp.writer === "office") where.push("author_id IS NULL");
  else if (sp.writer && /^\d+$/.test(sp.writer)) { params.push(Number(sp.writer)); where.push(`author_id = $${params.length}`); }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sort = sortOf(sp, BLOG_SORT, "updated_at");
  const { page, size, offset } = pageOf(sp);
  // Count and page rows in parallel: one round trip to the database instead of two.
  const [countRow, rows] = await Promise.all([one<{ n: number }>(`SELECT count(*)::int AS n FROM blog_posts ${w}`, params), q<BlogRow>(`SELECT *, ${WRITER} FROM blog_posts ${w} ORDER BY ${sort.sql} LIMIT ${size} OFFSET ${offset}`, params)]);
  const total = Number(countRow?.n ?? 0);
  return { rows, total, page, size, sort };
}
export const getBlogPost = (id: number) => one<BlogRow>(`SELECT *, ${WRITER} FROM blog_posts WHERE id = $1`, [id]);
export const blogCategories = async () => (await q<{ category: string }>("SELECT DISTINCT category FROM blog_posts WHERE category IS NOT NULL ORDER BY category")).map((r) => r.category);
export interface BlogInput { slug: string; title: string; category: string | null; author: string | null; cover: string | null; excerpt: string | null; body: string; meta_title: string | null; meta_description: string | null; status: string; /** Set on create for staff posts; an edit never changes the writer. */ author_id?: number | null }
export async function saveBlogPost(id: number | null, b: BlogInput): Promise<number> {
  if (id) {
    await q("UPDATE blog_posts SET slug=$1,title=$2,category=$3,author=$4,cover=$5,excerpt=$6,body=$7,meta_title=$8,meta_description=$9,status=$10,published_at=CASE WHEN $10='Published' THEN COALESCE(published_at, now()) ELSE published_at END,updated_at=now() WHERE id=$11", [b.slug, b.title, b.category, b.author, b.cover, b.excerpt, b.body, b.meta_title, b.meta_description, b.status, id]);
    return id;
  }
  const r = await one<{ id: number }>("INSERT INTO blog_posts (slug,title,category,author,cover,excerpt,body,meta_title,meta_description,status,published_at,author_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CASE WHEN $10='Published' THEN now() ELSE NULL END,$11) RETURNING id", [b.slug, b.title, b.category, b.author, b.cover, b.excerpt, b.body, b.meta_title, b.meta_description, b.status, b.author_id ?? null]);
  return r!.id;
}

/** A staff writer's byline: name, designation and passport photo. */
export async function getWriter(userId: number) {
  const u = await one<{ name: string; role: string; level: string; photo: string | null }>("SELECT name, role, level, photo FROM users WHERE id = $1", [userId]);
  return u ? { name: u.name, title: levelLabel(u.role, u.level), photo: u.photo } : null;
}
export const listMyPosts = (userId: number) => q<{ id: number; slug: string; title: string; status: string; category: string | null; updated_at: Date; published_at: Date | null }>(
  "SELECT id, slug, title, status, category, updated_at, published_at FROM blog_posts WHERE author_id = $1 ORDER BY updated_at DESC", [userId]);
