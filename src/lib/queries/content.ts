import "server-only";
import { json, one, q } from "@/lib/db";
import { pageOf, sortOf } from "@/lib/console";

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
  created_at: Date; updated_at: Date; cover: string | null;
}
export interface PropertyImage { [key: string]: unknown; id: number; property_id: number; url: string; sort_order: number; is_cover: boolean }

const PROPERTY_SORT: Record<string, string> = { title: "p.title", price: "p.price", updated_at: "p.updated_at", locality: "p.locality", type: "p.type", status: "p.status" };
const COVER = "(SELECT url FROM property_images i WHERE i.property_id = p.id ORDER BY i.is_cover DESC, i.sort_order ASC LIMIT 1) AS cover";

export async function listProperties(sp: SP) {
  const where: string[] = []; const params: unknown[] = [];
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
  const rows = await q<PropertyRow>(`SELECT p.*, ${COVER} FROM properties p ${w} ORDER BY ${sort.sql} LIMIT ${size} OFFSET ${offset}`, params);
  const total = Number((await one<{ n: number }>(`SELECT count(*)::int AS n FROM properties p ${w}`, params))?.n ?? 0);
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
}

export async function insertProperty(p: PropertyInput): Promise<number> {
  const r = await one<{ id: number }>(
    `INSERT INTO properties (slug,title,type,purpose,locality,project_id,price,bhk,baths,area,area_unit,super_area,floor,facing,furnishing,parking,possession,status,description,long_description,amenities,trust,rera,nearby,featured,published,meta_title,meta_description,address_line,street,city,pincode,maps_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb,$22::jsonb,$23,$24::jsonb,$25,$26,$27,$28,$29,$30,$31,$32,$33) RETURNING id`,
    [p.slug, p.title, p.type, p.purpose, p.locality, p.project_id, p.price, p.bhk, p.baths, p.area, p.area_unit, p.super_area, p.floor, p.facing, p.furnishing, p.parking, p.possession, p.status, p.description, p.long_description, json(p.amenities), json(p.trust), p.rera, json(p.nearby), p.featured, p.published, p.meta_title, p.meta_description, p.address_line, p.street, p.city, p.pincode, p.maps_url]);
  return r!.id;
}

export async function updateProperty(id: number, p: PropertyInput) {
  await q(
    `UPDATE properties SET slug=$1,title=$2,type=$3,purpose=$4,locality=$5,project_id=$6,price=$7,bhk=$8,baths=$9,area=$10,area_unit=$11,super_area=$12,floor=$13,facing=$14,furnishing=$15,parking=$16,possession=$17,status=$18,description=$19,long_description=$20,amenities=$21::jsonb,trust=$22::jsonb,rera=$23,nearby=$24::jsonb,featured=$25,published=$26,meta_title=$27,meta_description=$28,address_line=$29,street=$30,city=$31,pincode=$32,maps_url=$33,updated_at=now() WHERE id=$34`,
    [p.slug, p.title, p.type, p.purpose, p.locality, p.project_id, p.price, p.bhk, p.baths, p.area, p.area_unit, p.super_area, p.floor, p.facing, p.furnishing, p.parking, p.possession, p.status, p.description, p.long_description, json(p.amenities), json(p.trust), p.rera, json(p.nearby), p.featured, p.published, p.meta_title, p.meta_description, p.address_line, p.street, p.city, p.pincode, p.maps_url, id]);
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
  progress?: number; milestones_total?: number; milestones_done?: number;
}
export interface ProjectConfig { [key: string]: unknown; id: number; project_id: number; type: string; area: string | null; price: string | null; sort_order: number }
export interface ProjectMilestone { [key: string]: unknown; id: number; project_id: number; title: string; date: string | Date | null; done: boolean; sort_order: number }

const PROJECT_SORT: Record<string, string> = { name: "p.name", locality: "p.locality", status: "p.status", updated_at: "p.updated_at", starting_price: "p.starting_price" };
const PROGRESS = "COALESCE((SELECT round(100.0 * count(*) FILTER (WHERE done) / NULLIF(count(*),0)) FROM project_milestones m WHERE m.project_id = p.id), 0)::int AS progress";

