/** Website pop-ups: shared by the admin console, the server loaders and the pop-up on the website. */

export type PopupKind = "promo" | "consultation" | "enquiry";

/** What the website needs to show one pop-up. */
export interface SitePopup {
  id: number;
  kind: PopupKind;
  title: string;
  text: string | null;
  image: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  /** "all", "home", or one path per line. */
  pages: string;
  delaySeconds: number;
  /** Enquiry pop-ups: the project the lead is about (optional). */
  projectId: number | null;
}

export const POPUP_KINDS: { value: PopupKind; label: string; hint: string }[] = [
  { value: "enquiry", label: "Enquiry form", hint: "Image and text with a short form (name, phone, message). Every reply becomes a lead, optionally tagged with a project." },
  { value: "promo", label: "Promotion", hint: "Image, text and a button that links anywhere, e.g. a new project launch or an offer. Collects no details." },
  { value: "consultation", label: "Consultation form", hint: "Asks for name, phone, budget and locality; every reply becomes a lead and the visitor sees 3 matching properties." },
];

/** Form pop-ups never cover the pages that already have their own enquiry form. */
const FORM_PAGES = ["/contact", "/home-loans"];

const under = (path: string, base: string) => path === base || (base !== "/" && path.startsWith(`${base.replace(/\/+$/, "")}/`));

/** Paths from the admin's "Specific pages" box: one per line (commas also work), each starting with /. */
export function parsePagePaths(pages: string): string[] {
  return pages.split(/[\n,]+/).map((p) => p.trim()).filter((p) => p.startsWith("/")).map((p) => (p.length > 1 ? p.replace(/\/+$/, "") : p));
}

export function popupShowsOn(p: Pick<SitePopup, "kind" | "pages">, pathname: string): boolean {
  if (p.kind !== "promo" && FORM_PAGES.some((f) => under(pathname, f))) return false;
  if (p.pages === "all") return true;
  if (p.pages === "home") return pathname === "/";
  return parsePagePaths(p.pages).some((base) => under(pathname, base));
}

export function describePages(pages: string): string {
  if (pages === "all") return "All pages";
  if (pages === "home") return "Home page only";
  const paths = parsePagePaths(pages);
  return paths.length ? paths.join(", ") : "No pages";
}
