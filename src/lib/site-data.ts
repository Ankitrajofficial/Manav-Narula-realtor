import "server-only";
export { offerCta } from "./format";
import { formatPrice } from "./format";
import { one, q } from "./db";
import { LOCALITY_ORDER, type LocalityOption } from "./localities";
import { MAX_ACTIVE_STATS, type TrustStat } from "./trust-stats";
import type { Property } from "@/data/properties";
import type { Project, ProjectMedia } from "@/data/projects";
import type { Article } from "@/data/content";
import { levelLabel } from "@/lib/growth";
import { AGI } from "@/lib/project-import";
import { faqGroups as staticFaqs } from "@/data/content";
import { banners as staticBanners, offer as staticOffer, site } from "@/data/site";

/**
 * Public-site loaders. Every one reads the shared database the consoles write to. Property RERA numbers stay in the
 * consoles; developer projects show their own Project RERA No. (the agent RERA number is not shown until confirmed).
 */

interface PropertyRow {
  id: number; slug: string; title: string; type: Property["type"]; purpose: Property["purpose"]; locality: string | null; street: string | null; city: string | null; price: string | number;
  bhk: number | null; baths: number | null; area: string | number; area_unit: Property["areaUnit"]; floor: string | null; facing: string | null;
  furnishing: string | null; parking: string | null; possession: string | null; status: Property["status"]; description: string | null;
  long_description: string | null; amenities: string[]; trust: Property["trust"]; rera: string | null; nearby: { name: string; distance: string }[];
  featured: boolean; images: string[] | null; master_plan: string | null; floor_plan: string | null; floor_plans: { url: string; label: string }[] | null; meta_title: string | null; meta_description: string | null;
}

const PROPERTY_SELECT = `SELECT p.*, (SELECT json_agg(url ORDER BY is_cover DESC, sort_order) FROM property_images i WHERE i.property_id = p.id) AS images FROM properties p`;

function mapProperty(r: PropertyRow): Property {
  return {
    id: r.id, slug: r.slug, title: r.title, type: r.type, purpose: r.purpose, locality: r.locality ?? "", street: r.street ?? undefined, city: r.city ?? "Jalandhar", price: Number(r.price),
    bhk: r.bhk ?? undefined, baths: r.baths ?? undefined, area: Number(r.area), areaUnit: r.area_unit, floor: r.floor ?? undefined, facing: r.facing ?? "",
    furnishing: r.furnishing ?? undefined, parking: r.parking ?? undefined, possession: r.possession ?? "", status: r.status, description: r.description ?? "",
    longDescription: (r.long_description ?? "").split(/\n{2,}/).filter(Boolean), amenities: r.amenities ?? [], trust: (r.trust ?? []).filter((t) => t !== "rera"), rera: undefined,
    nearby: r.nearby ?? [], featured: r.featured, images: r.images && r.images.length ? r.images : ["photo-1600596542815-ffad4c1539a9"],
    masterPlan: r.master_plan ?? undefined, floorPlans: [...(r.floor_plans ?? []), ...(r.floor_plan ? [{ url: r.floor_plan, label: "" }] : [])], metaTitle: r.meta_title ?? undefined, metaDescription: r.meta_description ?? undefined,
  };
}

