import "server-only";
export { offerCta } from "./format";
import { formatPrice } from "./format";
import { one, q } from "./db";
import { LOCALITY_ORDER, type LocalityOption } from "./localities";
import { MAX_ACTIVE_STATS, type TrustStat } from "./trust-stats";
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

export interface PopupSettings { enabled: boolean; headline: string; text: string; delaySeconds: number }
export async function getPopupSettings(): Promise<PopupSettings> {
  const rows = await q<{ key: string; value: unknown }>("SELECT key, value FROM settings WHERE key IN ('popup_enabled','popup_headline','popup_text','popup_delay_seconds')");
  const v = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: v.popup_enabled !== false,
    headline: typeof v.popup_headline === "string" && v.popup_headline ? v.popup_headline : "Free property consultation",
    text: typeof v.popup_text === "string" && v.popup_text ? v.popup_text : "Tell us what you need. We will suggest 3 matching properties within 24 hours.",
    delaySeconds: Math.min(600, Math.max(0, Number(v.popup_delay_seconds ?? 20) || 0)),
  };
}

export interface Suggestion { slug: string; title: string; price: string; locality: string; image: string }
const BUDGET_RANGES: Record<string, [number, number]> = { "Under ₹50 L": [0, 50_00_000], "₹50 L to ₹1 Cr": [50_00_000, 1_00_00_000], "₹1 Cr to ₹2 Cr": [1_00_00_000, 2_00_00_000], "Above ₹2 Cr": [2_00_00_000, Infinity] };
/** Three published properties for the consultation pop-up: same purpose, then budget band and locality, topped up with featured ones. */
export async function suggestProperties(f: { interest: string | null; budget: string | null; locality: string | null }): Promise<Suggestion[]> {
  const all = await getProperties();
  const purpose = f.interest === "Rent" ? "Rent" : "Buy";
  const range = purpose === "Buy" && f.budget ? BUDGET_RANGES[f.budget] : undefined;
  const score = (p: Property) => (p.purpose === purpose ? 4 : 0) + (f.locality && p.locality === f.locality ? 2 : 0) + (range && p.price >= range[0] && p.price < range[1] ? 3 : 0);
  const matches = f.interest === "Sell" ? [] : all.filter((p) => p.purpose === purpose && score(p) > 4).sort((a, b) => score(b) - score(a) || Number(!!b.featured) - Number(!!a.featured));
  const fallback = all.filter((p) => !matches.includes(p)).sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || Number(b.purpose === purpose) - Number(a.purpose === purpose));
  return [...matches, ...fallback].slice(0, 3).map((p) => ({ slug: p.slug, title: p.title, price: formatPrice(p.price, p.purpose), locality: p.locality, image: imageSrc(p.images[0], 400, 300) }));
}

const DEFAULT_TRUST_STATS: TrustStat[] = [
  { value: "12", suffix: "+", label: "Years in Jalandhar", link: null, sort_order: 0, is_active: true },
  { value: "1500", suffix: "+", label: "Properties sold", link: null, sort_order: 1, is_active: true },
  { value: "20", suffix: "+", label: "Developer partners", link: null, sort_order: 2, is_active: true },
  { value: "2", suffix: "+", label: "Offices", link: null, sort_order: 3, is_active: true },
  { value: "4.8", suffix: "★", label: "Google rating (21 reviews)", link: site.reviewHref, sort_order: 4, is_active: true },
  { value: "30", suffix: "+", label: "Localities covered", link: null, sort_order: 5, is_active: true },
];
/** Active trust numbers in admin order (at most 6). */
export async function getTrustStats(): Promise<TrustStat[]> {
  const row = await one<{ value: TrustStat[] }>("SELECT value FROM settings WHERE key = 'trust_stats'");
  const list = Array.isArray(row?.value) ? row.value : DEFAULT_TRUST_STATS;
  return list.filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order).slice(0, MAX_ACTIVE_STATS);
}
export async function getFoundedYear(): Promise<number> {
  const row = await one<{ value: number | string }>("SELECT value FROM settings WHERE key = 'founded_year'");
  const y = Number(row?.value);
  return Number.isInteger(y) && y > 1900 ? y : site.foundedYear;
}
/** Puts the founding year into a tagline that says "since YYYY"; other taglines are left as they are. */
export const withFoundedYear = (tagline: string, year: number) => (/since \d{4}/i.test(tagline) ? tagline.replace(/since \d{4}/i, `since ${year}`) : tagline);
