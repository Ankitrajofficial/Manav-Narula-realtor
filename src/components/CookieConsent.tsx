"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_KEY, CONSENT_OPEN_EVENT, type Consent } from "@/lib/cookie-consent";

declare global { interface Window { gtag?: (...args: unknown[]) => void } }

const read = (): Consent | null => { try { const v = localStorage.getItem(CONSENT_KEY); return v === "granted" || v === "denied" ? v : null; } catch { return null; } };

/**
 * Cookie notice. Google Analytics starts with consent denied (see Analytics.tsx) and sets no cookies until the visitor
 * accepts here; the choice is remembered and can be changed from "Cookie settings" in the footer.
 */
export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Shown only to visitors who have not chosen yet; read after mount because the choice lives in this browser.
    const t = setTimeout(() => setOpen(read() === null), 0);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => { clearTimeout(t); window.removeEventListener(CONSENT_OPEN_EVENT, reopen); };
  }, []);

  const choose = (c: Consent) => {
    try { localStorage.setItem(CONSENT_KEY, c); } catch { /* private mode: ask again next visit */ }
    window.gtag?.("consent", "update", { analytics_storage: c });
    setOpen(false);
  };

  if (!open) return null;
  return (
    <section role="region" aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-[calc(var(--bottom-bar-h)+10px)] z-50 rounded-brand border border-line bg-white p-4 shadow-lg md:inset-x-auto md:bottom-4 md:left-4 md:max-w-md">
      <h2 className="text-base">Cookies on this site</h2>
      <p className="mt-1 text-sm text-muted">
        We use essential cookies to keep forms working. With your permission we also use Google Analytics cookies to see which pages help visitors, never for ads.{" "}
        <Link href="/privacy#cookies" className="text-accent-ink underline">Privacy policy</Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose("granted")} className="rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Accept all</button>
        <button type="button" onClick={() => choose("denied")} className="rounded-brand border border-line px-4 py-2 text-sm hover:border-ink">Essential only</button>
      </div>
    </section>
  );
}

/** Footer link that opens the cookie notice again. */
export function CookieSettingsLink({ className = "" }: { className?: string }) {
  return <button type="button" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))} className={className}>Cookie settings</button>;
}