export async function getProperties(): Promise<Property[]> {
  const rows = await q<PropertyRow>(`${PROPERTY_SELECT} WHERE p.published = true AND NOT EXISTS (SELECT 1 FROM projects pr WHERE pr.published AND pr.slug = ${MOVED_LISTINGS}) ORDER BY p.featured DESC, p.updated_at DESC`);
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
  description: string | null; brochure: string | null; master_plan: string | null; configurations: { type: string; area: string | null; price: string | null; note: string | null }[] | null;
  milestones: { label: string; done: boolean }[] | null;
  city: string | null; address: string | null; size_range: string | null; price_from: string | number | null; featured: boolean; highlights: string[] | null;
  faqs: { q: string; a: string }[] | null; location_highlights: string[] | null; floor_plans: { url: string; label: string }[] | null; seo_title: string | null; seo_description: string | null;
  media: ProjectMedia[] | null; units: StoredUnit[] | null; developer_slug: string | null; published: boolean;
}
interface StoredUnit {
  slug: string; label: string; name: string; rera: string | null; rera_source?: string; configurations: string[] | null; size_range: string | null;
  description: string | null; highlights: string[] | null; seo_title: string | null; seo_description: string | null; media: ProjectMedia[] | null;
}
/** Images shown on the site: hidden ones (developer images without permission, or switched off in admin) are left out. */
const visible = (media: ProjectMedia[] | null | undefined, hidden = false) => (media ?? []).filter((m) => m.url && (hidden || m.published !== false));
/** Drafts and hidden developer images are included only in an admin's preview (see lib/preview.ts). */
type View = { drafts?: boolean; hiddenImages?: boolean } | boolean;
const viewOf = (v: View) => (typeof v === "boolean" ? { drafts: v, hiddenImages: false } : { drafts: !!v.drafts, hiddenImages: !!v.hiddenImages });
/** The project's images by section; projects saved before media existed get it built from their image fields. */
function projectMedia(r: ProjectRow, hidden = false): ProjectMedia[] {
  if (r.media?.length) return visible(r.media, hidden);
  const shots = [...new Set([r.image, ...(r.gallery ?? [])].filter((u): u is string => !!u))];
  return [
    ...shots.map((url, i) => ({ url, alt: `${r.name}${i ? `, photo ${i + 1}` : ""}`, kind: "elevation" as const })),
    ...(r.floor_plans ?? []).map((p) => ({ url: p.url, alt: p.label || `${r.name} floor plan`, kind: "floor-plan" as const })),
    ...(r.master_plan ? [{ url: r.master_plan, alt: `${r.name} master plan`, kind: "master-plan" as const }] : []),
  ];
}
const PROJECT_SELECT = `SELECT p.*, (SELECT d.slug FROM developers d WHERE d.id = p.developer_id) AS developer_slug,
  (SELECT json_agg(json_build_object('type', type, 'area', area, 'price', price, 'note', note) ORDER BY sort_order) FROM project_configurations c WHERE c.project_id = p.id) AS configurations,
  (SELECT json_agg(json_build_object('label', title, 'done', done) ORDER BY sort_order) FROM project_milestones m WHERE m.project_id = p.id) AS milestones
  FROM projects p`;

function mapProject(r: ProjectRow, hidden = false): Project {
  const media = projectMedia(r, hidden);
  // With a media list, the hero, gallery and plans come only from the images that may be shown.
  if (r.media?.length) {
    const shown = media.filter((m) => m.kind === "elevation" || m.kind === "interior" || m.kind === "gallery");
    r = { ...r, image: (media.find((m) => m.kind === "elevation") ?? shown[0])?.url ?? null, gallery: shown.map((m) => m.url),
      floor_plans: media.filter((m) => m.kind === "floor-plan").map((m) => ({ url: m.url, label: m.alt })), master_plan: media.find((m) => m.kind === "master-plan")?.url ?? null };
  }
  const milestones = r.milestones ?? [];
  const progress = milestones.length ? Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100) : 0;
  return {
    id: r.id, slug: r.slug, name: r.name, developer: r.developer ?? "", locality: r.locality ?? "", status: r.status, image: r.image || null,
    gallery: (r.gallery ?? []).filter(Boolean), configurations: (r.configurations ?? []).map((c) => ({ type: c.type, area: c.area ?? "", price: c.price ?? "", note: c.note ?? undefined })),
    startingPrice: r.starting_price ?? "", possession: r.possession ?? "",
    progress, milestones, keyFacts: (r.key_facts ?? []).filter((f) => !/rera/i.test(f.label)), amenities: r.amenities ?? [], rera: r.rera ?? "",
    description: (r.description ?? "").split(/\n{2,}/).filter(Boolean), brochure: r.brochure ?? "",
    city: r.city ?? "Jalandhar", address: r.address ?? undefined, sizeRange: r.size_range ?? undefined, priceFrom: r.price_from == null ? null : Number(r.price_from), featured: r.featured,
    highlights: r.highlights ?? [], faqs: r.faqs ?? [], locationHighlights: r.location_highlights ?? [], floorPlans: r.floor_plans ?? [], masterPlan: r.master_plan ?? undefined,
    media, seoTitle: r.seo_title ?? undefined, seoDescription: r.seo_description ?? undefined,
    developerSlug: r.developer_slug ?? undefined, published: r.published,
    units: (r.units ?? []).map((u) => ({
      slug: u.slug, label: u.label, name: u.name, rera: u.rera ?? r.rera ?? "", reraSource: u.rera_source, configurations: u.configurations ?? [],
      sizeRange: u.size_range ?? undefined, description: (u.description ?? "").split(/\n{2,}/).filter(Boolean), highlights: u.highlights ?? [],
      seoTitle: u.seo_title ?? undefined, seoDescription: u.seo_description ?? undefined, media: visible(u.media, hidden),
    })),
  };
}
/** Published projects; `drafts` (an admin's preview) includes unpublished ones. */
export async function getProjects(view: View = false): Promise<Project[]> {
  const v = viewOf(view);
  return (await q<ProjectRow>(`${PROJECT_SELECT}${v.drafts ? "" : " WHERE p.published = true"} ORDER BY p.featured DESC, p.featured_order ASC NULLS LAST, p.name`)).map((r) => mapProject(r, v.hiddenImages));
}
/** Published projects marked featured, in the admin's order: the homepage "Featured properties" strip. */
export async function getFeaturedProjects(): Promise<Project[]> {
  return (await q<ProjectRow>(`${PROJECT_SELECT} WHERE p.published = true AND p.featured = true ORDER BY p.featured_order ASC NULLS LAST, p.name`)).map((r) => mapProject(r));
}

