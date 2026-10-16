"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Icon from "@/components/Icon";

/** The bell count shared by the top bar and the mobile menu, kept fresh by <NotificationCenter>. */
let liveCount: number | null = null;
const listeners = new Set<() => void>();
function setLiveCount(n: number) { liveCount = n; listeners.forEach((l) => l()); }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function useBellCount(initial: number): number {
  return useSyncExternalStore(subscribe, () => liveCount ?? initial, () => initial);
}

interface Item { id: number; kind: string; title: string; body: string | null }
const POLL_MS = 30000;
const LABEL: Record<string, string> = { new_lead: "New enquiry", lead_assigned: "Assigned to you", task_assigned: "Task", test: "Test" };

/** Two short rising tones. Browsers only allow sound after the person has clicked or tapped the page once. */
function useChime() {
  const ctx = useRef<AudioContext | null>(null);
  useEffect(() => {
    const unlock = () => {
      try { ctx.current ??= new AudioContext(); void ctx.current.resume(); } catch { /* no audio */ }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  }, []);
  return () => {
    const c = ctx.current;
    if (!c || c.state !== "running") return;
    [880, 1320].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * 0.16;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.16);
    });
  };
}

/**
 * Checks for new notifications every 30 s (and when the tab comes back into view). A new one updates the bell, plays a
 * chime and shows a pop-up; with the tab in the background it shows a desktop notification instead, unless this browser
 * already receives push notifications (those come from the service worker, see public/sw.js).
 */
export default function NotificationCenter({ initialCount, latestId, listHref }: { initialCount: number; latestId: number; listHref: string }) {
  const last = useRef(latestId);
  const [toast, setToast] = useState<{ item: Item; more: number } | null>(null);
  const chime = useChime();

  useEffect(() => { setLiveCount(initialCount); }, [initialCount]);

  useEffect(() => {
    let stopped = false;
    let pushOn = false;
    navigator.serviceWorker?.getRegistration?.().then((r) => r?.pushManager.getSubscription()).then((s) => { pushOn = Boolean(s); }).catch(() => undefined);
    const check = async () => {
      try {
        const res = await fetch(`/api/notifications?after=${last.current}`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as { count: number; items: Item[] };
        setLiveCount(data.count);
        if (!data.items.length) return;
        last.current = Math.max(last.current, ...data.items.map((i) => i.id));
        const [newest] = data.items;
        chime();
        if (document.visibilityState === "visible") {
          setToast({ item: newest, more: data.items.length - 1 });
        } else if (!pushOn && "Notification" in window && Notification.permission === "granted") {
          const n = new Notification(newest.title, { body: newest.body ?? "", icon: "/icon.png", tag: `mn-${newest.id}` });
          // A route handler (marks it read, then redirects), not a page, so a full navigation is right here.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          n.onclick = () => { window.focus(); window.location.href = `/api/notifications/open/${newest.id}`; };
        }
      } catch { /* offline: try again next time */ }
    };
    const t = setInterval(check, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { stopped = true; clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 12000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  const { item, more } = toast;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-[70] w-[min(360px,calc(100vw-2rem))] rounded-brand border border-line bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-ink"><Icon name="bell" size={16} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{LABEL[item.kind] ?? "Notification"}</p>
          <p className="mt-0.5 text-sm font-medium text-ink">{item.title}</p>
          {item.body && <p className="mt-0.5 text-sm text-muted">{item.body}</p>}
          <div className="mt-3 flex items-center gap-3 text-sm">
            <a href={`/api/notifications/open/${item.id}`} className="rounded-brand bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-ink">Open</a>
            {more > 0 && <Link href={listHref} onClick={() => setToast(null)} className="text-muted hover:text-ink">+{more} more</Link>}
          </div>
        </div>
        <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-ink"><Icon name="close" size={16} /></button>
      </div>
    </div>
  );
}
