import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { json, one, q } from "./db";
import { toE164 } from "./records";
import { forwardLeads } from "./lead-webhook";
import { runAutoAssign } from "./auto-assign";
import { notifyAdmins } from "./notify";

/**
 * Facebook / Instagram Lead Ads (instant forms) → leads in the console.
 *
 * Meta POSTs a "leadgen" change to /api/leads/facebook the moment someone submits a form. The change only carries ids,
 * so the answers are fetched from the Graph API with the Page access token. Order of events, chosen so nothing is lost:
 *   1. the change is written to facebook_leads exactly as received (unique on Meta's leadgen_id, so repeats are harmless);
 *   2. Meta gets its 200 straight away;
 *   3. the answers are fetched and the lead is created (status done). A failure leaves the row pending/failed and it is
 *      retried on the next delivery and by /api/leads/facebook/sync, which also pulls every recent lead from Meta again.
 *
 * Settings (environment): META_APP_SECRET (signs deliveries), META_VERIFY_TOKEN (any phrase, typed once when the webhook
 * is registered), META_PAGE_ACCESS_TOKEN (a long-lived Page token with leads_retrieval). Optional META_GRAPH_VERSION.
 */

const GRAPH = (process.env.META_GRAPH_URL?.replace(/\/$/, "") || "https://graph.facebook.com") + "/" + (process.env.META_GRAPH_VERSION || "v23.0");
const STANDARD = new Set(["full_name", "first_name", "last_name", "email", "work_email", "phone_number", "work_phone_number", "city"]);
const MAX_ATTEMPTS = 8;

export const metaConfigured = () => !!(process.env.META_APP_SECRET && process.env.META_VERIFY_TOKEN && process.env.META_PAGE_ACCESS_TOKEN);

/** X-Hub-Signature-256 check: HMAC-SHA256 of the raw body with the app secret. */
export function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header || !header.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody, "utf8").digest("hex"));
  const given = Buffer.from(header.slice("sha256=".length).trim().toLowerCase());
  return given.length === expected.length && timingSafeEqual(given, expected);
}

interface LeadgenChange { ad_id?: string; adgroup_id?: string; form_id?: string; leadgen_id?: string; page_id?: string; created_time?: number }
interface FieldDatum { name: string; values: string[] }
interface LeadDetail {
  id: string; created_time?: string; field_data?: FieldDatum[]; ad_id?: string; ad_name?: string; adset_name?: string; campaign_name?: string;
  form_id?: string; platform?: string; is_organic?: boolean;
}
const DETAIL_FIELDS = "id,created_time,field_data,ad_id,ad_name,adset_name,campaign_name,form_id,platform,is_organic";

/** Saves every leadgen change of a webhook delivery. Returns how many were new. */
export async function storeWebhook(payload: unknown): Promise<number> {
  const entries = (payload as { object?: string; entry?: { id?: string; changes?: { field?: string; value?: LeadgenChange }[] }[] })?.entry ?? [];
  let fresh = 0;
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const v = change.value;
      if (change.field !== "leadgen" || !v?.leadgen_id) continue;
      const row = await one<{ id: number }>(
        "INSERT INTO facebook_leads (leadgen_id, page_id, form_id, ad_id, change) VALUES ($1,$2,$3,$4,$5::jsonb) ON CONFLICT (leadgen_id) DO NOTHING RETURNING id",
        [String(v.leadgen_id), v.page_id ?? entry.id ?? null, v.form_id ?? null, v.ad_id ?? null, json(v)],
      );
      if (row) fresh++;
    }
  }
  return fresh;
}

