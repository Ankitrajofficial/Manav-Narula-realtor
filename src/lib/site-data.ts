import "server-only";
export { offerCta } from "./format";
import { one, q } from "./db";
import { LOCALITY_ORDER, type LocalityOption } from "./localities";
import type { Property } from "@/data/properties";
import type { Project } from "@/data/projects";
import type { Article } from "@/data/content";
import { faqGroups as staticFaqs } from "@/data/content";
import { banners as staticBanners, offer as staticOffer, site } from "@/data/site";

/** Public-site loaders. Every one reads the shared database the consoles write to. */

interface PropertyRow {
  id: number; slug: string; title: string; type: Property["type"]; purpose: Property["purpose"]; locality: string | null; street: string | null; city: string | null; price: string | number;
  bhk: number | null; baths: number | null; area: string | number; area_unit: Property["areaUnit"]; floor: string | null; facing: string | null;
  furnishing: string | null; parking: string | null; possession: string | null; status: Property["status"]; description: string | null;
  long_description: string | null; amenities: string[]; trust: Property["trust"]; rera: string | null; nearby: { name: string; distance: string }[];
  featured: boolean; images: string[] | null;
}

const PROPERTY_SELECT = `SELECT p.*, (SELECT json_agg(url ORDER BY is_cover DESC, sort_order) FROM property_images i WHERE i.property_id = p.id) AS images FROM properties p`;

function mapProperty(r: PropertyRow): Property {
  return {
    id: r.id, slug: r.slug, title: r.title, type: r.type, purpose: r.purpose, locality: r.locality ?? "", street: r.street ?? undefined, city: r.city ?? "Jalandhar", price: Number(r.price),
    bhk: r.bhk ?? undefined, baths: r.baths ?? undefined, area: Number(r.area), areaUnit: r.area_unit, floor: r.floor ?? undefined, facing: r.facing ?? "",
    furnishing: r.furnishing ?? undefined, parking: r.parking ?? undefined, possession: r.possession ?? "", status: r.status, description: r.description ?? "",
    longDescription: (r.long_description ?? "").split(/\n{2,}/).filter(Boolean), amenities: r.amenities ?? [], trust: r.trust ?? [], rera: r.rera ?? undefined,
    nearby: r.nearby ?? [], featured: r.featured, images: r.images && r.images.length ? r.images : ["photo-1600596542815-ffad4c1539a9"],
  };
}

export async function getProperties(): Promise<Property[]> {
  const rows = await q<PropertyRow>(`${PROPERTY_SELECT} WHERE p.published = true ORDER BY p.featured DESC, p.updated_at DESC`);
  return rows.map(mapProperty);
}
export async function getFeaturedProperties(): Promise<Property[]> {
  const all = await getProperties();
  return all.filter((p) => p.featured).slice(0, 8);
}
export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const r = await one<PropertyRow>(`${PROPERTY_SELECT} WHERE p.slug = $1 AND p.published = true`, [slug]);
  return r ? mapProperty(r) : null;
}
export async function localityCounts(): Promise<Record<string, number>> {
  const rows = await q<{ locality: string; n: number }>("SELECT locality, count(*)::int AS n FROM properties WHERE published = true AND locality IS NOT NULL GROUP BY locality");
  return Object.fromEntries(rows.map((r) => [r.locality, Number(r.n)]));
}

interface ProjectRow {
  id: number; slug: string; name: string; developer: string | null; locality: string | null; status: Project["status"]; image: string | null; gallery: string[];
  starting_price: string | null; possession: string | null; key_facts: { label: string; value: string }[]; amenities: string[]; rera: string | null;
  description: string | null; brochure: string | null; master_plan: string | null; configurations: { type: string; area: string; price: string }[] | null;
  milestones: { label: string; done: boolean }[] | null;
}
const PROJECT_SELECT = `SELECT p.*,
  (SELECT json_agg(json_build_object('type', type, 'area', area, 'price', price) ORDER BY sort_order) FROM project_configurations c WHERE c.project_id = p.id) AS configurations,
  (SELECT json_agg(json_build_object('label', title, 'done', done) ORDER BY sort_order) FROM project_milestones m WHERE m.project_id = p.id) AS milestones
  FROM projects p`;

