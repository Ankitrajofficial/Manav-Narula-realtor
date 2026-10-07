/**
 * Developer project importer: turns the raw Mexmon scrape (data/mexmon/projects.json) and the AGI property listings into
 * clean rows in `projects`, with our own copy from data/projects-copy.json.
 *
 * - Merges duplicate pages (the 2BHK / 3BHK / affordable / boutique SEO pages) into their parent project.
 * - Keeps only facts it can find in the source (RERA, unit counts, sizes, distances, amenities); never the developer's
 *   phone, email, prices or marketing paragraphs.
 * - Creates projects as drafts. On a re-import it updates facts only: our copy is filled only where empty, and any field
 *   listed in a project's `edited_fields` (changed in Admin > Projects) is never touched.
 *
 * No "@/..." imports, so Node runs this file directly from scripts/import-projects.mjs as well as from the app.
 */

export interface Db { query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }> }

export interface RawPage {
  project: string; url: string; rera_numbers?: string[];
  /** From projects_tree.json: "project" or "sub-project" (a unit-type page such as "2 BHK flats" under its parent). */
  page_type?: string; parent_project?: string; sub_project?: string; unit_type?: string; page_heading?: string; sizes_sqft?: string[]; sub_projects?: RawPage[]; key_facts?: Record<string, string>; amenities?: string[]; location_distances?: string[]; sections?: { heading: string; content?: string[] }[] }
export interface UnitCopy { description?: string; highlights?: string[]; seo_title?: string; seo_description?: string }
export interface ProjectCopy { units?: Record<string, UnitCopy>; description?: string; highlights?: string[]; configNotes?: Record<string, string>; faqs?: { q: string; a: string }[]; seo_title?: string; seo_description?: string }
export interface Fact { label: string; value: string }
/** Where an image goes on the project page. elevation = hero + gallery (the first is the cover). */
export type MediaKind = "elevation" | "interior" | "gallery" | "floor-plan" | "master-plan" | "amenity" | "location-map";
/** developer: supplied by the developer (hidden until we have permission); published: false hides the image on the site. */
export interface MediaItem { url: string; alt: string; kind: MediaKind; developer?: boolean; published?: boolean }
/** One image from a scraper images_manifest.json, with its content fingerprint (first 12 hex of SHA-1). */
export interface ManifestImage { page: string; file: string; label: string; suggested_alt: string; width?: number | null; hash: string }
/** data/project-image-corrections.json: fixes for images the scraper labelled wrongly. */
export interface ImageCorrection { project?: string; label?: MediaKind | "skip"; alt?: string; cover?: boolean; note?: string }
export interface ImagePlacement { file: string; manifestLabel: string; applied: MediaKind | "skipped"; alt: string; why?: string }
export interface Config { type: string; area: string | null; note: string | null }
export interface ProjectFacts {
  slug: string; name: string; developer: string; city: string; locality: string; address: string | null; rera: string | null; status: string;
  configurations: Config[]; size_range: string | null; key_facts: Fact[]; amenities: string[]; location_highlights: string[];
  source_url: string | null; floor_plans: { url: string; label: string }[]; master_plan: string | null; image: string | null; gallery: string[];
  /** Every image with alt text and section; image, gallery, floor_plans and master_plan are derived from it. */
  media: MediaItem[];
  /** Image files to copy into public/ (from: path inside data/mexmon/, to: public URL). */
  files: { from: string; to: string }[];
  /** How each manifest image was used, for the import report. */
  placements: ImagePlacement[];
  /** Points a person should check before publishing. */
  toConfirm: string[];
  /** The developer's own wording, used only to check that our copy is not copied from it. */
  sourceText: string;
  /** Where the RERA number came from, for the confirmation table. */
  rera_source: RERASource;
  /** Unit types (sub-project pages), shown as tabs on the project page and as their own SEO pages. */
  units: UnitFacts[];
  /** Sub-pages that were not turned into unit types, with the reason (for the report). */
  skippedPages: { url: string; why: string }[];
}
export type RERASource = "found on page" | "inherited from parent" | "from our listing" | "missing";
export interface UnitFacts {
  slug: string; label: string; name: string; source_url: string; rera: string | null; rera_source: RERASource;
  configurations: string[]; size_range: string | null; media: MediaItem[]; files: { from: string; to: string }[]; placements: ImagePlacement[];
  toConfirm: string[]; sourceText: string;
}
export interface ImportResult {
  slug: string; name: string; action: "created" | "updated" | "unchanged"; updated: string[]; keptEdited: string[]; toConfirm: string[];
  /** Facts changed by this import (project and unit facts), and edited fields left as the admin set them. */
  factsUpdated: string[];
}