async function graph<T>(path: string, params: Record<string, string> = {}, method: "GET" | "POST" = "GET"): Promise<T> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN is not set");
  const url = new URL(path.startsWith("http") ? path : `${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url, { method, signal: AbortSignal.timeout(15000), cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; code?: number } };
  if (!res.ok || body?.error) throw new Error(`Graph API ${res.status}: ${body?.error?.message ?? "request failed"}${body?.error?.code ? ` (code ${body.error.code})` : ""}`);
  return body;
}

const label = (key: string) => key.replace(/_/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());

/** Turns a Graph API lead into a row of the leads table, creates it and tells the staff. */
async function createLead(fb: { id: number; leadgen_id: string; form_id: string | null }, d: LeadDetail): Promise<number> {
  const answers = new Map<string, string>();
  for (const f of d.field_data ?? []) {
    const v = (f.values ?? []).map((x) => String(x ?? "").trim()).filter(Boolean).join(", ");
    if (f.name && v) answers.set(f.name, v);
  }
  const name = (answers.get("full_name") || [answers.get("first_name"), answers.get("last_name")].filter(Boolean).join(" ") || "Facebook lead").slice(0, 120);
  const rawPhone = answers.get("phone_number") || answers.get("work_phone_number") || "";
  const e164 = toE164(rawPhone);
  const phone = e164 ?? (rawPhone.replace(/[^\d+]/g, "") ? `+${rawPhone.replace(/\D/g, "")}` : "—");
  const email = answers.get("email") || answers.get("work_email") || null;
  const locality = answers.get("city") || null;
  const isTest = /^test lead\b/i.test(name) || /dummy data/i.test(name);

  // The project is guessed from the campaign / ad set / ad names, which usually carry it ("Mexmon Heights - leads").
  const hay = [d.campaign_name, d.adset_name, d.ad_name].filter(Boolean).join(" | ");
  const project = hay ? await one<{ id: number }>("SELECT id FROM projects WHERE $1 ILIKE '%' || name || '%' ORDER BY length(name) DESC LIMIT 1", [hay]) : null;

  const custom = [...answers].filter(([k]) => !STANDARD.has(k));
  let interest: string | null = project ? "Buy" : null;
  let budget: string | null = null;
  const lines: string[] = [d.platform === "ig" ? "Instagram lead form" : "Facebook lead form", d.campaign_name && `Campaign: ${d.campaign_name}`, d.adset_name && `Ad set: ${d.adset_name}`, d.ad_name && `Ad: ${d.ad_name}`, d.is_organic && "Organic (not from a paid ad)"].filter(Boolean) as string[];
  for (const [k, v] of custom) {
    if (/budget|price/i.test(k) && !budget) budget = v.slice(0, 80);
    if (["Buy", "Sell", "Rent"].includes(v)) interest = v;
    lines.push(`${label(k).slice(0, 80)}: ${v.slice(0, 300)}`);
  }
  if (!e164) lines.push(`Phone as entered on Facebook: ${rawPhone || "not given"}`);
  const notes = lines.slice(0, 25).join("\n");
  const source = d.platform === "ig" ? "Instagram" : "Facebook";
  const createdAt = d.created_time && !Number.isNaN(Date.parse(d.created_time)) ? new Date(d.created_time) : new Date();

  const lead = await one<{ id: number }>(
    `INSERT INTO leads (name, phone, email, interest, budget, locality, project_id, source, status, notes, tags, whatsapp_opt_in, created_at, last_activity_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'New',$9,$10::jsonb,true,$11,$11) RETURNING id`,
    [name, phone, email, interest, budget, locality, project?.id ?? null, source, notes, json(isTest ? ["Test"] : []), createdAt],
  );
  const how = `${source} lead form${d.campaign_name ? ` · ${d.campaign_name}` : ""}`;
  await q("INSERT INTO lead_activities (lead_id, type, body, to_status, created_at) VALUES ($1, 'created', $2, 'New', $3)", [lead!.id, `${how} (Meta lead ${fb.leadgen_id})`, createdAt]);
  console.log("[facebook-lead]", lead!.id, name, phone, fb.leadgen_id);
  if (!isTest) await notifyAdmins({ kind: "new_lead", title: `New ${source} lead: ${name}`, body: `${phone} · ${d.campaign_name ?? "lead form"}`, path: `leads/${lead!.id}` }).catch((e) => console.error("[facebook-lead] notify", e));
  void forwardLeads([lead!.id]);
  return lead!.id;
}

interface PendingRow { id: number; leadgen_id: string; form_id: string | null; detail: LeadDetail | null }

/**
 * Creates leads for stored submissions that have none yet. Rows are claimed one at a time with a status change, so a
 * webhook burst and a sync running together never both create the same lead. Returns {done, failed}.
 */
export async function processPending(limit = 50): Promise<{ done: number; failed: number }> {
  const rows = await q<PendingRow>(
    `SELECT id, leadgen_id, form_id, detail FROM facebook_leads
      WHERE (status IN ('pending','failed') OR (status = 'processing' AND processed_at < now() - interval '10 minutes')) AND attempts < $1
      ORDER BY received_at LIMIT $2`,
    [MAX_ATTEMPTS, limit],
  );
  let done = 0, failed = 0;
  for (const r of rows) {
    const claimed = await one<{ id: number }>(
      "UPDATE facebook_leads SET status = 'processing', attempts = attempts + 1, processed_at = now() WHERE id = $1 AND (status IN ('pending','failed') OR (status = 'processing' AND processed_at < now() - interval '10 minutes')) RETURNING id",
      [r.id],
    );
    if (!claimed) continue;
    try {
      let detail = r.detail;
      if (!detail?.field_data) {
        detail = await graph<LeadDetail>(r.leadgen_id, { fields: DETAIL_FIELDS });
        await q("UPDATE facebook_leads SET detail = $2::jsonb WHERE id = $1", [r.id, json(detail)]);
      }
      const leadId = await createLead(r, detail);
      await q("UPDATE facebook_leads SET status = 'done', lead_id = $2, error = NULL, processed_at = now() WHERE id = $1", [r.id, leadId]);
      done++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[facebook-lead] failed", r.leadgen_id, msg);
      await q("UPDATE facebook_leads SET status = 'failed', error = $2, processed_at = now() WHERE id = $1", [r.id, msg.slice(0, 500)]).catch(() => undefined);
      failed++;
    }
  }
  if (done) await runAutoAssign().catch((e) => console.error("[facebook-lead] auto-assign", e));
  return { done, failed };
}

interface Paged<T> { data?: T[]; paging?: { next?: string } }
async function all<T>(path: string, params: Record<string, string>, max = 2000): Promise<T[]> {
  const out: T[] = [];
  let page = await graph<Paged<T>>(path, params);
  for (;;) {
    out.push(...(page.data ?? []));
    if (!page.paging?.next || out.length >= max) return out;
    page = await graph<Paged<T>>(page.paging.next);
  }
}

export interface SyncResult { page: string; subscribed: boolean; forms: number; seen: number; added: number; done: number; failed: number; since: string }

/**
 * Safety net: asks Meta for every lead of every form of the Page since `days` ago and stores the ones this server has
 * not got (a webhook missed while the site was down, or sent before the webhook existed). Then creates the leads.
 */
export async function syncFromMeta(days = 7): Promise<SyncResult> {
  const since = new Date(Date.now() - Math.min(Math.max(days, 1), 90) * 86400_000);
  const me = await graph<{ id: string; name?: string }>("me", { fields: "id,name" });
  // Also makes sure the Page sends its leadgen events to this app's webhook (safe to repeat; needs pages_manage_metadata).
  const subscribed = await graph<{ success?: boolean }>(`${me.id}/subscribed_apps`, { subscribed_fields: "leadgen" }, "POST").then((r) => !!r.success).catch((e) => { console.error("[facebook-lead] subscribe", e instanceof Error ? e.message : e); return false; });
  const forms = await all<{ id: string; name?: string; status?: string }>(`${me.id}/leadgen_forms`, { fields: "id,name,status", limit: "100" });
  let seen = 0, added = 0;
  for (const form of forms) {
    const leads = await all<LeadDetail>(`${form.id}/leads`, {
      fields: DETAIL_FIELDS, limit: "100",
      filtering: JSON.stringify([{ field: "time_created", operator: "GREATER_THAN", value: Math.floor(since.getTime() / 1000) }]),
    });
    for (const d of leads) {
      seen++;
      const row = await one<{ id: number }>(
        "INSERT INTO facebook_leads (leadgen_id, page_id, form_id, ad_id, detail) VALUES ($1,$2,$3,$4,$5::jsonb) ON CONFLICT (leadgen_id) DO NOTHING RETURNING id",
        [String(d.id), me.id, form.id, d.ad_id ?? null, json(d)],
      );
      if (row) added++;
    }
  }
  const { done, failed } = await processPending(500);
  return { page: me.name ?? me.id, subscribed, forms: forms.length, seen, added, done, failed, since: since.toISOString() };
}
