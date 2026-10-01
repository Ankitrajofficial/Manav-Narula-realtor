import "server-only";
import { getSettingValue } from "@/lib/queries/settings";

/** Meta WhatsApp Cloud API settings, stored under settings key "whatsapp". */
export interface WhatsAppConfig { phoneNumberId: string; businessAccountId: string; accessToken: string; apiVersion: string; senderName: string }
export const EMPTY_CONFIG: WhatsAppConfig = { phoneNumberId: "", businessAccountId: "", accessToken: "", apiVersion: "v21.0", senderName: "Manav Narula Realtor" };

export const getWhatsAppConfig = () => getSettingValue<WhatsAppConfig>("whatsapp", EMPTY_CONFIG).then((c) => ({ ...EMPTY_CONFIG, ...c }));
export const isConfigured = (c: WhatsAppConfig) => Boolean(c.phoneNumberId && c.accessToken);
export const maskToken = (t: string) => (t ? `${t.slice(0, 6)}…${t.slice(-4)}` : "");

export const PLACEHOLDERS = [
  { token: "{{name}}", label: "First name" },
  { token: "{{full_name}}", label: "Full name" },
  { token: "{{locality}}", label: "Locality" },
  { token: "{{interest}}", label: "Interest (Buy / Sell / Rent)" },
  { token: "{{budget}}", label: "Budget" },
  { token: "{{employee}}", label: "Assigned advisor" },
  { token: "{{phone}}", label: "Our phone" },
];

export interface Recipient { kind: "lead" | "prospect"; id: number; name: string; phone: string; locality: string | null; interest: string | null; budget: string | null; employee: string | null; opt_in: boolean }

/** Replace {{placeholders}} with the recipient's values. Unknown tokens are left blank. */
export function renderMessage(template: string, r: Recipient, ourPhone: string): string {
  const values: Record<string, string> = {
    name: (r.name ?? "").split(" ")[0] ?? "",
    full_name: r.name ?? "",
    locality: r.locality ?? "",
    interest: r.interest ?? "",
    budget: r.budget ?? "",
    employee: r.employee ?? "our team",
    phone: ourPhone,
  };
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) => values[k.toLowerCase()] ?? "");
}

/** Order of placeholders as they appear in the message: template mode maps these to {{1}}, {{2}}... body parameters. */
export function placeholderOrder(template: string): string[] {
  const out: string[] = [];
  for (const m of template.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)) if (!out.includes(m[1].toLowerCase())) out.push(m[1].toLowerCase());
  return out;
}

type SendResult = { ok: true; id: string } | { ok: false; error: string };

async function graph(c: WhatsAppConfig, path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const res = await fetch(`https://graph.facebook.com/${c.apiVersion}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${c.accessToken}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(20000),
  });
  let json: Record<string, unknown> = {};
  try { json = (await res.json()) as Record<string, unknown>; } catch { /* empty body */ }
  return { ok: res.ok, status: res.status, json };
}

const errorText = (json: Record<string, unknown>, status: number) => {
  const e = json.error as { message?: string; error_user_msg?: string; code?: number } | undefined;
  return e?.error_user_msg || e?.message || `HTTP ${status}`;
};

/** Free-form text: only delivered when the person messaged the business in the last 24 hours (Meta rule). */
export async function sendText(c: WhatsAppConfig, to: string, body: string): Promise<SendResult> {
  const r = await graph(c, `${c.phoneNumberId}/messages`, { method: "POST", body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: to.replace(/\D/g, ""), type: "text", text: { preview_url: false, body } }) });
  if (!r.ok) return { ok: false, error: errorText(r.json, r.status) };
  const id = (r.json.messages as { id: string }[] | undefined)?.[0]?.id ?? "";
  return { ok: true, id };
}

export type MediaType = "none" | "image" | "document" | "video";
export interface Media { type: MediaType; link: string; filename?: string | null }

/** Image, PDF or short video with the message as caption. The link must be a public HTTPS URL Meta can fetch. */
export async function sendMedia(c: WhatsAppConfig, to: string, media: Media, caption: string): Promise<SendResult> {
  if (media.type === "none") return sendText(c, to, caption);
  const payload: Record<string, unknown> = { link: media.link, caption: caption.slice(0, 1024) };
  if (media.type === "document") payload.filename = media.filename || "brochure.pdf";
  const r = await graph(c, `${c.phoneNumberId}/messages`, { method: "POST", body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: to.replace(/\D/g, ""), type: media.type, [media.type]: payload }) });
  if (!r.ok) return { ok: false, error: errorText(r.json, r.status) };
  const id = (r.json.messages as { id: string }[] | undefined)?.[0]?.id ?? "";
  return { ok: true, id };
}

/** Approved template with body parameters in order and an optional media header. Works for business-initiated messages. */
export async function sendTemplate(c: WhatsAppConfig, to: string, name: string, language: string, params: string[], media?: Media): Promise<SendResult> {
  const components: Record<string, unknown>[] = [];
  if (media && media.type !== "none") {
    const param: Record<string, unknown> = { type: media.type, [media.type]: media.type === "document" ? { link: media.link, filename: media.filename || "brochure.pdf" } : { link: media.link } };
    components.push({ type: "header", parameters: [param] });
  }
  if (params.length) components.push({ type: "body", parameters: params.map((text) => ({ type: "text", text })) });
  const r = await graph(c, `${c.phoneNumberId}/messages`, { method: "POST", body: JSON.stringify({ messaging_product: "whatsapp", to: to.replace(/\D/g, ""), type: "template", template: { name, language: { code: language }, components } }) });
  if (!r.ok) return { ok: false, error: errorText(r.json, r.status) };
  const id = (r.json.messages as { id: string }[] | undefined)?.[0]?.id ?? "";
  return { ok: true, id };
}

/** Reads the phone number record to confirm the credentials work. */
export async function testConnection(c: WhatsAppConfig): Promise<{ ok: true; display: string; quality: string } | { ok: false; error: string }> {
  if (!isConfigured(c)) return { ok: false, error: "Phone number ID and access token are required." };
  try {
    const r = await graph(c, `${c.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`);
    if (!r.ok) return { ok: false, error: errorText(r.json, r.status) };
    return { ok: true, display: `${r.json.verified_name ?? ""} ${r.json.display_phone_number ?? ""}`.trim(), quality: String(r.json.quality_rating ?? "") };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
