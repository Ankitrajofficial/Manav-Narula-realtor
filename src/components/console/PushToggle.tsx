"use client";
import { useEffect, useState, useTransition } from "react";
import { sendTestNotificationAction } from "@/app/(console)/notification-actions";

type State = "checking" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** What this browser can do, and whether it already receives push notifications. */
async function detect(): Promise<State> {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return ios && !standalone ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  try { return (await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription()) ? "on" : "off"; } catch { return "off"; }
}

/** Turns push notifications on or off for this browser (each phone and computer is set separately). */
export default function PushToggle({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, startTest] = useTransition();
  const [tested, setTested] = useState(false);

  useEffect(() => {
    let cancelled = false;
    detect().then((s) => { if (!cancelled) setState(s); });
    return () => { cancelled = true; };
  }, []);

  async function enable() {
    setBusy(true); setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "off"); return; }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error("The server did not save this device.");
      setState("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not turn on notifications.");
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setError("");
    try {
      const sub = await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
    } finally { setBusy(false); }
  }

  const text: Record<State, string> = {
    checking: "Checking this device…",
    unsupported: "This browser cannot receive push notifications. Use Chrome, Edge, Firefox or Safari.",
    "ios-install": "On iPhone and iPad: tap Share, then “Add to Home Screen”, open the console from that icon and turn notifications on there.",
    denied: "Notifications are blocked for this site. Allow them in the browser’s site settings, then reload this page.",
    off: "Get an alert on this phone or computer for new enquiries and assignments, even when the console is closed.",
    on: "This device gets push notifications.",
  };
  return (
    <section className="mb-6 rounded-brand border border-line bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base">Notifications on this device</h2>
          <p className="mt-0.5 text-sm text-muted">{publicKey ? text[state] : "Push notifications are not set up on the server yet (VAPID keys). The bell and on-screen pop-ups still work."}</p>
          {error && <p className="mt-1 text-sm text-red-700" role="alert">{error}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {publicKey && state === "off" && <button type="button" onClick={enable} disabled={busy} className="rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-60">{busy ? "Turning on…" : "Turn on"}</button>}
          {publicKey && state === "on" && <button type="button" onClick={disable} disabled={busy} className="rounded-brand border border-line px-4 py-2 text-sm hover:border-ink disabled:opacity-60">Turn off</button>}
          <button type="button" disabled={testing} onClick={() => startTest(async () => { await sendTestNotificationAction(); setTested(true); })} className="rounded-brand border border-line px-4 py-2 text-sm hover:border-ink disabled:opacity-60">{testing ? "Sending…" : tested ? "Sent, check the bell" : "Send a test"}</button>
        </div>
      </div>
    </section>
  );
}