const MEXMON_DEVELOPER = "Mexmon Group";
const AGI_DEVELOPER = "AGI Infra";
const num = (s: string) => Number(s.replace(/,/g, ""));
const fmt = (n: number) => n.toLocaleString("en-IN");
const ACRONYMS = new Set(["PIMS", "BMC", "GT", "SCO"]);
const titleCase = (s: string) => s.toLowerCase().replace(/\b[\w'-]+/g, (w) => (ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).replace(/\bPhase-I\b/i, "Phase I");

/* ------------------------------------------------------------------ Mexmon ------------------------------------------------------------------ */

type Pattern = { label: string; re: RegExp; value: (m: RegExpMatchArray) => string };
interface MexmonProject {
  slug: string; name: string; pages: RegExp; locality: string; address: string; status: string;
  configs: { type: string; re: RegExp }[]; facts: Pattern[]; amenities: [string, RegExp][];
}

/** The four real projects; the four SEO pages are matched into Mexmon Dreams by URL. */
const MEXMON: MexmonProject[] = [
  {
    slug: "mexmon-dreams-jalandhar", name: "Mexmon Dreams", pages: /\/(mexmon-dreams|2BHK-flat-in-jalandhar|3BHK-flat-in-jalandhar|affordable-apartments-in-jalandhar|boutique-apartment-in-jalandhar)\.php$/i,
    locality: "66 Feet Road", address: "66 Feet Road, Urban Estate Phase II Extension, Jalandhar", status: "Upcoming",
    configs: [{ type: "2 BHK", re: /\b2\s?BHK\b/i }, { type: "3 BHK", re: /\b3\s?BHK\b/i }],
    facts: [
      { label: "Project area", re: /(\d+)\s*ACRES\s*-\s*PHASE-?\s*(\d)/i, value: (m) => `${m[1]} acres (Phase ${m[2]})` },
      { label: "Towers", re: /\b(\d+|eight)\s+huge buildings/i, value: (m) => (m[1].toLowerCase() === "eight" ? "8" : m[1]) },
      { label: "Apartments", re: /([\d,]{3,})\s+(?:boutique apartments|residences|well-designed)/i, value: (m) => fmt(num(m[1])) },
      { label: "Floors", re: /S\+(\d+)(?:,\s*S\+(\d+))*(?:,\s*S\+(\d+))?/i, value: (m) => { const f = [m[1], m[2], m[3]].filter(Boolean).map(Number); return `S+${Math.min(...f)} to S+${Math.max(...f)}`; } },
      { label: "Clubhouse", re: /Clubhouse\s*([\d,]+)\s*SQ\.?\s*FT/i, value: (m) => `${m[1]} sq ft` },
      { label: "Parking", re: /Parking Space\s*(\d[\d,]*)/i, value: (m) => `${fmt(num(m[1]))} spaces` },
      { label: "Open and green area", re: /Open and Green Area\s*(\d+)%/i, value: (m) => `${m[1]}%` },
      { label: "Amenities", re: /Residential Amenities\s*(\d+\+?)/i, value: (m) => m[1] },
      { label: "Security", re: /Security\s*(\d)-Tier with AI/i, value: (m) => `${m[1]}-tier, with AI-assisted monitoring` },
      { label: "Architect", re: /Hafeez Contractor/i, value: () => "Hafeez Contractor" },
      { label: "Construction", re: /Mivan/i, value: () => "Mivan" },
    ],
    amenities: [
      ["Clubhouse (40,000 sq ft)", /Clubhouse\s*40,000/i], ["Swimming pool and separate kids' pool", /swimming pool/i], ["Gymnasium", /gymnasium/i],
      ["Landscaped gardens with water features", /landscaped gardens/i], ["Jogging track", /jogging track/i], ["Gazebos", /gazebo/i],
      ["Exclusive basement parking", /basement parking/i], ["Three-tier security", /3-Tier/i], ["Gated community", /gated community/i],
    ],
  },
  {
    slug: "mexmon-dreams-1-jalandhar", name: "Mexmon Dreams-1", pages: /\/mexmon-dreams-1\.php$/i,
    locality: "Sahibzada Ajit Singh Nagar Road", address: "Sahibzada Ajit Singh Nagar Road, Jalandhar", status: "Under construction",
    configs: [{ type: "Residential plot", re: /residential plots/i }, { type: "SCO", re: /\bSCO/i }],
    facts: [
      { label: "Residential plots", re: /(\d+)\s+(?:exclusive |well-planned )?residential plots/i, value: (m) => m[1] },
      { label: "SCO units", re: /(\d+)\s+SCO\b/i, value: (m) => m[1] },
    ],
    amenities: [
      ["Landscaped green parks", /landscaped green parks/i], ["Children's play area", /kids play area/i], ["Wide internal roads", /wide internal roads/i],
      ["Resident and visitor parking", /parking/i], ["24×7 security", /24\/7 Security/i],
    ],
  },
  {
    slug: "mexmon-highstreet-jalandhar", name: "Mexmon Highstreet", pages: /\/mexmon-highstreet\.php$/i,
    locality: "66 Feet Road", address: "66 Feet Road, Jalandhar", status: "Under construction",
    configs: [{ type: "SCO", re: /\bSCO/i }, { type: "Showroom", re: /showroom/i }, { type: "Office", re: /\boffices?\b/i }],
    facts: [
      { label: "Commercial units", re: /(\d+)\s+meticulously designed commercial units/i, value: (m) => m[1] },
      { label: "Floors", re: /commercial units spread across (\w+) (?:elegant )?floors/i, value: (m) => ({ two: "2", three: "3", four: "4" } as Record<string, string>)[m[1].toLowerCase()] ?? m[1] },
      { label: "Lifts", re: /shared lift for every two/i, value: () => "1 shared lift per 2 units" },
    ],
    amenities: [
      ["Shared lifts", /shared lift/i], ["Parking", /ample parking/i], ["Landscaped courtyard and lawns", /courtyard/i], ["24×7 security", /24\/7 Security/i],
    ],
  },
  {
    slug: "mexmon-palm-city-jalandhar", name: "Mexmon Palm City", pages: /\/palm-city\.php$/i,
    locality: "66 Feet Road", address: "66 Feet Road, Jalandhar", status: "Under construction",
    configs: [{ type: "Residential plot", re: /plots/i }, { type: "Villa", re: /villas/i }, { type: "SCO", re: /\bSCO/i }],
    facts: [
      { label: "Residential plots", re: /(\d+)\s+(?:spacious|premium)\s+plots/i, value: (m) => m[1] },
      { label: "SCO units", re: /(\d+)\s+(?:thoughtfully designed|strategically located)\s+SCOs/i, value: (m) => m[1] },
    ],
    amenities: [
      ["Landscaped green parks", /green parks/i], ["Children's play area", /kids'? play area/i], ["Walking paths", /walking path/i],
      ["Recreation for all ages", /recreational facilities for all ages/i], ["24×7 security", /24\/7 Security/i], ["Gated community", /gated community/i],
    ],
  },
];

const pageText = (p: RawPage) => [
  ...Object.entries(p.key_facts ?? {}).map(([k, v]) => `${k} ${v}`), ...(p.amenities ?? []),
  ...(p.sections ?? []).flatMap((s) => [s.heading, ...(s.content ?? [])]),
].join("\n");

const KIND_ORDER: MediaKind[] = ["elevation", "interior", "gallery", "floor-plan", "master-plan", "amenity", "location-map"];
const KNOWN_KINDS = new Set<string>(KIND_ORDER);
/** Scraper labels that are not a section of their own (e.g. construction) go to the gallery; logos and icons are never used. */
const toKind = (label: string): MediaKind | null => (label === "logo" || label === "icon" || label === "skip" ? null : KNOWN_KINDS.has(label) ? (label as MediaKind) : "gallery");
const extOf = (file: string) => (file.match(/\.[a-z0-9]+$/i)?.[0] ?? ".jpg").toLowerCase();

/** Derives the legacy image fields from the media list. */
export function fromMedia(media: MediaItem[]) {
  const shown = media.filter((m) => m.kind === "elevation" || m.kind === "interior" || m.kind === "gallery");
  return {
    image: (media.find((m) => m.kind === "elevation") ?? shown[0])?.url ?? null,
    gallery: shown.map((m) => m.url),
    floor_plans: media.filter((m) => m.kind === "floor-plan").map((m) => ({ url: m.url, label: m.alt })),
    master_plan: media.find((m) => m.kind === "master-plan")?.url ?? null,
  };
}

/**
 * Places the scraper's images by their use_on_site label with suggested_alt as alt text, applying corrections where the
 * scraper got it wrong. Never logos, icons, SVGs or images under 300 px; an image shown on several projects' pages is
 * used only where a correction assigns it. `onPage` picks the pages whose images are used; `exclude` drops images by hash.
 * Every image is marked as the developer's and hidden until the project's "Show developer images" switch is on.
 */
function mexmonMedia(slug: string, folder: string, onPage: (url: string) => boolean, all: ManifestImage[], corrections: Record<string, ImageCorrection>, exclude = new Set<string>()) {
  const familyOf = (hash: string) => new Set(all.filter((i) => i.hash === hash).map((i) => projectOfUrl(i.page)?.slug).filter(Boolean));
  const placements: ImagePlacement[] = [];
  const picked: (MediaItem & { cover: boolean; from: string; order: number })[] = [];
  const done = new Set<string>();
  all.filter((i) => onPage(i.page)).forEach((img, order) => {
    if (done.has(img.hash)) return;
    done.add(img.hash);
    const c = corrections[img.hash];
    const skip = (why: string) => { placements.push({ file: img.file, manifestLabel: img.label, applied: "skipped", alt: "", why }); };
    if (c?.project && c.project !== slug) return; // belongs to another project
    if (exclude.has(img.hash)) return skip("on every unit-type page, so it is not specific to this one");
    if (/\.svg$/i.test(img.file)) return skip("SVG icon");
    if (img.width && img.width < 300) return skip(img.label === "logo" ? "developer logo" : "smaller than 300 px");
    const label = c?.label ?? img.label;
    const kind = toKind(label);
    if (!kind) return skip(c?.note ?? `labelled ${label}`);
    if (!c?.project && familyOf(img.hash).size > 1) return skip("shown on several projects' pages; assign it in the corrections file");
    const alt = c?.alt ?? img.suggested_alt;
    picked.push({ url: "", alt, kind, cover: !!c?.cover, from: img.file, order });
    placements.push({ file: img.file, manifestLabel: img.label, applied: kind, alt, why: c?.note });
  });
  picked.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || Number(b.cover) - Number(a.cover) || a.order - b.order);
  const counts: Record<string, number> = {};
  const files: { from: string; to: string }[] = [];
  const media: MediaItem[] = picked.map((p) => {
    counts[p.kind] = (counts[p.kind] ?? 0) + 1;
    const url = `/projects/${folder}/${p.kind}-${String(counts[p.kind]).padStart(2, "0")}${extOf(p.from)}`;
    files.push({ from: p.from, to: url });
    return { url, alt: p.alt, kind: p.kind, developer: true, published: false };
  });
  return { media, files, placements };
}

/** Accepts projects_tree.json (projects with sub_projects inside) or the flat projects.json. */
export function flattenPages(input: RawPage[]): RawPage[] {
  return input.flatMap((p) => [p, ...flattenPages(p.sub_projects ?? [])]);
}

const slugify = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const projectOfUrl = (url: string) => MEXMON.find((m) => m.pages.test(url));
const isSub = (p: RawPage) => p.page_type === "sub-project";
const reraIn = (p: RawPage) => pageText(p).match(/PBRERA-[A-Z0-9-]+/)?.[0] ?? null;
/** Unit-type URL slug, e.g. "2 BHK Flats" -> "2-bhk-flats-jalandhar". */
const unitSlug = (p: RawPage, city: string) => { const base = slugify(p.sub_project || p.page_heading || p.unit_type || ""); return base.endsWith(slugify(city)) ? base : `${base}-${slugify(city)}`; };

/** A sub-project page turned into a unit type of its parent project. */
function buildUnit(m: { slug: string; name: string }, parentRera: string | null, parentConfigs: string[], page: RawPage, siblings: RawPage[], images: ManifestImage[], corrections: Record<string, ImageCorrection>): UnitFacts {
  const slug = unitSlug(page, "Jalandhar");
  const label = page.unit_type || page.sub_project || page.page_heading || slug;
  const toConfirm: string[] = [];
  const own = reraIn(page);
  const rera = own ?? parentRera;
  const rera_source: RERASource = own ? "found on page" : rera ? "inherited from parent" : "missing";
  const bhk = label.match(/^(\d+(?:\+\d+)?)\s*BHK/i);
  const configurations = bhk ? [`${bhk[1]} BHK`] : parentConfigs;
  const sizes = (page.sizes_sqft ?? []).filter((x) => /\d/.test(x));
  if (!sizes.length) toConfirm.push(`${label}: sizes are not on the developer's page; add them when the developer confirms`);
  // Images that appear on every sibling unit page are generic, not this unit's.
  const onAll = new Set(images.filter((i) => i.page === page.url).map((i) => i.hash).filter((h) => siblings.length > 1 && siblings.every((s) => images.some((i) => i.page === s.url && i.hash === h))));
  const { media, files, placements } = mexmonMedia(m.slug, `${m.slug}/${slug}`, (url) => url === page.url, images, corrections, onAll);
  return {
    slug, label, name: page.sub_project || label, source_url: page.url, rera, rera_source, configurations,
    size_range: sizes.length ? sizes.join(", ") : null, media, files, placements, toConfirm,
    sourceText: (page.sections ?? []).flatMap((s) => s.content ?? []).join("\n"),
  };
}

export function buildMexmonFacts(input: RawPage[], images: ManifestImage[] = [], corrections: Record<string, ImageCorrection> = {}): ProjectFacts[] {
  const pages = flattenPages(input);
  const known: ProjectFacts[] = MEXMON.map((m) => {
    const group = pages.filter((p) => m.pages.test(p.url));
    const parent = group.find((p) => p.page_type ? !isSub(p) : !/(BHK-flat|affordable|boutique)/i.test(p.url)) ?? group[0];
    const text = group.map(pageText).join("\n");
    const toConfirm: string[] = [];
    if (!group.length) toConfirm.push("No source page found in projects.json");
    const parentRera = parent ? (reraIn(parent) ?? parent.rera_numbers?.[0] ?? null) : null;
    const rera = parentRera ?? [...new Set(group.flatMap((p) => p.rera_numbers ?? []).concat(text.match(/PBRERA-[A-Z0-9-]+/g) ?? []))][0] ?? null;
    if (!rera) toConfirm.push("Project RERA number not in the source: add it before publishing");
    const key_facts: Fact[] = [];
    for (const f of m.facts) {
      const hit = text.match(f.re);
      if (hit) key_facts.push({ label: f.label, value: f.value(hit) });
      else toConfirm.push(`Fact not found in the source: ${f.label}`);
    }
    const configurations = m.configs.filter((c) => c.re.test(text)).map((c) => ({ type: c.type, area: null, note: null }));
    const location_highlights = [...new Set(group.flatMap((p) => p.location_distances ?? []))].map((d) => titleCase(d).replace(/:\s*(\d+)\s*min.*/i, ": $1 min by road"));
    toConfirm.push("Status and possession: not on the developer's page; confirm with the developer");
    // Unit types: the tree's sub-project pages of this project (by URL, or listed under it by the scraper).
    const subs = pages.filter((p) => isSub(p) && (m.pages.test(p.url) || p.parent_project === m.name || p.parent_project === parent?.project));
    const skippedPages: { url: string; why: string }[] = [];
    const unitPages = subs.filter((p) => {
      if (!p.unit_type) { skippedPages.push({ url: p.url, why: "not a unit type (a general page of the developer's site)" }); return false; }
      return true;
    });
    const units = unitPages.map((p) => buildUnit(m, rera, configurations.map((c) => c.type), p, unitPages, images, corrections));
    // The project's own images come from its own page only; each unit type has its own.
    const parentUrls = new Set(group.filter((p) => !unitPages.includes(p)).map((p) => p.url));
    const { media, files, placements } = mexmonMedia(m.slug, m.slug, (url) => parentUrls.has(url), images, corrections);
    if (!media.length) toConfirm.push("Images: none found in images_manifest.json; upload them in Admin > Projects");
    const derived = fromMedia(media);
    return {
      slug: m.slug, name: m.name, developer: MEXMON_DEVELOPER, city: "Jalandhar", locality: m.locality, address: m.address, rera, status: m.status,
      configurations, size_range: null, key_facts, amenities: m.amenities.filter(([, re]) => re.test(text)).map(([a]) => a), location_highlights,
      source_url: parent?.url ?? null, ...derived, media, files, placements, toConfirm,
      sourceText: group.flatMap((p) => (p.sections ?? []).flatMap((s) => s.content ?? [])).join("\n"),
      rera_source: rera ? (parent && reraIn(parent) ? "found on page" : "inherited from parent") : "missing", units, skippedPages,
    };
  });

  // Any other project on mexmongroup.com becomes a Mexmon Group draft with the facts we can read safely; we write its copy.
  const others = pages.filter((p) => !isSub(p) && p.page_type === "project" && !projectOfUrl(p.url));
  const extra: ProjectFacts[] = others.map((p) => {
    const slug = `${slugify(p.project.replace(/\s+(\d+)$/, "-$1"))}-jalandhar`;
    const rera = reraIn(p) ?? p.rera_numbers?.[0] ?? null;
    return {
      slug, name: p.project, developer: MEXMON_DEVELOPER, city: "Jalandhar", locality: "", address: null, rera, status: "Upcoming",
      configurations: [], size_range: null, key_facts: [], amenities: [], location_highlights: [], source_url: p.url,
      floor_plans: [], master_plan: null, image: null, gallery: [], media: [], files: [], placements: [],
      toConfirm: ["New project found on mexmongroup.com: add its locality, configurations, facts and our own copy before publishing", ...(rera ? [] : ["Project RERA number not in the source"])],
      sourceText: (p.sections ?? []).flatMap((s) => s.content ?? []).join("\n"), rera_source: rera ? "found on page" : "missing", units: [], skippedPages: [],
    };
  });
  return [...known, ...extra];
}

/* -------------------------------------------------------------------- AGI -------------------------------------------------------------------- */

const configRank = (c: Config) => {
  const bhk = c.type.match(/^(\d+)(?:\+(\d+))?\s*BHK/i);
  const base = bhk ? Number(bhk[1]) * 10 + (bhk[2] ? Number(bhk[2]) : 0) : /duplex/i.test(c.type) ? 900 : 1000;
  return base * 100000 + (c.area ? num(c.area.match(/[\d,]+/)?.[0] ?? "0") : 0);
};

/** AGI projects come from their existing property listings. */
export const AGI: { from: string; slug: string; name: string; extraConfigs?: Config[]; extraFacts?: Fact[]; location?: string[] }[] = [
  { from: "jalandhar-heights-ii", slug: "agi-jalandhar-heights-ii", name: "Jalandhar Heights II", extraConfigs: [{ type: "4+1 BHK", area: null, note: "Iconic Tower" }, { type: "Penthouse", area: null, note: null }] },
  { from: "jalandhar-heights-iii", slug: "agi-jalandhar-heights-iii", name: "Jalandhar Heights III", extraConfigs: [{ type: "Penthouse", area: null, note: "In the 3 and 4 BHK towers" }] },
  { from: "jalandhar-heights-iv", slug: "agi-jalandhar-heights-iv", name: "Jalandhar Heights IV" },
  { from: "prestige-by-agi", slug: "agi-prestige-jalandhar", name: "Prestige by AGI", extraFacts: [{ label: "Homes per floor", value: "4" }] },
  { from: "agi-sky-garden", slug: "agi-sky-garden-jalandhar", name: "AGI Sky Garden", extraFacts: [{ label: "Projects", value: "Sky Garden I, II, III and Maxima I, II" }] },
  { from: "agi-sky-villas", slug: "agi-sky-villas-ludhiana", name: "AGI Sky Villas", extraConfigs: [{ type: "Penthouse", area: null, note: null }], extraFacts: [{ label: "Floor-to-floor height", value: "3.6 m" }], location: ["200 Feet Road: direct connectivity", "Phullanwal Chowk: two-way access"] },
];

interface PropertyRow { id: number; slug: string; locality: string | null; street: string | null; city: string | null; rera: string | null; description: string | null; long_description: string | null; amenities: string[] | null; master_plan: string | null; floor_plans: { url: string; label: string }[] | null }

/** Reads the AGI listings. `moveUrl` maps a /properties/<slug>/ file to its new /projects/<slug>/ path. */
export async function buildAgiFacts(db: Db, moveUrl: (url: string, slug: string) => string): Promise<ProjectFacts[]> {
  const out: ProjectFacts[] = [];
  for (const a of AGI) {
    const r = (await db.query<PropertyRow>("SELECT id, slug, locality, street, city, rera, description, long_description, amenities, master_plan, floor_plans FROM properties WHERE slug = $1", [a.from])).rows[0];
    if (!r) continue;
    const images = (await db.query<{ url: string; is_cover: boolean }>("SELECT url, is_cover FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, sort_order", [r.id])).rows;
    const text = [r.description, r.long_description, ...(r.amenities ?? [])].join("\n");
    const plans = (r.floor_plans ?? []).map((p) => ({ url: moveUrl(p.url, a.slug), label: p.label.replace(/\bsq\.\s?ft\./gi, "sq ft") }));
    const configurations: Config[] = plans.map((p): Config => {
      const m = p.label.match(/^(.+?)\s+[–-]\s+([\d,]+)\s*sq ft(?:\s*\((carpet area [\d,]+ sq ft)\))?(?:,\s*(.+))?$/i);
      return m ? { type: m[1].trim(), area: `${m[2]} sq ft${m[3] ? ` (${m[3].replace("carpet area", "carpet")})` : ""}`, note: m[4] ?? null } : { type: p.label, area: null, note: null };
    }).concat(a.extraConfigs ?? []).sort((x, y) => configRank(x) - configRank(y));
    const sizes = plans.flatMap((p) => { const m = p.label.match(/([\d,]+)\s*sq ft(?!\))/i); return m ? [num(m[1])] : []; });
    const key_facts: Fact[] = [];
    const types = [...new Set(configurations.map((c) => c.type))];
    key_facts.push({ label: "Configurations", value: types.join(", ") });
    const open = text.match(/(\d+)% open/i); if (open) key_facts.push({ label: "Open and green area", value: `${open[1]}%` });
    const toConfirm: string[] = [];
    // A listing that names two different security levels is not trusted for either: it goes to the confirm list instead.
    const WORDS: Record<string, string> = { two: "2", three: "3", four: "4", five: "5" };
    const tiers = [...new Set((text.match(/\b(\d|two|three|four|five)-tier/gi) ?? []).map((t) => WORDS[t.split("-")[0].toLowerCase()] ?? t.split("-")[0]))];
    if (tiers.length === 1) key_facts.push({ label: "Security", value: `${tiers[0]}-tier` });
    else if (tiers.length > 1) toConfirm.push(`Security: the listing mentions ${tiers.map((t) => `${t}-tier`).join(" and ")}; confirm which is right`);
    const zone = text.match(/Seismic Zone[- ]?(IV|V)\b/i); if (zone) key_facts.push({ label: "Structure", value: `Designed for Seismic Zone ${zone[1].toUpperCase()}` });
    if (/Mivan/i.test(text)) key_facts.push({ label: "Construction", value: "Mivan" });
    key_facts.push(...(a.extraFacts ?? []));
    if (!r.rera) toConfirm.push("Project RERA number: add before publishing");
    const words = (url: string) => url.split("/").pop()!.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
    const agiMedia: MediaItem[] = [
      ...images.map((i) => ({ url: moveUrl(i.url, a.slug), alt: `${a.name}, ${words(i.url)}`, kind: "elevation" as const })),
      ...plans.map((p) => ({ url: p.url, alt: `${a.name} floor plan: ${p.label}`, kind: "floor-plan" as const })),
      ...(r.master_plan ? [{ url: moveUrl(r.master_plan, a.slug), alt: `${a.name} master plan`, kind: "master-plan" as const }] : []),
    ];
    toConfirm.push("Status and possession: set from the developer's latest update");
    out.push({
      slug: a.slug, name: a.name, developer: AGI_DEVELOPER, city: r.city ?? "Jalandhar", locality: r.locality ?? "", address: [r.street, r.locality, r.city].filter(Boolean).join(", ") || null,
      rera: r.rera, status: "Under construction", configurations, size_range: sizes.length ? `${fmt(Math.min(...sizes))}–${fmt(Math.max(...sizes))} sq ft` : null,
      key_facts, amenities: r.amenities ?? [], location_highlights: a.location ?? [], source_url: null,
      ...fromMedia(agiMedia), media: agiMedia, files: [], placements: [], toConfirm, units: [], skippedPages: [],
      rera_source: r.rera ? "from our listing" : "missing", sourceText: [r.description, r.long_description].filter(Boolean).join("\n"),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ writing ------------------------------------------------------------------ */

/** Facts a re-import refreshes (unless edited in admin). */
const FACT_FIELDS = ["rera", "size_range", "key_facts", "amenities", "location_highlights", "address", "locality", "city", "source_url"] as const;
/** Our copy: written once, only into empty fields. */
const COPY_FIELDS = ["description", "highlights", "faqs", "seo_title", "seo_description"] as const;
const JSON_FIELDS = new Set(["key_facts", "amenities", "location_highlights", "floor_plans", "highlights", "faqs", "gallery", "source_facts", "media", "units"]);
/** Image fields written together from media: on first import, or while a project has no images yet. */
const MEDIA_FIELDS = ["media", "image", "gallery", "floor_plans", "master_plan"] as const;
/** Equal as stored: Postgres reorders jsonb keys, so key order is ignored. */
const sortKeys = (v: unknown): unknown => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])])) : v);
const same = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a ?? null)) === JSON.stringify(sortKeys(b ?? null));
const isEmpty = (v: unknown) => v == null || v === "" || (Array.isArray(v) && v.length === 0);