/**
 * AGI projects used to be property listings. Once a listing's project is published, the listing drops out of the property
 * lists and its old address sends visitors (and search engines) to the project page.
 */
const MOVED_LISTINGS = `CASE p.slug ${AGI.map((a) => `WHEN '${a.from}' THEN '${a.slug}'`).join(" ")} END`;
export async function movedListingTarget(propertySlug: string): Promise<string | null> {
  const target = AGI.find((a) => a.from === propertySlug)?.slug;
  if (!target) return null;
  return (await one<{ slug: string }>("SELECT slug FROM projects WHERE slug = $1 AND published = true", [target]))?.slug ?? null;
}
/** A published project; `drafts` (an admin's preview) also returns unpublished ones. */
export async function getProjectBySlug(slug: string, view: View = false): Promise<Project | null> {
  const v = viewOf(view);
  const r = await one<ProjectRow>(`${PROJECT_SELECT} WHERE p.slug = $1${v.drafts ? "" : " AND p.published = true"}`, [slug]);
  return r ? mapProject(r, v.hiddenImages) : null;
}

export interface Developer { id: number; name: string; slug: string; website: string | null; description: string | null }
export async function getDeveloperBySlug(slug: string): Promise<Developer | null> {
  return one<Developer>("SELECT id, name, slug, website, description FROM developers WHERE slug = $1", [slug]);
}
/** A developer's projects, featured first; `drafts` (an admin's preview) includes unpublished ones. */
export async function getProjectsByDeveloper(id: number, view: View = false): Promise<Project[]> {
  const v = viewOf(view);
  return (await q<ProjectRow>(`${PROJECT_SELECT} WHERE p.developer_id = $1${v.drafts ? "" : " AND p.published = true"} ORDER BY p.featured DESC, p.featured_order ASC NULLS LAST, p.name`, [id])).map((r) => mapProject(r, v.hiddenImages));
}
/** Developers with at least one published project, for the sitemap. */
export async function getDevelopersWithProjects(): Promise<Developer[]> {
  return q<Developer>("SELECT id, name, slug, website, description FROM developers d WHERE EXISTS (SELECT 1 FROM projects p WHERE p.developer_id = d.id AND p.published = true) ORDER BY name");
}

