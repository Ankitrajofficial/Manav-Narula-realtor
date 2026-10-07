import "server-only";
import { json, one, q } from "@/lib/db";
import { pageOf, sortOf } from "@/lib/console";
import { logActivity } from "@/lib/records";
import { getWhatsAppConfig, isConfigured, placeholderOrder, renderMessage, sendMedia, sendTemplate, type Media, type MediaType, type Recipient } from "@/lib/whatsapp";
import { site } from "@/data/site";
import { getSettingValue } from "@/lib/queries/settings";

export interface Audience { kinds: ("prospect" | "lead")[]; statuses: string[]; tags: string[]; localities: string[]; interests: string[]; optInOnly: boolean }
// Campaigns go only to people in the lead database (leads), never to prospects.
export const DEFAULT_AUDIENCE: Audience = { kinds: ["lead"], statuses: [], tags: [], localities: [], interests: [], optInOnly: true };

export interface CampaignRow {
  [key: string]: unknown;
  id: number; name: string; message: string; message_type: string; template_name: string | null; template_language: string; audience: Audience;
  status: string; scheduled_at: Date | null; started_at: Date | null; sent_at: Date | null; total: number; sent_count: number; failed_count: number; skipped_count: number;
  media_type: MediaType; media_url: string | null; media_filename: string | null; variants: string[]; window_start: number; window_end: number; daily_cap: number; gap_seconds: number;
  created_by: number | null; creator_name: string | null; created_at: Date; updated_at: Date;
  /** The project this campaign is about (null: general knowledge). */
  project_id: number | null; project_name: string | null;
}
/** A check-in sent later to the leads who received a campaign (e.g. "did the brochure reach you?"). */
export interface FollowupRow { id: number; campaign_id: number; message: string; message_type: string; template_name: string | null; template_language: string; created_at: Date; sent: number; queued: number; failed: number }
export interface TemplateRow { [key: string]: unknown; id: number; name: string; message: string; variants: string[]; message_type: string; template_name: string | null; template_language: string; media_type: MediaType; media_url: string | null; media_filename: string | null; created_at: Date }

/** Meta must be able to download media, so uploads are addressed by the public site URL (PUBLIC_URL overrides in staging). */
export function publicMediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const base = (process.env.PUBLIC_URL || site.url).replace(/\/$/, "");
  return `${base}${path}`;
}
export const mediaOf = (c: { media_type: MediaType; media_url: string | null; media_filename: string | null }): Media => ({ type: c.media_type ?? "none", link: publicMediaUrl(c.media_url) ?? "", filename: c.media_filename });

/** Picks the base message or one of its variants at random so a batch does not read as one identical blast. */
export function pickVariant(c: { message: string; variants: string[] }): string {
  const all = [c.message, ...(c.variants ?? []).filter((v) => v && v.trim())];
  return all[Math.floor(Math.random() * all.length)];
}

export const listTemplates = () => q<TemplateRow>("SELECT * FROM campaign_templates ORDER BY created_at DESC");
export const getTemplate = (id: number) => one<TemplateRow>("SELECT * FROM campaign_templates WHERE id = $1", [id]);
export interface MessageRow { [key: string]: unknown; id: number; campaign_id: number; lead_id: number | null; prospect_id: number | null; phone: string; name: string | null; body: string | null; status: string; provider_id: string | null; error: string | null; sent_at: Date | null; followup_id: number | null }

const SORTS: Record<string, string> = { name: "c.name", status: "c.status", created_at: "c.created_at", sent_at: "c.sent_at", total: "c.total" };