/** Agent-side questions every project gets after its own. */
function standardFaqs(f: ProjectFacts): { q: string; a: string }[] {
  return [
    { q: `Who is developing ${f.name}?`, a: `${f.developer} is the developer. Manav Narula Realtor is a sales agent for the project, so you can see plans, compare options and book a site visit through us.` },
    f.rera
      ? { q: `Is ${f.name} registered with RERA?`, a: `Yes. Its Punjab RERA registration number is ${f.rera}. You can check it on the Punjab RERA website before you pay anything.` }
      : { q: `Is ${f.name} registered with RERA?`, a: "Ask us for the project's RERA registration details. We confirm the registration of every project before you pay a token." },
    { q: "Can you help with a home loan?", a: "Yes. We compare offers from our partner banks and prepare your loan file, at no extra cost to you." },
    { q: "How do I arrange a site visit?", a: "Call or WhatsApp us on +91 90122 90522, or send the enquiry form on this page, and we will set up a visit at a time that suits you." },
  ];
}

/** A unit type as stored in projects.units. `edited` lists fields changed in Admin > Projects (kept on re-import). */
export interface StoredUnit {
  slug: string; label: string; name: string; source_url: string | null; rera: string | null; rera_source: RERASource;
  configurations: string[]; size_range: string | null; description: string | null; highlights: string[];
  seo_title: string | null; seo_description: string | null; media: MediaItem[]; edited: string[];
}
export const UNIT_FACT_FIELDS = ["rera", "rera_source", "source_url", "configurations", "size_range"] as const;
const UNIT_COPY_FIELDS = ["description", "highlights", "seo_title", "seo_description"] as const;

