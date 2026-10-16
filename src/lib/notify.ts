import "server-only";
import { after } from "next/server";
import { q } from "./db";
import { sendPush } from "./push";
import { getSettingValue } from "./queries/settings";
import { getWhatsAppConfig, isConfigured, sendTemplate } from "./whatsapp";

/**
 * Staff notifications. Each one is stored for the console bell (app/api/notifications), then sent as a browser push
 * and, when set up under Admin → Settings → WhatsApp, as a WhatsApp template message to the person's phone.
 * Sending happens after the response, so forms never wait for it, and it never throws.
 */
export type NotifyKind = "new_lead" | "lead_assigned" | "task_assigned" | "test";
export const KIND_LABEL: Record<string, string> = { new_lead: "New enquiry", lead_assigned: "Assigned to you", task_assigned: "Task", test: "Test" };

export interface NotifyInput {
  kind: NotifyKind;
  title: string;
  body?: string | null;
  /** Console path without the /admin or /employee prefix, e.g. "leads/12"; each person gets their own console's link. */
  path: string;
}

/** WhatsApp staff alerts, stored under settings key "staff_alerts". One approved template: {{1}} = title, {{2}} = details. */
export interface StaffAlerts { whatsapp: boolean; template: string; language: string; newLeads: boolean; assignments: boolean }
export const DEFAULT_STAFF_ALERTS: StaffAlerts = { whatsapp: false, template: "", language: "en", newLeads: true, assignments: true };
export const getStaffAlerts = () => getSettingValue<StaffAlerts>("staff_alerts", DEFAULT_STAFF_ALERTS).then((c) => ({ ...DEFAULT_STAFF_ALERTS, ...c }));

/** Meta rejects template parameters that are empty or contain new lines, tabs or long runs of spaces. */
export const templateParam = (s: string | null | undefined) => (s ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, " ").trim().slice(0, 300) || "-";

/** Runs after the response when there is one (actions, routes), straight away otherwise (the auto-assign timer). */
function later(fn: () => Promise<void>) {
  const run = () => fn().catch((e) => console.error("[notify] delivery failed", e));
  try { after(run); } catch { void run(); }
}

/** Notifies these people (inactive accounts are skipped). */
export async function notify(userIds: number[], n: NotifyInput): Promise<void> {
  const ids = [...new Set(userIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (!ids.length) return;
  try {
    const rows = await q<{ id: number; user_id: number; phone: string | null }>(
      `WITH ins AS (
         INSERT INTO notifications (user_id, kind, title, body, href)
         SELECT u.id, $2, $3, $4, (CASE WHEN u.role = 'admin' THEN '/admin/' ELSE '/employee/' END) || $5
         FROM users u WHERE u.id = ANY($1::int[]) AND u.status = 'active'
         RETURNING id, user_id)
       SELECT ins.id, ins.user_id, u.phone FROM ins JOIN users u ON u.id = ins.user_id`,
      [ids, n.kind, n.title.slice(0, 200), n.body?.slice(0, 500) ?? null, n.path.replace(/^\/+/, "")],
    );
    if (!rows.length) return;
    // Tapping the push opens it through /api/notifications/open, which also marks it read.
    const openOf = new Map(rows.map((r) => [r.user_id, `/api/notifications/open/${r.id}`]));
    later(async () => {
      await sendPush(rows.map((r) => r.user_id), (userId) => ({ title: n.title, body: n.body, url: openOf.get(userId), tag: `${n.kind}:${n.path}` }));
      await sendWhatsApp(rows.filter((r) => r.phone).map((r) => r.phone!), n);
    });
  } catch (e) {
    console.error("[notify] failed", e);
  }
}

/** Notifies every active admin, except the one who caused it. */
export async function notifyAdmins(n: NotifyInput, exceptUserId?: number | null): Promise<void> {
  const admins = await q<{ id: number }>("SELECT id FROM users WHERE role = 'admin' AND status = 'active' AND id IS DISTINCT FROM $1", [exceptUserId ?? null]).catch(() => []);
  await notify(admins.map((a) => a.id), n);
}

/** Tells someone a record or task was given to them, unless they did it themselves. */
export async function notifyAssignee(assigneeId: number | null | undefined, actorId: number | null | undefined, n: NotifyInput): Promise<void> {
  if (!assigneeId || assigneeId === actorId) return;
  await notify([assigneeId], n);
}

async function sendWhatsApp(phones: string[], n: NotifyInput) {
  if (!phones.length) return;
  const cfg = await getStaffAlerts();
  if (n.kind === "test" || !cfg.whatsapp || !cfg.template || !(n.kind === "new_lead" ? cfg.newLeads : cfg.assignments)) return;
  const wa = await getWhatsAppConfig();
  if (!isConfigured(wa)) return;
  for (const to of phones) {
    const r = await sendTemplate(wa, to, cfg.template, cfg.language || "en", [templateParam(n.title), templateParam(n.body)]);
    if (!r.ok) console.error("[notify] WhatsApp alert failed", to, r.error);
  }
}
