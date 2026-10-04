import "server-only";
import { one, q } from "@/lib/db";
import type { PopupKind, SitePopup } from "@/lib/popups";

export interface PopupRow {
  id: number; kind: PopupKind; title: string; text: string | null; image: string | null; cta_label: string | null; cta_href: string | null;
  pages: string; delay_seconds: number; start_date: string | Date | null; end_date: string | Date | null; active: boolean; created_at: Date; updated_at: Date;
}
export type PopupInput = Omit<PopupRow, "id" | "created_at" | "updated_at">;

/** Newest first: when several pop-ups suit a page, the newest one is shown. */
const ORDER = "ORDER BY created_at DESC, id DESC";
/** Dates are Indian calendar days. */
const TODAY = "(now() AT TIME ZONE 'Asia/Kolkata')::date";

export const listPopups = () => q<PopupRow>(`SELECT * FROM popups ${ORDER}`);
export const getPopup = (id: number) => one<PopupRow>("SELECT * FROM popups WHERE id = $1", [id]);

export async function savePopup(id: number | null, p: PopupInput): Promise<number> {
  const v = [p.kind, p.title, p.text, p.image, p.cta_label, p.cta_href, p.pages, p.delay_seconds, p.start_date, p.end_date, p.active];
  if (id) {
    await q("UPDATE popups SET kind=$1, title=$2, text=$3, image=$4, cta_label=$5, cta_href=$6, pages=$7, delay_seconds=$8, start_date=$9, end_date=$10, active=$11, updated_at=now() WHERE id=$12", [...v, id]);
    return id;
  }
  const r = await one<{ id: number }>("INSERT INTO popups (kind, title, text, image, cta_label, cta_href, pages, delay_seconds, start_date, end_date, active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id", v);
  return r!.id;
}

/** Pop-ups switched on and inside their dates today, newest first. */
export async function getLivePopups(): Promise<SitePopup[]> {
  const rows = await q<PopupRow>(`SELECT * FROM popups WHERE active AND (start_date IS NULL OR start_date <= ${TODAY}) AND (end_date IS NULL OR end_date >= ${TODAY}) ${ORDER}`);
  return rows.map((r) => ({ id: r.id, kind: r.kind, title: r.title, text: r.text, image: r.image, ctaLabel: r.cta_label, ctaHref: r.cta_href, pages: r.pages, delaySeconds: r.delay_seconds }));
}