/** Merges imported unit types into the stored ones: facts refresh unless edited, copy and images only fill gaps. */
function mergeUnits(stored: StoredUnit[], facts: UnitFacts[], copy: Record<string, UnitCopy>, out: { updated: string[]; kept: string[] }): StoredUnit[] {
  const result = stored.map((u) => ({ ...u, edited: u.edited ?? [] }));
  for (const f of facts) {
    const c = copy[f.slug] ?? {};
    const wanted: Record<string, unknown> = { rera: f.rera, rera_source: f.rera_source, source_url: f.source_url, configurations: f.configurations, size_range: f.size_range };
    const u = result.find((x) => x.slug === f.slug);
    if (!u) {
      result.push({ slug: f.slug, label: f.label, name: f.name, ...(wanted as Pick<StoredUnit, "rera" | "rera_source" | "source_url" | "configurations" | "size_range">),
        description: c.description ?? null, highlights: c.highlights ?? [], seo_title: c.seo_title ?? null, seo_description: c.seo_description ?? null, media: f.media, edited: [] });
      out.updated.push(`unit ${f.label} added`);
      continue;
    }
    const rec = u as unknown as Record<string, unknown>;
    for (const k of UNIT_FACT_FIELDS) {
      if (same(rec[k], wanted[k])) continue;
      if (u.edited.includes(k)) { out.kept.push(`${f.label}: ${k}`); continue; }
      rec[k] = wanted[k]; out.updated.push(`${f.label}: ${k}`);
    }
    for (const k of UNIT_COPY_FIELDS) if (isEmpty(rec[k]) && !isEmpty(c[k]) && !u.edited.includes(k)) rec[k] = c[k];
    if (isEmpty(u.media) && f.media.length && !u.edited.includes("media")) u.media = f.media;
  }
  return result;
}