export async function listCampaigns(sp: Record<string, string | undefined>) {
  const conds: string[] = []; const params: unknown[] = [];
  if (sp.q?.trim()) { params.push(`%${sp.q.trim()}%`); conds.push(`(c.name ILIKE $${params.length} OR c.message ILIKE $${params.length})`); }
  if (sp.status) { params.push(sp.status); conds.push(`c.status = $${params.length}`); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const sort = sortOf(sp, SORTS, "created_at");
  const { page, size, offset } = pageOf(sp, 20);
  const count = await one<{ n: number }>(`SELECT count(*)::int AS n FROM campaigns c ${where}`, params);
  const rows = await q<CampaignRow>(`SELECT c.*, u.name AS creator_name, p.name AS project_name FROM campaigns c LEFT JOIN users u ON u.id = c.created_by LEFT JOIN projects p ON p.id = c.project_id ${where} ORDER BY ${sort.sql} LIMIT ${size} OFFSET ${offset}`, params);
  return { rows, total: Number(count?.n ?? 0), page, size, sortKey: sort.key, sortDir: sort.dir };
}

export const getCampaign = (id: number) => one<CampaignRow>("SELECT c.*, u.name AS creator_name, p.name AS project_name FROM campaigns c LEFT JOIN users u ON u.id = c.created_by LEFT JOIN projects p ON p.id = c.project_id WHERE c.id = $1", [id]);
/** The campaign's own messages (not its follow-ups). */
export const listMessages = (campaignId: number) => q<MessageRow>("SELECT * FROM campaign_messages WHERE campaign_id = $1 AND followup_id IS NULL ORDER BY id", [campaignId]);
export const listFollowups = (campaignId: number) => q<FollowupRow>(
  `SELECT f.*, (SELECT count(*)::int FROM campaign_messages m WHERE m.followup_id = f.id AND m.status = 'Sent') AS sent,
     (SELECT count(*)::int FROM campaign_messages m WHERE m.followup_id = f.id AND m.status = 'Queued') AS queued,
     (SELECT count(*)::int FROM campaign_messages m WHERE m.followup_id = f.id AND m.status = 'Failed') AS failed
   FROM campaign_followups f WHERE f.campaign_id = $1 ORDER BY f.created_at`, [campaignId]);
/** Leads who received this campaign's message and so can get a follow-up. */
export const receivedCount = async (campaignId: number) => Number((await one<{ n: number }>("SELECT count(*)::int AS n FROM campaign_messages WHERE campaign_id = $1 AND followup_id IS NULL AND status = 'Sent' AND lead_id IS NOT NULL", [campaignId]))?.n ?? 0);

export function parseAudience(v: unknown): Audience {
  const a = (v && typeof v === "object" ? v : {}) as Partial<Audience>;
  const arr = (x: unknown) => (Array.isArray(x) ? x.map(String) : []);
  // Leads only: older drafts that also chose prospects are narrowed to leads.
  return { kinds: ["lead"], statuses: arr(a.statuses), tags: arr(a.tags), localities: arr(a.localities), interests: arr(a.interests), optInOnly: a.optInOnly !== false };
}

/** Everyone the audience rules match, de-duplicated on phone. Prospects always require WhatsApp opt-in; leads follow the optInOnly flag. */
export async function resolveAudience(a: Audience): Promise<Recipient[]> {
  const out: Recipient[] = [];
  const build = (kind: "lead" | "prospect") => {
    const t = kind === "lead" ? "leads" : "prospects";
    const conds = ["l.status NOT IN ('Closed lost')"]; const params: unknown[] = [];
    if (kind === "prospect" || a.optInOnly) conds.push("l.whatsapp_opt_in = true");
    if (a.statuses.length) { params.push(json(a.statuses)); conds.push(`l.status IN (SELECT value FROM jsonb_array_elements_text($${params.length}::jsonb))`); }
    if (a.localities.length) { params.push(json(a.localities)); conds.push(`l.locality IN (SELECT value FROM jsonb_array_elements_text($${params.length}::jsonb))`); }
    if (a.interests.length) { params.push(json(a.interests)); conds.push(`l.interest IN (SELECT value FROM jsonb_array_elements_text($${params.length}::jsonb))`); }
    if (a.tags.length) { params.push(json(a.tags)); conds.push(`EXISTS (SELECT 1 FROM jsonb_array_elements_text(l.tags) t WHERE t.value IN (SELECT value FROM jsonb_array_elements_text($${params.length}::jsonb)))`); }
    return { sql: `SELECT '${kind}' AS kind, l.id, l.name, l.phone, l.locality, l.interest, l.budget, u.name AS employee, l.whatsapp_opt_in AS opt_in FROM ${t} l LEFT JOIN users u ON u.id = l.assigned_to WHERE ${conds.join(" AND ")} ORDER BY l.name`, params };
  };
  const seen = new Set<string>();
  for (const kind of a.kinds) {
    const b = build(kind);
    for (const r of await q<Recipient>(b.sql, b.params)) {
      if (seen.has(r.phone)) continue;
      seen.add(r.phone); out.push(r);
    }
  }
  return out;
}

/**
 * The audience for a campaign, minus leads who already got (or are queued for) a message about the same project in another
 * campaign. Those are returned separately so the campaign can record them as skipped.
 */
export async function audienceFor(a: Audience, projectId: number | null, campaignId: number | null): Promise<{ recipients: Recipient[]; alreadyMessaged: (Recipient & { previous: string })[] }> {
  const all = await resolveAudience(a);
  if (!projectId) return { recipients: all, alreadyMessaged: [] };
  const seen = new Map((await q<{ lead_id: number; name: string }>(
    `SELECT DISTINCT ON (m.lead_id) m.lead_id, c.name FROM campaign_messages m JOIN campaigns c ON c.id = m.campaign_id
     WHERE c.project_id = $1 AND c.id <> $2 AND m.followup_id IS NULL AND m.lead_id IS NOT NULL AND m.status IN ('Sent', 'Queued')
     ORDER BY m.lead_id, m.sent_at DESC NULLS LAST`, [projectId, campaignId ?? 0])).map((r) => [r.lead_id, r.name]));
  const recipients: Recipient[] = []; const alreadyMessaged: (Recipient & { previous: string })[] = [];
  for (const r of all) {
    if (r.kind === "lead" && seen.has(r.id)) alreadyMessaged.push({ ...r, previous: seen.get(r.id)! });
    else recipients.push(r);
  }
  return { recipients, alreadyMessaged };
}

export async function audienceOptions() {
  const [localities, tags] = await Promise.all([
    q<{ name: string }>("SELECT name FROM localities ORDER BY sort_order, name").then((r) => r.map((x) => x.name)),
    q<{ name: string }>("SELECT name FROM tags ORDER BY name").then((r) => r.map((x) => x.name)),
  ]);
  return { localities, tags };
}

/** Queue the recipients as message rows (idempotent per campaign) and return how many were queued. */
export async function queueCampaign(c: CampaignRow, ourPhone: string): Promise<number> {
  await q("DELETE FROM campaign_messages WHERE campaign_id = $1 AND followup_id IS NULL AND status IN ('Queued', 'Skipped')", [c.id]);
  const { recipients, alreadyMessaged } = await audienceFor(parseAudience(c.audience), c.project_id, c.id);
  const already = new Set((await q<{ phone: string }>("SELECT phone FROM campaign_messages WHERE campaign_id = $1 AND followup_id IS NULL", [c.id])).map((r) => r.phone));
  // Recorded, not sent: one message per lead per project, so a new project needs a new campaign.
  for (const r of alreadyMessaged) {
    if (already.has(r.phone)) continue;
    await q("INSERT INTO campaign_messages (campaign_id, lead_id, phone, name, status, error) VALUES ($1,$2,$3,$4,'Skipped',$5)", [c.id, r.id, r.phone, r.name, `Already received a message about ${c.project_name ?? "this project"} (campaign "${r.previous}")`]);
    already.add(r.phone);
  }
  let n = 0;
  for (const r of recipients) {
    if (already.has(r.phone)) continue;
    await q("INSERT INTO campaign_messages (campaign_id, lead_id, prospect_id, phone, name, body, status) VALUES ($1,$2,$3,$4,$5,$6,'Queued')", [c.id, r.kind === "lead" ? r.id : null, r.kind === "prospect" ? r.id : null, r.phone, r.name, renderMessage(pickVariant(c), r, ourPhone)]);
    n++;
  }
  await q("UPDATE campaigns SET total = (SELECT count(*) FROM campaign_messages WHERE campaign_id = $1 AND followup_id IS NULL AND status <> 'Skipped'), skipped_count = (SELECT count(*) FROM campaign_messages WHERE campaign_id = $1 AND followup_id IS NULL AND status = 'Skipped'), updated_at = now() WHERE id = $1", [c.id]);
  return n;
}

/**
 * Queues a follow-up for every lead who received the campaign, is not closed-lost, still opted in when the campaign asks
 * for opt-in, and has not had this follow-up yet. The campaign's sender then delivers it inside the usual window and cap.
 */
export async function queueFollowup(c: CampaignRow, followupId: number, message: string, ourPhone: string): Promise<number> {
  const a = parseAudience(c.audience);
  const rows = await q<Recipient>(
    `SELECT 'lead' AS kind, l.id, l.name, l.phone, l.locality, l.interest, l.budget, u.name AS employee, l.whatsapp_opt_in AS opt_in
     FROM campaign_messages m JOIN leads l ON l.id = m.lead_id LEFT JOIN users u ON u.id = l.assigned_to
     WHERE m.campaign_id = $1 AND m.followup_id IS NULL AND m.status = 'Sent' AND l.status NOT IN ('Closed lost') ${a.optInOnly ? "AND l.whatsapp_opt_in = true" : ""}
       AND NOT EXISTS (SELECT 1 FROM campaign_messages f WHERE f.followup_id = $2 AND f.lead_id = l.id)`, [c.id, followupId]);
  for (const r of rows) await q("INSERT INTO campaign_messages (campaign_id, followup_id, lead_id, phone, name, body, status) VALUES ($1,$2,$3,$4,$5,$6,'Queued')", [c.id, followupId, r.id, r.phone, r.name, renderMessage(message, r, ourPhone)]);
  if (rows.length) await q("UPDATE campaigns SET status = CASE WHEN status = 'Paused' THEN status ELSE 'Sending' END, updated_at = now() WHERE id = $1", [c.id]);
  return rows.length;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const istHour = () => Number(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }));

