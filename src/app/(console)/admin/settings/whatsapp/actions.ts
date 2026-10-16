"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/records";
import { setSetting } from "@/lib/queries/settings";
import { getWhatsAppConfig, sendTemplate, sendText, testConnection, type WhatsAppConfig } from "@/lib/whatsapp";
import { one } from "@/lib/db";
import { getStaffAlerts, templateParam, type StaffAlerts } from "@/lib/notify";

export async function saveWhatsAppAction(fd: FormData) {
  const user = await requireUser("admin");
  const current = await getWhatsAppConfig();
  const token = String(fd.get("accessToken") ?? "").trim();
  const next: WhatsAppConfig = {
    phoneNumberId: String(fd.get("phoneNumberId") ?? "").trim(),
    businessAccountId: String(fd.get("businessAccountId") ?? "").trim(),
    accessToken: token || current.accessToken,
    apiVersion: String(fd.get("apiVersion") ?? "v21.0").trim() || "v21.0",
    senderName: String(fd.get("senderName") ?? "").trim() || current.senderName,
  };
  await setSetting("whatsapp", next);
  await audit(user.id, "update", "settings", "whatsapp", { phoneNumberId: next.phoneNumberId, tokenChanged: Boolean(token) });
  const test = await testConnection(next);
  redirect(`/admin/settings/whatsapp?${test.ok ? `toast=${encodeURIComponent(`Saved and connected: ${test.display}`)}` : `error=${encodeURIComponent(`Saved, but the API test failed: ${test.error}`)}`}`);
}

export async function disconnectWhatsAppAction() {
  const user = await requireUser("admin");
  const current = await getWhatsAppConfig();
  await setSetting("whatsapp", { ...current, accessToken: "" });
  await audit(user.id, "disconnect", "settings", "whatsapp");
  redirect(`/admin/settings/whatsapp?toast=${encodeURIComponent("Access token removed")}`);
}

export async function sendTestMessageAction(fd: FormData) {
  const user = await requireUser("admin");
  const to = String(fd.get("to") ?? "").replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(to)) redirect(`/admin/settings/whatsapp?error=${encodeURIComponent("Enter a 10-digit mobile number")}`);
  const cfg = await getWhatsAppConfig();
  const res = await sendText(cfg, `+91${to}`, `Test message from ${cfg.senderName || "Manav Narula Realtor"} console. If you can read this, the WhatsApp API is working.`);
  await audit(user.id, "test_send", "settings", "whatsapp", { to: `+91${to}`, ok: res.ok });
  redirect(`/admin/settings/whatsapp?${res.ok ? `toast=${encodeURIComponent(`Test sent to +91 ${to}`)}` : `error=${encodeURIComponent(res.error)}`}`);
}

/** Staff alerts: which events go to staff phones on WhatsApp, and the approved template that carries them. */
export async function saveStaffAlertsAction(fd: FormData) {
  const user = await requireUser("admin");
  const next: StaffAlerts = {
    whatsapp: fd.get("whatsapp") === "on",
    template: String(fd.get("template") ?? "").trim(),
    language: String(fd.get("language") ?? "en").trim() || "en",
    newLeads: fd.get("newLeads") === "on",
    assignments: fd.get("assignments") === "on",
  };
  if (next.whatsapp && !next.template) redirect(`/admin/settings/whatsapp?error=${encodeURIComponent("Enter the approved template name to turn on WhatsApp alerts")}#staff-alerts`);
  await setSetting("staff_alerts", next);
  await audit(user.id, "update", "settings", "staff_alerts", next);
  redirect(`/admin/settings/whatsapp?toast=${encodeURIComponent("Staff alerts saved")}#staff-alerts`);
}

/** Sends the alert template to the signed-in admin's own phone (from their account). */
export async function testStaffAlertAction() {
  const user = await requireUser("admin");
  const [cfg, wa, me] = await Promise.all([getStaffAlerts(), getWhatsAppConfig(), one<{ phone: string | null }>("SELECT phone FROM users WHERE id = $1", [user.id])]);
  if (!cfg.template) redirect(`/admin/settings/whatsapp?error=${encodeURIComponent("Save a template name first")}#staff-alerts`);
  if (!me?.phone) redirect(`/admin/settings/whatsapp?error=${encodeURIComponent("Your account has no phone number. Add it under Employees.")}#staff-alerts`);
  const res = await sendTemplate(wa, me!.phone!, cfg.template, cfg.language || "en", [templateParam("Test alert"), templateParam(`WhatsApp staff alerts are working for ${user.name}.`)]);
  await audit(user.id, "test_send", "settings", "staff_alerts", { ok: res.ok });
  redirect(`/admin/settings/whatsapp?${res.ok ? `toast=${encodeURIComponent(`Test alert sent to ${me!.phone}`)}` : `error=${encodeURIComponent(res.error)}`}#staff-alerts`);
}