/** Finds the developer's id, creating the developer if it is new. */
async function developerId(db: Db, name: string): Promise<number> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  await db.query("INSERT INTO developers (name, slug) VALUES ($1, $2) ON CONFLICT DO NOTHING", [name, slug]);
  return (await db.query<{ id: number }>("SELECT id FROM developers WHERE lower(name) = lower($1)", [name])).rows[0].id;
}

export async function importProjects(db: Db, facts: ProjectFacts[], copy: Record<string, ProjectCopy>): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  for (const f of facts) {
    const c = copy[f.slug] ?? {};
    const notes = c.configNotes ?? {};
    const configs = f.configurations.map((x) => ({ ...x, note: x.note ?? notes[x.type] ?? null }));
    const devId = await developerId(db, f.developer);
    const wanted: Record<string, unknown> = {
      rera: f.rera, size_range: f.size_range, key_facts: f.key_facts, amenities: f.amenities, location_highlights: f.location_highlights, address: f.address,
      locality: f.locality, city: f.city, source_url: f.source_url,
      description: c.description ?? null, highlights: c.highlights ?? [], faqs: [...(c.faqs ?? []), ...standardFaqs(f)], seo_title: c.seo_title ?? null, seo_description: c.seo_description ?? null,
    };
    const { sourceText: _source, toConfirm: _confirm, files: _files, placements: _placements, media: _media, units: _units, skippedPages: _skipped, ...sourceFacts } = f;
    void _source; void _confirm; void _files; void _placements; void _media; void _units; void _skipped;
    // The image columns hold only images that may be shown; hidden developer images stay in media alone.
    const mediaVals: Record<string, unknown> = { media: f.media, ...fromMedia(f.media.filter((m) => m.published !== false)) };
    const toConfirm = [...f.toConfirm, ...f.units.flatMap((u) => u.toConfirm)];
    const existing = (await db.query<Record<string, unknown>>("SELECT * FROM projects WHERE slug = $1", [f.slug])).rows[0];

    if (!existing) {
      const units = mergeUnits([], f.units, c.units ?? {}, { updated: [], kept: [] });
      const cols = ["slug", "name", "developer", "developer_id", "status", "published", "featured", "source_facts", "units", ...MEDIA_FIELDS, ...FACT_FIELDS, ...COPY_FIELDS];
      const vals: Record<string, unknown> = { slug: f.slug, name: f.name, developer: f.developer, developer_id: devId, status: f.status, published: false, featured: false, source_facts: sourceFacts, units, ...mediaVals, ...wanted };
      const row = (await db.query<{ id: number }>(
        `INSERT INTO projects (${cols.join(", ")}) VALUES (${cols.map((col, i) => `$${i + 1}${JSON_FIELDS.has(col) ? "::jsonb" : ""}`).join(", ")}) RETURNING id`,
        cols.map((col) => (JSON_FIELDS.has(col) ? JSON.stringify(vals[col] ?? []) : vals[col])),
      )).rows[0];
      await writeConfigs(db, row.id, configs);
      results.push({ slug: f.slug, name: f.name, action: "created", updated: [], keptEdited: [], factsUpdated: [], toConfirm });
      continue;
    }

    const edited = new Set((existing.edited_fields as string[] | null) ?? []);
    const sets: string[] = []; const params: unknown[] = []; const updated: string[] = []; const keptEdited: string[] = []; const factsUpdated: string[] = [];
    const set = (col: string, v: unknown) => { params.push(JSON_FIELDS.has(col) ? JSON.stringify(v ?? []) : v); sets.push(`${col} = $${params.length}${JSON_FIELDS.has(col) ? "::jsonb" : ""}`); updated.push(col); };
    for (const col of FACT_FIELDS) {
      if (same(existing[col], wanted[col])) continue;
      if (edited.has(col)) { keptEdited.push(col); continue; }
      set(col, wanted[col]); factsUpdated.push(col);
    }
    for (const col of COPY_FIELDS) if (isEmpty(existing[col]) && !isEmpty(wanted[col]) && !edited.has(col)) set(col, wanted[col]);
    // Images belong to the admin once a project has any: a re-import only fills a project that has none.
    if (isEmpty(existing.media) && f.media.length && !edited.has("media")) for (const col of MEDIA_FIELDS) set(col, mediaVals[col]);
    // A project always has a developer; one moved to another developer in admin stays there.
    if (existing.developer_id == null && !edited.has("developer")) { set("developer_id", devId); set("developer", f.developer); }
    const unitLog = { updated: [] as string[], kept: [] as string[] };
    const units = mergeUnits((existing.units as StoredUnit[] | null) ?? [], f.units, c.units ?? {}, unitLog);
    if (!same(existing.units, units)) set("units", units);
    factsUpdated.push(...unitLog.updated); keptEdited.push(...unitLog.kept);
    if (!same(existing.source_facts, sourceFacts)) { params.push(JSON.stringify(sourceFacts)); sets.push(`source_facts = $${params.length}::jsonb`); }
    if (!edited.has("configurations")) {
      const current = (await db.query<{ type: string; area: string | null; note: string | null }>("SELECT type, area, note FROM project_configurations WHERE project_id = $1 ORDER BY sort_order", [existing.id])).rows;
      if (!same(current.map(({ type, area }) => ({ type, area })), configs.map(({ type, area }) => ({ type, area })))) { await writeConfigs(db, existing.id as number, configs); updated.push("configurations"); factsUpdated.push("configurations"); }
    } else if (!same(((await db.query<{ type: string; area: string | null }>("SELECT type, area FROM project_configurations WHERE project_id = $1 ORDER BY sort_order", [existing.id])).rows), configs.map(({ type, area }) => ({ type, area })))) keptEdited.push("configurations");
    if (sets.length) { params.push(existing.id); await db.query(`UPDATE projects SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length}`, params); }
    results.push({ slug: f.slug, name: f.name, action: updated.length || factsUpdated.length ? "updated" : "unchanged", updated, keptEdited, factsUpdated, toConfirm });
  }
  return results;
}

