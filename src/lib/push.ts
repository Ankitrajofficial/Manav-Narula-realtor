import "server-only";
import webpush from "web-push";
import { site } from "@/data/site";
import { q } from "./db";

/**
 * Browser push (phones and computers, even with the console closed). Needs VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in the
 * environment (generate once with `npx web-push generate-vapid-keys`); VAPID_SUBJECT is an optional mailto: contact.
 * Without the keys push is simply off and the console bell still works.
 */
export const pushPublicKey = () => process.env.VAPID_PUBLIC_KEY?.trim() || "";
export const pushConfigured = () => Boolean(pushPublicKey() && process.env.VAPID_PRIVATE_KEY?.trim());

let ready = false;
function setup() {
  if (ready || !pushConfigured()) return ready;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT?.trim() || `mailto:${site.email}`, pushPublicKey(), process.env.VAPID_PRIVATE_KEY!.trim());
  ready = true;
  return ready;
}

export interface PushMessage { title: string; body?: string | null; url?: string | null; tag?: string }

/** Sends to every browser the people allowed. Subscriptions the push service reports as gone are deleted. Never throws. */
export async function sendPush(userIds: number[], msg: PushMessage | ((userId: number) => PushMessage)): Promise<void> {
  if (!userIds.length || !setup()) return;
  const subs = await q<{ id: number; user_id: number; endpoint: string; p256dh: string; auth: string }>("SELECT id, user_id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ANY($1::int[])", [userIds]);
  await Promise.all(subs.map(async (s) => {
    const m = typeof msg === "function" ? msg(s.user_id) : msg;
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(m), { TTL: 60 * 60 * 24, urgency: "high" });
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await q("DELETE FROM push_subscriptions WHERE id = $1", [s.id]);
      else console.error("[push] send failed", status ?? "", (e as Error).message);
    }
  }));
}
