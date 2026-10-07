"use server";
import { redirect } from "next/navigation";
import { one, q, json } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/records";
import { getCampaign, mediaOf, parseAudience, queueFollowup, resolveAudience, runCampaign, type Audience } from "@/lib/queries/campaigns";
import { getSettingValue } from "@/lib/queries/settings";
import { getWhatsAppConfig, isConfigured, sendMedia, sendTemplate, type MediaType } from "@/lib/whatsapp";
import { saveUpload } from "@/lib/upload";

export interface CampaignFormState { errors?: Record<string, string>; error?: string }

const MEDIA_TYPES: MediaType[] = ["none", "image", "document", "video"];
const clampInt = (v: unknown, lo: number, hi: number, d: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d; };

function parse(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim();
  const message = String(fd.get("message") ?? "").trim();
  const variants = ["variant_b", "variant_c"].map((k) => String(fd.get(k) ?? "").trim()).filter((v) => v.length > 0);
  const message_type = fd.get("message_type") === "template" ? "template" : "text";
  const template_name = String(fd.get("template_name") ?? "").trim() || null;
  const template_language = String(fd.get("template_language") ?? "en").trim() || "en";
  const media_type_raw = String(fd.get("media_type") ?? "none") as MediaType;
  const media_type: MediaType = MEDIA_TYPES.includes(media_type_raw) ? media_type_raw : "none";
  const media_current = String(fd.get("media_current") ?? "").trim() || null;
  const media_filename_current = String(fd.get("media_filename_current") ?? "").trim() || null;
  const media_file = fd.get("media_file");
  const window_start = clampInt(fd.get("window_start"), 0, 23, 10);
  const window_end = clampInt(fd.get("window_end"), 1, 24, 19);
  const daily_cap = clampInt(fd.get("daily_cap"), 1, 5000, 200);
  const gap_seconds = clampInt(fd.get("gap_seconds"), 1, 120, 3);
  const audience: Audience = parseAudience({
    kinds: fd.getAll("kinds").map(String),
    statuses: fd.getAll("statuses").map(String),
    tags: fd.getAll("tags").map(String),
    localities: fd.getAll("localities").map(String),
    interests: fd.getAll("interests").map(String),
    optInOnly: fd.get("optInOnly") === "1",
  });
  const project_id = Number(fd.get("project_id")) || null;
  const scheduleDate = String(fd.get("schedule_date") ?? "").trim();
  const scheduleTime = String(fd.get("schedule_time") ?? "10:00").trim() || "10:00";
  const scheduled_at = scheduleDate ? new Date(`${scheduleDate}T${scheduleTime}:00`) : null;
  const errors: Record<string, string> = {};
  if (name.length < 3) errors.name = "Give the campaign a name of at least 3 characters.";
  if (message.length < 5) errors.message = "Write the message.";
  if (message.length > 1024) errors.message = "Keep the message under 1,024 characters.";
  if (variants.some((v) => v.length > 1024)) errors.variants = "Keep each variant under 1,024 characters.";
  if (message_type === "template" && !template_name) errors.template_name = "Enter the approved template name.";
  if (!audience.kinds.length) errors.kinds = "Campaigns go to leads.";
  if (scheduled_at && Number.isNaN(scheduled_at.getTime())) errors.schedule_date = "Enter a valid date.";
  if (window_end <= window_start) errors.window = "The sending window must end after it starts.";
  return { name, message, variants, message_type, template_name, template_language, media_type, media_current, media_filename_current, media_file: media_file instanceof File ? media_file : null, window_start, window_end, daily_cap, gap_seconds, audience, scheduled_at, project_id, errors };
}