export async function listProjects(sp: SP) {
  const where: string[] = []; const params: unknown[] = [];
  if (sp.q) { params.push(like(sp.q)); where.push(`(p.name ILIKE $${params.length} OR p.locality ILIKE $${params.length} OR p.developer ILIKE $${params.length})`); }
  if (sp.status) { params.push(sp.status); where.push(`p.status = $${params.length}`); }
  if (sp.published === "1") where.push("p.published = true");
  if (sp.published === "0") where.push("p.published = false");
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sort = sortOf(sp, PROJECT_SORT, "updated_at");
  const { page, size, offset } = pageOf(sp);
  const rows = await q<ProjectRow>(`SELECT p.*, ${PROGRESS} FROM projects p ${w} ORDER BY ${sort.sql} LIMIT ${size} OFFSET ${offset}`, params);
  const total = Number((await one<{ n: number }>(`SELECT count(*)::int AS n FROM projects p ${w}`, params))?.n ?? 0);
  return { rows, total, page, size, sort };
}
export const getProjectById = (id: number) => one<ProjectRow>(`SELECT p.*, ${PROGRESS} FROM projects p WHERE p.id = $1`, [id]);
export const getProjectConfigs = (id: number) => q<ProjectConfig>("SELECT * FROM project_configurations WHERE project_id = $1 ORDER BY sort_order", [id]);
export const getProjectMilestones = (id: number) => q<ProjectMilestone>("SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY sort_order", [id]);

export interface ProjectInput {
  slug: string; name: string; developer: string | null; locality: string | null; status: string; image: string | null; gallery: string[]; starting_price: string | null;
  possession: string | null; key_facts: { label: string; value: string }[]; amenities: string[]; rera: string | null; description: string | null;
  brochure: string | null; master_plan: string | null; floor_plan: string | null; published: boolean;
  configurations: { type: string; area: string; price: string }[]; milestones: { title: string; date: string | null; done: boolean }[];
}

export async function saveProject(id: number | null, p: ProjectInput): Promise<number> {
  let pid = id;
  if (pid) {
    await q(`UPDATE projects SET slug=$1,name=$2,developer=$3,locality=$4,status=$5,image=$6,gallery=$7::jsonb,starting_price=$8,possession=$9,key_facts=$10::jsonb,amenities=$11::jsonb,rera=$12,description=$13,brochure=$14,master_plan=$15,floor_plan=$16,published=$17,updated_at=now() WHERE id=$18`,
      [p.slug, p.name, p.developer, p.locality, p.status, p.image, json(p.gallery), p.starting_price, p.possession, json(p.key_facts), json(p.amenities), p.rera, p.description, p.brochure, p.master_plan, p.floor_plan, p.published, pid]);
  } else {
    const r = await one<{ id: number }>(`INSERT INTO projects (slug,name,developer,locality,status,image,gallery,starting_price,possession,key_facts,amenities,rera,description,brochure,master_plan,floor_plan,published) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14,$15,$16,$17) RETURNING id`,
      [p.slug, p.name, p.developer, p.locality, p.status, p.image, json(p.gallery), p.starting_price, p.possession, json(p.key_facts), json(p.amenities), p.rera, p.description, p.brochure, p.master_plan, p.floor_plan, p.published]);
    pid = r!.id;
  }
  await q("DELETE FROM project_configurations WHERE project_id = $1", [pid]);
  for (const [i, c] of p.configurations.entries()) await q("INSERT INTO project_configurations (project_id,type,area,price,sort_order) VALUES ($1,$2,$3,$4,$5)", [pid, c.type, c.area || null, c.price || null, i]);
  await q("DELETE FROM project_milestones WHERE project_id = $1", [pid]);
  for (const [i, m] of p.milestones.entries()) await q("INSERT INTO project_milestones (project_id,title,date,done,sort_order) VALUES ($1,$2,$3,$4,$5)", [pid, m.title, m.date || null, m.done, i]);
  return pid!;
}