function mapProject(r: ProjectRow): Project {
  const milestones = r.milestones ?? [];
  const progress = milestones.length ? Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100) : 0;
  return {
    id: r.id, slug: r.slug, name: r.name, developer: r.developer ?? "", locality: r.locality ?? "", status: r.status, image: r.image ?? "photo-1600607687939-ce8a6c25118c",
    gallery: r.gallery?.length ? r.gallery : [r.image ?? "photo-1600607687939-ce8a6c25118c"], configurations: r.configurations ?? [], startingPrice: r.starting_price ?? "", possession: r.possession ?? "",
    progress, milestones, keyFacts: r.key_facts ?? [], amenities: r.amenities ?? [], rera: r.rera ?? "", description: (r.description ?? "").split(/\n{2,}/).filter(Boolean), brochure: r.brochure ?? "#",
  };
}
export async function getProjects(): Promise<Project[]> {
  return (await q<ProjectRow>(`${PROJECT_SELECT} WHERE p.published = true ORDER BY p.updated_at DESC`)).map(mapProject);
}
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const r = await one<ProjectRow>(`${PROJECT_SELECT} WHERE p.slug = $1 AND p.published = true`, [slug]);
  return r ? mapProject(r) : null;
}

export interface Banner { id: string; image: string; headline: string; line: string; cta: { label: string; href: string } }
interface BannerRow { id: number; image: string | null; headline: string; line: string | null; cta_label: string | null; cta_href: string | null }
const SCHEDULED = "active = true AND (start_date IS NULL OR start_date <= current_date) AND (end_date IS NULL OR end_date >= current_date)";
export async function getBanners(): Promise<Banner[]> {
  const rows = await q<BannerRow>(`SELECT id, image, headline, line, cta_label, cta_href FROM banners WHERE "group" = 'carousel' AND ${SCHEDULED} ORDER BY sort_order`);
  if (!rows.length) return staticBanners;
  return rows.map((b) => ({ id: String(b.id), image: b.image ?? "", headline: b.headline, line: b.line ?? "", cta: { label: b.cta_label ?? "View properties", href: b.cta_href ?? "/properties" } }));
}
export async function getOfferBanner(): Promise<Banner> {
  const b = await one<BannerRow>(`SELECT id, image, headline, line, cta_label, cta_href FROM banners WHERE "group" = 'offer' AND ${SCHEDULED} ORDER BY sort_order LIMIT 1`);
  if (!b) return { id: "static", image: staticOffer.image, headline: staticOffer.headline, line: staticOffer.line, cta: staticOffer.cta };
  return { id: String(b.id), image: b.image ?? "", headline: b.headline, line: b.line ?? "", cta: { label: b.cta_label ?? "Enquire", href: b.cta_href ?? "/contact" } };
}
export interface Offer { id: number; title: string; image: string | null; text: string | null; href: string }
export async function getActiveOffers(): Promise<Offer[]> {
  const rows = await q<{ id: number; title: string; image: string | null; text: string | null; link: string | null; pslug: string | null; jslug: string | null }>(
    `SELECT o.id, o.title, o.image, o.text, o.link, p.slug AS pslug, j.slug AS jslug FROM offers o LEFT JOIN properties p ON p.id = o.property_id LEFT JOIN projects j ON j.id = o.project_id WHERE o.${SCHEDULED} ORDER BY o.updated_at DESC`);
  return rows.map((r) => ({ id: r.id, title: r.title, image: r.image, text: r.text, href: r.pslug ? `/properties/${r.pslug}` : r.jslug ? `/projects/${r.jslug}` : r.link || "/contact" }));
}