/** Validates and stores the attached media. Returns the stored URL and original filename, or an error string. */
async function storeMedia(c: ReturnType<typeof parse>): Promise<{ url: string | null; filename: string | null; error?: string }> {
  if (c.media_type === "none") return { url: null, filename: null };
  const f = c.media_file;
  if (f && f.size > 0) {
    const okType = c.media_type === "image" ? f.type.startsWith("image/") : c.media_type === "document" ? f.type === "application/pdf" : f.type.startsWith("video/");
    if (!okType) return { url: null, filename: null, error: c.media_type === "image" ? "Attach a JPG, PNG or WebP image." : c.media_type === "document" ? "Attach a PDF brochure." : "Attach an MP4 video." };
    const limit = c.media_type === "image" ? 5 : 16;
    if (f.size > limit * 1024 * 1024) return { url: null, filename: null, error: `Meta accepts ${c.media_type}s up to ${limit} MB.` };
    try {
      const url = await saveUpload(f, "campaigns");
      return { url, filename: f.name };
    } catch (e) {
      return { url: null, filename: null, error: (e as Error).message };
    }
  }
  if (c.media_current) return { url: c.media_current, filename: c.media_filename_current };
  return { url: null, filename: null, error: "Attach the file for this media type, or set media to none." };
}

async function save(id: number | null, fd: FormData, userId: number): Promise<{ id: number } | CampaignFormState> {
  const c = parse(fd);
  if (Object.keys(c.errors).length) { console.warn("[campaign] validation failed", c.errors); return { errors: c.errors }; }
  const media = await storeMedia(c);
  if (media.error) return { errors: { media: media.error } };
  const cols = [c.name, c.message, json(c.variants), c.message_type, c.template_name, c.template_language, json(c.audience), c.media_type, media.url, media.filename, c.window_start, c.window_end, c.daily_cap, c.gap_seconds, c.project_id];
  if (id) {
    await q("UPDATE campaigns SET name=$1, message=$2, variants=$3::jsonb, message_type=$4, template_name=$5, template_language=$6, audience=$7::jsonb, media_type=$8, media_url=$9, media_filename=$10, window_start=$11, window_end=$12, daily_cap=$13, gap_seconds=$14, project_id=$15, updated_at=now() WHERE id=$16", [...cols, id]);
    await audit(userId, "update", "campaign", id, { name: c.name, media: c.media_type });
    return { id };
  }
  const row = await one<{ id: number }>("INSERT INTO campaigns (name, message, variants, message_type, template_name, template_language, audience, media_type, media_url, media_filename, window_start, window_end, daily_cap, gap_seconds, project_id, status, created_by) VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15,'Draft',$16) RETURNING id", [...cols, userId]);
  await audit(userId, "create", "campaign", row!.id, { name: c.name, media: c.media_type });
  return { id: row!.id };
}