/**
 * Sends a campaign the organic way: only inside its sending window (IST), never more than the daily cap,
 * a random pause between messages, and at most one batch per call so a request never runs for minutes.
 * The campaign stays "Sending" until the queue is empty; runDueCampaigns keeps picking it up.
 */
export async function runCampaign(id: number, userId: number | null, batch = 40): Promise<{ sent: number; failed: number; skipped: number; remaining: number; error?: string; paused?: string }> {
  const c = await getCampaign(id);
  if (!c) return { sent: 0, failed: 0, skipped: 0, remaining: 0, error: "Campaign not found" };
  const cfg = await getWhatsAppConfig();
  if (!isConfigured(cfg)) return { sent: 0, failed: 0, skipped: 0, remaining: 0, error: "WhatsApp API is not connected. Add it under Settings." };
  const business = await getSettingValue<{ phone?: string }>("business", {});
  if (c.status !== "Sending") {
    await q("UPDATE campaigns SET status = 'Sending', started_at = COALESCE(started_at, now()), updated_at = now() WHERE id = $1", [id]);
    await queueCampaign(c, business.phone ?? "");
  }
  const remainingNow = async () => Number((await one<{ n: number }>("SELECT count(*)::int AS n FROM campaign_messages WHERE campaign_id = $1 AND status = 'Queued'", [id]))?.n ?? 0);
  const hour = istHour();
  if (hour < c.window_start || hour >= c.window_end) {
    return { sent: 0, failed: 0, skipped: 0, remaining: await remainingNow(), paused: `Outside the sending window (${c.window_start}:00 to ${c.window_end}:00 IST). It resumes automatically.` };
  }
  const sentToday = Number((await one<{ n: number }>("SELECT count(*)::int AS n FROM campaign_messages WHERE campaign_id = $1 AND status = 'Sent' AND sent_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata'", [id]))?.n ?? 0);
  const allowance = Math.max(0, Math.min(batch, c.daily_cap - sentToday));
  if (allowance === 0) return { sent: 0, failed: 0, skipped: 0, remaining: await remainingNow(), paused: `Daily cap of ${c.daily_cap} reached. It resumes tomorrow.` };

  const queued = await q<MessageRow>(`SELECT * FROM campaign_messages WHERE campaign_id = $1 AND status = 'Queued' ORDER BY id LIMIT ${allowance}`, [id]);
  const followups = new Map((await q<{ id: number; message: string; message_type: string; template_name: string | null; template_language: string }>("SELECT id, message, message_type, template_name, template_language FROM campaign_followups WHERE campaign_id = $1", [id])).map((f) => [f.id, f]));
  const order = placeholderOrder(c.message);
  const media = mediaOf(c);
  let sent = 0, failed = 0;
  for (const [i, m] of queued.entries()) {
    if (i > 0) await sleep(Math.max(500, (c.gap_seconds * 1000) * (0.6 + Math.random() * 0.8)));
    let res: { ok: true; id: string } | { ok: false; error: string };
    const fu = m.followup_id ? followups.get(m.followup_id) : undefined;
    if (fu) {
      // Follow-ups are plain text or their own approved template, without the campaign's attachment.
      if (fu.message_type === "template" && fu.template_name) {
        const r = (await one<Recipient>("SELECT 'lead' AS kind, l.id, l.name, l.phone, l.locality, l.interest, l.budget, u.name AS employee, true AS opt_in FROM leads l LEFT JOIN users u ON u.id = l.assigned_to WHERE l.id = $1", [m.lead_id]));
        res = r ? await sendTemplate(cfg, m.phone, fu.template_name, fu.template_language, placeholderOrder(fu.message).map((k) => renderMessage(`{{${k}}}`, r, business.phone ?? "")), { type: "none", link: "", filename: null }) : { ok: false, error: "Lead no longer exists" };
      } else {
        res = await sendMedia(cfg, m.phone, { type: "none", link: "", filename: null }, m.body ?? fu.message);
      }
    } else if (c.message_type === "template" && c.template_name) {
      const rec: Recipient = { kind: m.lead_id ? "lead" : "prospect", id: m.lead_id ?? m.prospect_id ?? 0, name: m.name ?? "", phone: m.phone, locality: null, interest: null, budget: null, employee: null, opt_in: true };
      const full = (await one<Recipient>(m.lead_id ? "SELECT l.locality, l.interest, l.budget, u.name AS employee FROM leads l LEFT JOIN users u ON u.id = l.assigned_to WHERE l.id = $1" : "SELECT l.locality, l.interest, l.budget, u.name AS employee FROM prospects l LEFT JOIN users u ON u.id = l.assigned_to WHERE l.id = $1", [rec.id])) ?? rec;
      const merged = { ...rec, ...full };
      const params = order.map((k) => renderMessage(`{{${k}}}`, merged, business.phone ?? ""));
      res = await sendTemplate(cfg, m.phone, c.template_name, c.template_language, params, media);
    } else {
      res = await sendMedia(cfg, m.phone, media, m.body ?? c.message);
    }
    if (res.ok) {
      sent++;
      await q("UPDATE campaign_messages SET status = 'Sent', provider_id = $1, sent_at = now() WHERE id = $2", [res.id, m.id]);
      await logActivity({ leadId: m.lead_id, prospectId: m.prospect_id, userId, type: "whatsapp", body: fu ? `Campaign "${c.name}" follow-up sent` : `Campaign "${c.name}" sent` });
    } else {
      failed++;
      await q("UPDATE campaign_messages SET status = 'Failed', error = $1 WHERE id = $2", [res.error.slice(0, 500), m.id]);
    }
  }
  const remaining = await remainingNow();
  const skipped = Number((await one<{ n: number }>("SELECT count(*)::int AS n FROM campaign_messages WHERE campaign_id = $1 AND followup_id IS NULL AND status = 'Skipped'", [id]))?.n ?? 0);
  if (remaining === 0) {
    // The campaign's figures count its own message only; follow-ups have their own counts.
    const totals = await one<{ s: number; f: number }>("SELECT count(*) FILTER (WHERE status = 'Sent')::int AS s, count(*) FILTER (WHERE status = 'Failed')::int AS f FROM campaign_messages WHERE campaign_id = $1 AND followup_id IS NULL", [id]);
    const status = totals && totals.f && !totals.s ? "Failed" : "Sent";
    await q("UPDATE campaigns SET status = $1, sent_at = now(), sent_count = $2, failed_count = $3, skipped_count = $4, updated_at = now() WHERE id = $5", [status, totals?.s ?? 0, totals?.f ?? 0, skipped, id]);
  } else {
    await q(`UPDATE campaigns SET sent_count = (SELECT count(*) FROM campaign_messages WHERE campaign_id = $1 AND followup_id IS NULL AND status = 'Sent'),
      failed_count = (SELECT count(*) FROM campaign_messages WHERE campaign_id = $1 AND followup_id IS NULL AND status = 'Failed'), updated_at = now() WHERE id = $1`, [id]);
  }
  return { sent, failed, skipped, remaining };
}

/** Sends every campaign whose scheduled time has passed. Called from the campaigns page and from /api/campaigns/run. */
export async function runDueCampaigns(userId: number | null): Promise<number> {
  const due = await q<{ id: number }>("SELECT id FROM campaigns WHERE (status = 'Scheduled' AND scheduled_at <= now()) OR status = 'Sending' ORDER BY scheduled_at NULLS FIRST, id");
  for (const d of due) await runCampaign(d.id, userId);
  return due.length;
}