async function writeConfigs(db: Db, projectId: number, configs: Config[]) {
  await db.query("DELETE FROM project_configurations WHERE project_id = $1", [projectId]);
  for (const [i, c] of configs.entries()) await db.query("INSERT INTO project_configurations (project_id, type, area, note, sort_order) VALUES ($1, $2, $3, $4, $5)", [projectId, c.type, c.area, c.note, i]);
}

/* --------------------------------------------------------------- copy check --------------------------------------------------------------- */

const shingles = (s: string, n = 5) => { const w = s.toLowerCase().replace(/[^a-z0-9%+ ]+/g, " ").split(/\s+/).filter(Boolean); const out = new Set<string>(); for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" ")); return out; };

/** For each sentence of our copy, the share of its 5-word runs that also appear in the developer's text. */
export function copyOverlap(copy: ProjectCopy, sourceText: string, ignore: (string | null)[] = []): { worst: number; sentence: string } {
  // Names and addresses are bound to match the developer's text; they are taken out before comparing.
  const names = ignore.filter((x): x is string => !!x).flatMap((x) => x.split(/,\s*/)).filter((x) => x.length > 3).sort((a, b) => b.length - a.length);
  const strip = (t: string) => names.reduce((acc, n) => acc.split(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")).join(" "), t);
  const src = shingles(strip(sourceText));
  const text = strip([copy.description, ...(copy.highlights ?? []), ...(copy.faqs ?? []).map((f) => f.a)].filter(Boolean).join(" "));
  let worst = 0, sentence = "";
  for (const s of text.split(/(?<=[.!?])\s+|\n+/)) {
    const sh = shingles(s);
    if (sh.size < 3) continue;
    const share = [...sh].filter((x) => src.has(x)).length / sh.size;
    if (share > worst) { worst = share; sentence = s; }
  }
  return { worst, sentence };
}
