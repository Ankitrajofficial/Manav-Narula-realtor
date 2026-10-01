"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/records";
import { setSetting } from "@/lib/queries/settings";
import { getWhatsAppConfig, sendText, testConnection, type WhatsAppConfig } from "@/lib/whatsapp";

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
