import "server-only";
import { one, q } from "@/lib/db";

export const LINK_CHANNELS = ["Facebook", "Instagram", "WhatsApp", "Google", "Other"] as const;

/** An ad link (Admin → Ad links): /l/<slug> opens an enquiry page, and its leads are tagged with the link. */
export interface LeadLink {
  id: number; slug: string; name: string; channel: string; project_id: number | null; headline: string | null; intro: string | null;
  active: boolean; visits: number; created_at: Date; updated_at: Date;
  project_name: string | null; project_slug: string | null; leads: number;
}
export interface LeadLinkInput { slug: string; name: string; channel: string; project_id: number | null; headline: string | null; intro: string | null; active: boolean }

const SELECT = `SELECT k.*, p.name AS project_name, p.slug AS project_slug, (SELECT count(*)::int FROM leads l WHERE l.link_id = k.id) AS leads
  FROM lead_links k LEFT JOIN projects p ON p.id = k.project_id`;

export const listLeadLinks = () => q<LeadLink>(`${SELECT} ORDER BY k.active DESC, k.created_at DESC`);
export const getLeadLink = (id: number) => one<LeadLink>(`${SELECT} WHERE k.id = $1`, [id]);
export const getLeadLinkBySlug = (slug: string) => one<LeadLink>(`${SELECT} WHERE k.slug = $1`, [slug]);
export const slugTaken = async (slug: string, id: number | null) => !!(await one("SELECT 1 FROM lead_links WHERE slug = $1 AND id <> $2", [slug, id ?? 0]));
export const countLinkVisit = (id: number) => q("UPDATE lead_links SET visits = visits + 1 WHERE id = $1", [id]);

export const linkSlug = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export async function saveLeadLink(id: number | null, k: LeadLinkInput, userId: number): Promise<number> {
  const v = [k.slug, k.name, k.channel, k.project_id, k.headline, k.intro, k.active];
  if (id) {
    await q("UPDATE lead_links SET slug=$1, name=$2, channel=$3, project_id=$4, headline=$5, intro=$6, active=$7, updated_at=now() WHERE id=$8", [...v, id]);
    return id;
  }
  return (await one<{ id: number }>("INSERT INTO lead_links (slug, name, channel, project_id, headline, intro, active, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id", [...v, userId]))!.id;
}