/** A banner; home carousel slides also use the optional fields (see components/BannerCarousel). */
export interface Banner { id: string; image: string; headline: string; line: string; cta: { label: string; href: string }; showText?: boolean; mobileImage?: string; eyebrow?: string; focalX?: number; focalY?: number; theme?: "dark" | "light" }
interface BannerRow { id: number; image: string | null; headline: string; line: string | null; cta_label: string | null; cta_href: string | null; show_text?: boolean; mobile_image?: string | null; eyebrow?: string | null; focal_x?: number; focal_y?: number; theme?: string }
const SCHEDULED = "active = true AND (start_date IS NULL OR start_date <= current_date) AND (end_date IS NULL OR end_date >= current_date)";
export async function getBanners(): Promise<Banner[]> {
  const rows = await q<BannerRow>(`SELECT id, image, mobile_image, eyebrow, focal_x, focal_y, theme, headline, line, cta_label, cta_href, show_text FROM banners WHERE "group" = 'carousel' AND ${SCHEDULED} ORDER BY sort_order`);
  if (!rows.length) return staticBanners;
  return rows.map((b) => ({ id: String(b.id), image: b.image ?? "", headline: b.headline, line: b.line ?? "", cta: { label: b.cta_label ?? "View properties", href: b.cta_href ?? "/properties" }, showText: b.show_text !== false, mobileImage: b.mobile_image || undefined,
    eyebrow: b.eyebrow || undefined, focalX: Number(b.focal_x ?? 0.5), focalY: Number(b.focal_y ?? 0.5), theme: b.theme === "light" ? "light" : "dark" }));
}
export async function getOfferBanner(): Promise<Banner> {
  const b = await one<BannerRow>(`SELECT id, image, headline, line, cta_label, cta_href FROM banners WHERE "group" = 'offer' AND ${SCHEDULED} ORDER BY sort_order LIMIT 1`);
  if (!b) return { id: "static", image: staticOffer.image, headline: staticOffer.headline, line: staticOffer.line, cta: staticOffer.cta };
  return { id: String(b.id), image: b.image ?? "", headline: b.headline, line: b.line ?? "", cta: { label: b.cta_label ?? "Enquire", href: b.cta_href ?? "/contact" } };
}
export interface Offer { id: number; title: string; image: string | null; text: string | null; href: string }
/** Live offers of one section: "property" (Properties page, home page) or "home_loan" (Home Loans page). */
export async function getActiveOffers(section: "property" | "home_loan" = "property"): Promise<Offer[]> {
  const rows = await q<{ id: number; title: string; image: string | null; text: string | null; link: string | null; pslug: string | null; jslug: string | null }>(
    `SELECT o.id, o.title, o.image, o.text, o.link, p.slug AS pslug, j.slug AS jslug FROM offers o LEFT JOIN properties p ON p.id = o.property_id LEFT JOIN projects j ON j.id = o.project_id WHERE o.section = $1 AND o.${SCHEDULED} ORDER BY o.updated_at DESC`, [section]);
  return rows.map((r) => ({ id: r.id, title: r.title, image: r.image, text: r.text, href: r.pslug ? `/properties/${r.pslug}` : r.jslug ? `/projects/${r.jslug}` : r.link || "/contact" }));
}

interface ArticleRow { id: number; slug: string; title: string; category: string | null; author: string | null; cover: string | null; excerpt: string | null; body: string; published_at: Date | null; writer_name: string | null; writer_role: string | null; writer_level: string | null; writer_photo: string | null }
// Staff posts take the writer's current name, designation and photo from their account.
const ARTICLE = `SELECT b.id, b.slug, b.title, b.category, b.author, b.cover, b.excerpt, b.body, b.published_at,
  u.name AS writer_name, u.role AS writer_role, u.level AS writer_level, u.photo AS writer_photo
  FROM blog_posts b LEFT JOIN users u ON u.id = b.author_id`;
const mapArticle = (r: ArticleRow): Article => ({
  id: r.id, slug: r.slug, title: r.title, category: r.category ?? "General", date: (r.published_at ? new Date(r.published_at) : new Date()).toISOString(),
  author: r.writer_name ?? r.author ?? site.name, authorTitle: r.writer_name ? levelLabel(r.writer_role ?? "employee", r.writer_level) : undefined, authorPhoto: r.writer_photo,
  cover: r.cover ?? "photo-1600596542815-ffad4c1539a9", excerpt: r.excerpt ?? "", body: [r.body],
});
export async function getArticles(): Promise<Article[]> {
  return (await q<ArticleRow>(`${ARTICLE} WHERE b.status = 'Published' ORDER BY b.published_at DESC`)).map(mapArticle);
}
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const r = await one<ArticleRow>(`${ARTICLE} WHERE b.slug = $1 AND b.status = 'Published'`, [slug]);
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
  { value: "4.8", suffix: "★", label: "Google rating", link: site.reviewHref, sort_order: 4, is_active: true },
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