/* ---------------- Banners ---------------- */
export interface BannerRow { [key: string]: unknown; id: number; group: string; image: string | null; headline: string; line: string | null; cta_label: string | null; cta_href: string | null; active: boolean; start_date: string | Date | null; end_date: string | Date | null; sort_order: number; updated_at: Date }
export const listBanners = () => q<BannerRow>('SELECT * FROM banners ORDER BY "group", sort_order, id');
export const getBanner = (id: number) => one<BannerRow>("SELECT * FROM banners WHERE id = $1", [id]);
export interface BannerInput { group: string; image: string | null; headline: string; line: string | null; cta_label: string | null; cta_href: string | null; active: boolean; start_date: string | null; end_date: string | null }
export async function saveBanner(id: number | null, b: BannerInput): Promise<number> {
  if (id) {
    await q('UPDATE banners SET "group"=$1,image=$2,headline=$3,line=$4,cta_label=$5,cta_href=$6,active=$7,start_date=$8,end_date=$9,updated_at=now() WHERE id=$10', [b.group, b.image, b.headline, b.line, b.cta_label, b.cta_href, b.active, b.start_date, b.end_date, id]);
    return id;
  }
  const next = await one<{ n: number }>('SELECT COALESCE(max(sort_order),-1)+1 AS n FROM banners WHERE "group" = $1', [b.group]);
  const r = await one<{ id: number }>('INSERT INTO banners ("group",image,headline,line,cta_label,cta_href,active,start_date,end_date,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [b.group, b.image, b.headline, b.line, b.cta_label, b.cta_href, b.active, b.start_date, b.end_date, Number(next?.n ?? 0)]);
  return r!.id;
}
export async function reorderBanners(group: string, ids: number[]) {
  for (const [i, id] of ids.entries()) await q('UPDATE banners SET sort_order = $1, updated_at = now() WHERE id = $2 AND "group" = $3', [i, id, group]);
}

/* ---------------- Offers ---------------- */
export interface OfferRow { [key: string]: unknown; id: number; title: string; image: string | null; text: string | null; link: string | null; property_id: number | null; project_id: number | null; active: boolean; start_date: string | Date | null; end_date: string | Date | null; updated_at: Date; property_title?: string | null; project_name?: string | null }
export const listOffers = () => q<OfferRow>("SELECT o.*, p.title AS property_title, j.name AS project_name FROM offers o LEFT JOIN properties p ON p.id = o.property_id LEFT JOIN projects j ON j.id = o.project_id ORDER BY o.active DESC, o.updated_at DESC");
export const getOffer = (id: number) => one<OfferRow>("SELECT * FROM offers WHERE id = $1", [id]);
export interface OfferInput { title: string; image: string | null; text: string | null; link: string | null; property_id: number | null; project_id: number | null; active: boolean; start_date: string | null; end_date: string | null }
export async function saveOffer(id: number | null, o: OfferInput): Promise<number> {
  if (id) {
    await q("UPDATE offers SET title=$1,image=$2,text=$3,link=$4,property_id=$5,project_id=$6,active=$7,start_date=$8,end_date=$9,updated_at=now() WHERE id=$10", [o.title, o.image, o.text, o.link, o.property_id, o.project_id, o.active, o.start_date, o.end_date, id]);
    return id;
  }
  const r = await one<{ id: number }>("INSERT INTO offers (title,image,text,link,property_id,project_id,active,start_date,end_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id", [o.title, o.image, o.text, o.link, o.property_id, o.project_id, o.active, o.start_date, o.end_date]);
  return r!.id;
}

/* ---------------- Blog ---------------- */
export interface BlogRow { [key: string]: unknown; id: number; slug: string; title: string; category: string | null; author: string | null; cover: string | null; excerpt: string | null; body: string; meta_title: string | null; meta_description: string | null; status: string; published_at: Date | null; created_at: Date; updated_at: Date }
const BLOG_SORT: Record<string, string> = { title: "title", category: "category", author: "author", status: "status", updated_at: "updated_at", published_at: "published_at" };
export async function listBlogPosts(sp: SP) {
  const where: string[] = []; const params: unknown[] = [];
  if (sp.q) { params.push(like(sp.q)); where.push(`(title ILIKE $${params.length} OR author ILIKE $${params.length})`); }
  if (sp.category) { params.push(sp.category); where.push(`category = $${params.length}`); }
  if (sp.status) { params.push(sp.status); where.push(`status = $${params.length}`); }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sort = sortOf(sp, BLOG_SORT, "updated_at");
  const { page, size, offset } = pageOf(sp);
  const rows = await q<BlogRow>(`SELECT * FROM blog_posts ${w} ORDER BY ${sort.sql} LIMIT ${size} OFFSET ${offset}`, params);
  const total = Number((await one<{ n: number }>(`SELECT count(*)::int AS n FROM blog_posts ${w}`, params))?.n ?? 0);
  return { rows, total, page, size, sort };
}
export const getBlogPost = (id: number) => one<BlogRow>("SELECT * FROM blog_posts WHERE id = $1", [id]);
export const blogCategories = async () => (await q<{ category: string }>("SELECT DISTINCT category FROM blog_posts WHERE category IS NOT NULL ORDER BY category")).map((r) => r.category);
export interface BlogInput { slug: string; title: string; category: string | null; author: string | null; cover: string | null; excerpt: string | null; body: string; meta_title: string | null; meta_description: string | null; status: string }
export async function saveBlogPost(id: number | null, b: BlogInput): Promise<number> {
  if (id) {
    await q("UPDATE blog_posts SET slug=$1,title=$2,category=$3,author=$4,cover=$5,excerpt=$6,body=$7,meta_title=$8,meta_description=$9,status=$10,published_at=CASE WHEN $10='Published' THEN COALESCE(published_at, now()) ELSE published_at END,updated_at=now() WHERE id=$11", [b.slug, b.title, b.category, b.author, b.cover, b.excerpt, b.body, b.meta_title, b.meta_description, b.status, id]);
    return id;
  }
  const r = await one<{ id: number }>("INSERT INTO blog_posts (slug,title,category,author,cover,excerpt,body,meta_title,meta_description,status,published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CASE WHEN $10='Published' THEN now() ELSE NULL END) RETURNING id", [b.slug, b.title, b.category, b.author, b.cover, b.excerpt, b.body, b.meta_title, b.meta_description, b.status]);
  return r!.id;
}