/** One action, three buttons: intent = draft | send | schedule. */
export async function saveCampaign(id: number | null, _prev: CampaignFormState, fd: FormData): Promise<CampaignFormState> {
  const user = await requireUser("admin");
  const intent = String(fd.get("intent") ?? "draft");
  const r = await save(id, fd, user.id);
  if (!("id" in r)) return r;
  const c = parse(fd);
  const count = (await resolveAudience(c.audience)).length;
  if (intent === "template") {
    const saved = await getCampaign(r.id);
    await one("INSERT INTO campaign_templates (name, message, variants, message_type, template_name, template_language, media_type, media_url, media_filename, created_by) VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10) RETURNING id", [c.name, c.message, json(c.variants), c.message_type, c.template_name, c.template_language, saved?.media_type ?? "none", saved?.media_url ?? null, saved?.media_filename ?? null, user.id]);
    await audit(user.id, "create", "campaign_template", null, { name: c.name });
    redirect(`/admin/campaigns/${r.id}?toast=${encodeURIComponent(`Saved, and kept as a reusable template`)}`);
  }
  if (intent === "draft") redirect(`/admin/campaigns/${r.id}?toast=${encodeURIComponent(`Draft saved · ${count} in audience`)}`);
  if (count === 0) return { error: "Nobody matches this audience yet. Widen the filters or collect WhatsApp opt-ins first." };
  const cfg = await getWhatsAppConfig();
  if (!isConfigured(cfg)) return { error: "Connect the WhatsApp API under Settings before sending." };
  if (intent === "schedule") {
    if (!c.scheduled_at) return { errors: { schedule_date: "Pick a date and time to schedule." } };
    await q("UPDATE campaigns SET status='Scheduled', scheduled_at=$1, updated_at=now() WHERE id=$2", [c.scheduled_at.toISOString(), r.id]);
    await audit(user.id, "schedule", "campaign", r.id, { at: c.scheduled_at.toISOString(), audience: count });
    redirect(`/admin/campaigns/${r.id}?toast=${encodeURIComponent(`Scheduled for ${c.scheduled_at.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`)}`);
  }
  if (fd.get("confirm") !== "1") return { error: `Tick "I have checked the message and audience" to send to ${count} people.` };
  const res = await runCampaign(r.id, user.id);
  await audit(user.id, "send", "campaign", r.id, res);
  redirect(`/admin/campaigns/${r.id}?${runToast(res)}`);
}

function runToast(res: { sent: number; failed: number; remaining: number; error?: string; paused?: string }) {
  if (res.error) return `error=${encodeURIComponent(res.error)}`;
  if (res.paused) return `toast=${encodeURIComponent(`${res.sent ? `Sent ${res.sent}. ` : ""}${res.paused} ${res.remaining} waiting.`)}`;
  return `toast=${encodeURIComponent(res.remaining ? `Sent ${res.sent} this batch, ${res.remaining} still queued; open this page or let the cron continue.` : `Done: sent ${res.sent}, failed ${res.failed}`)}`;
}

export async function sendNowAction(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  const res = await runCampaign(id, user.id);
  await audit(user.id, "send", "campaign", id, res);
  redirect(`/admin/campaigns/${id}?${runToast(res)}`);
}

export async function retryFailedAction(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  await q("UPDATE campaign_messages SET status = 'Queued', error = NULL WHERE campaign_id = $1 AND status = 'Failed'", [id]);
  await q("UPDATE campaigns SET status = 'Sending', updated_at = now() WHERE id = $1", [id]);
  const res = await runCampaign(id, user.id);
  await audit(user.id, "retry", "campaign", id, res);
  redirect(`/admin/campaigns/${id}?${runToast(res)}`);
}

export async function pauseCampaignAction(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  await q("UPDATE campaigns SET status = 'Paused', updated_at = now() WHERE id = $1 AND status = 'Sending'", [id]);
  await audit(user.id, "pause", "campaign", id);
  redirect(`/admin/campaigns/${id}?toast=${encodeURIComponent("Paused. Queued messages wait until you resume.")}`);
}

export async function resumeCampaignAction(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  await q("UPDATE campaigns SET status = 'Sending', updated_at = now() WHERE id = $1 AND status = 'Paused'", [id]);
  const res = await runCampaign(id, user.id);
  await audit(user.id, "resume", "campaign", id, res);
  redirect(`/admin/campaigns/${id}?${runToast(res)}`);
}

export async function deleteTemplateAction(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  await q("DELETE FROM campaign_templates WHERE id = $1", [id]);
  await audit(user.id, "delete", "campaign_template", id);
  redirect(`/admin/campaigns/templates?toast=${encodeURIComponent("Template deleted")}`);
}

export async function cancelScheduleAction(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  await q("UPDATE campaigns SET status='Draft', scheduled_at=NULL, updated_at=now() WHERE id=$1 AND status='Scheduled'", [id]);
  await audit(user.id, "unschedule", "campaign", id);
  redirect(`/admin/campaigns/${id}?toast=${encodeURIComponent("Schedule cancelled, back to draft")}`);
}

export async function duplicateCampaignAction(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  const c = await getCampaign(id);
  if (!c) redirect("/admin/campaigns");
  const row = await one<{ id: number }>("INSERT INTO campaigns (name, message, variants, message_type, template_name, template_language, audience, media_type, media_url, media_filename, window_start, window_end, daily_cap, gap_seconds, project_id, status, created_by) VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15,'Draft',$16) RETURNING id", [`${c.name} (copy)`, c.message, json(c.variants ?? []), c.message_type, c.template_name, c.template_language, json(c.audience), c.media_type, c.media_url, c.media_filename, c.window_start, c.window_end, c.daily_cap, c.gap_seconds, c.project_id, user.id]);
  redirect(`/admin/campaigns/${row!.id}?toast=${encodeURIComponent("Copied as a new draft")}`);
}

export async function deleteCampaignAction(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  const c = await getCampaign(id);
  await q("DELETE FROM campaigns WHERE id=$1", [id]);
  await audit(user.id, "delete", "campaign", id, { name: c?.name });
  redirect(`/admin/campaigns?toast=${encodeURIComponent("Campaign deleted")}`);
}

/** Sends the campaign message to one number so the admin can check wording before the real send. */
export async function sendTestAction(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  const to = String(fd.get("to") ?? "").replace(/\D/g, "").slice(-10);
  const c = await getCampaign(id);
  if (!c) redirect("/admin/campaigns");
  if (!/^[6-9]\d{9}$/.test(to)) redirect(`/admin/campaigns/${id}?error=${encodeURIComponent("Enter a 10-digit mobile number for the test")}`);
  const cfg = await getWhatsAppConfig();
  if (!isConfigured(cfg)) redirect(`/admin/campaigns/${id}?error=${encodeURIComponent("Connect the WhatsApp API under Settings first")}`);
  const sample = { kind: "prospect" as const, id: 0, name: user.name, phone: `+91${to}`, locality: "Model Town", interest: "Buy", budget: "₹50 L to ₹1 Cr", employee: user.name, opt_in: true };
  const { renderMessage, placeholderOrder } = await import("@/lib/whatsapp");
  const media = mediaOf(c);
  const res = c.message_type === "template" && c.template_name
    ? await sendTemplate(cfg, sample.phone, c.template_name, c.template_language, placeholderOrder(c.message).map((k) => renderMessage(`{{${k}}}`, sample, "")), media)
    : await sendMedia(cfg, sample.phone, media, renderMessage(c.message, sample, ""));
  await audit(user.id, "test_send", "campaign", id, { to: `+91${to}`, ok: res.ok });
  redirect(`/admin/campaigns/${id}?${res.ok ? `toast=${encodeURIComponent(`Test sent to +91 ${to}`)}` : `error=${encodeURIComponent(res.error)}`}`);
}

/**
 * A follow-up in a running or finished campaign: a short check-in or acknowledgement that goes only to the leads who
 * received the campaign, once each. It is delivered by the same sender (window, daily cap, pauses).
 */
export async function sendFollowupAction(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  const back = `/admin/campaigns/${id}`;
  const c = await getCampaign(id);
  if (!c) redirect("/admin/campaigns");
  const message = String(fd.get("followup_message") ?? "").trim();
  const message_type = fd.get("followup_type") === "template" ? "template" : "text";
  const template_name = String(fd.get("followup_template") ?? "").trim() || null;
  const fail = (m: string) => redirect(`${back}?error=${encodeURIComponent(m)}#followups`);
  if (message.length < 5) fail("Write the follow-up message.");
  if (message.length > 1024) fail("Keep the follow-up under 1,024 characters.");
  if (message_type === "template" && !template_name) fail("Enter the approved template name for the follow-up.");
  const row = await one<{ id: number }>("INSERT INTO campaign_followups (campaign_id, message, message_type, template_name, template_language, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [id, message, message_type, template_name, c.template_language, user.id]);
  const business = await getSettingValue<{ phone?: string }>("business", {});
  const n = await queueFollowup(c, row!.id, message, business.phone ?? "");
  await audit(user.id, "followup", "campaign", id, { followup: row!.id, queued: n });
  if (!n) {
    await q("DELETE FROM campaign_followups WHERE id = $1", [row!.id]);
    fail("Nobody to follow up: no lead has received this campaign yet (or they are closed-lost or no longer opted in).");
  }
  const connected = isConfigured(await getWhatsAppConfig());
  if (connected) { const res = await runCampaign(id, user.id); redirect(`${back}?${runToast(res)}#followups`); }
  redirect(`${back}?toast=${encodeURIComponent(`Follow-up queued for ${n} ${n === 1 ? "lead" : "leads"}. It sends once WhatsApp is connected.`)}#followups`);
}