interface ArticleRow { id: number; slug: string; title: string; category: string | null; author: string | null; cover: string | null; excerpt: string | null; body: string; published_at: Date | null }
const mapArticle = (r: ArticleRow): Article => ({ id: r.id, slug: r.slug, title: r.title, category: r.category ?? "General", date: (r.published_at ? new Date(r.published_at) : new Date()).toISOString(), author: r.author ?? site.name, cover: r.cover ?? "photo-1600596542815-ffad4c1539a9", excerpt: r.excerpt ?? "", body: [r.body] });
export async function getArticles(): Promise<Article[]> {
  return (await q<ArticleRow>("SELECT id, slug, title, category, author, cover, excerpt, body, published_at FROM blog_posts WHERE status = 'Published' ORDER BY published_at DESC")).map(mapArticle);
}
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const r = await one<ArticleRow>("SELECT id, slug, title, category, author, cover, excerpt, body, published_at FROM blog_posts WHERE slug = $1 AND status = 'Published'", [slug]);
  return r ? mapArticle(r) : null;
}

export interface Business { name: string; tagline: string; phone: string; whatsapp: string; email: string; address: string; hours: string; rera: string; rating: number; reviews: number; instagram: string; facebook: string; youtube: string }
export async function getBusiness(): Promise<Business> {
  const fallback: Business = { name: site.name, tagline: site.tagline, phone: site.phone, whatsapp: "+919012290522", email: site.email, address: site.address, hours: site.hours, rera: site.rera, rating: site.rating, reviews: site.reviews, instagram: site.social.instagram, facebook: site.social.facebook, youtube: site.social.youtube };
  const row = await one<{ value: Partial<Business> }>("SELECT value FROM settings WHERE key = 'business'");
  return { ...fallback, ...(row?.value ?? {}) };
}
export const phoneHref = (b: Business) => `tel:${b.phone.replace(/[^\d+]/g, "")}`;
export const whatsappHref = (b: Business) => `https://wa.me/${b.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hello, I want to enquire about a property.")}`;

export async function getFaqGroups() {
  const row = await one<{ value: typeof staticFaqs }>("SELECT value FROM settings WHERE key = 'faqs'");
  return row?.value?.length ? row.value : staticFaqs;
}

/** Image src helper: accepts an Unsplash photo id, a full URL or an /uploads path. */
export function imageSrc(v: string, w = 1200, h = 900): string {
  if (/^https?:\/\//.test(v) || v.startsWith("/")) return v;
  return `https://images.unsplash.com/${v}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

export interface PartnerBank { id: number; name: string; logo: string | null; tagline: string | null }
export async function getPartnerBanks(): Promise<PartnerBank[]> {
  return q<PartnerBank>("SELECT id, name, logo_url AS logo, tagline FROM partner_banks WHERE is_active = true ORDER BY sort_order, id");
}

export interface PageVideo { id: number; youtubeId: string; title: string | null }
export async function getPageVideos(page: string): Promise<PageVideo[]> {
  return q<PageVideo>(`SELECT id, youtube_id AS "youtubeId", title FROM page_videos WHERE page_key = $1 AND is_active = true ORDER BY sort_order, id LIMIT 4`, [page]);
}

/** Active localities that have at least one published property, with the count, in zone order (website filters). */
export async function getLocalityFilterOptions(): Promise<LocalityOption[]> {
  return q<LocalityOption>(`SELECT l.name, l.zone, count(p.id)::int AS count FROM localities l JOIN properties p ON p.locality = l.name AND p.published = true WHERE l.is_active GROUP BY l.id ORDER BY ${LOCALITY_ORDER}`);
}
/** Active localities with their published-property counts, busiest first (home page). */
export async function getLocalitiesServed(limit = 10): Promise<LocalityOption[]> {
  return q<LocalityOption>(`SELECT l.name, l.zone, (SELECT count(*)::int FROM properties p WHERE p.published AND p.locality = l.name) AS count FROM localities l WHERE l.is_active ORDER BY count DESC, ${LOCALITY_ORDER} LIMIT ${Number(limit)}`);
}

/** Public address line: Street/Block, Locality, City. House/plot number, pincode and map link stay private. */
export const publicAddress = (p: Pick<Property, "street" | "locality" | "city">) => [p.street, p.locality, p.city || "Jalandhar"].filter(Boolean).join(", ");
