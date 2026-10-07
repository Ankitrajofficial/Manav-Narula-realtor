"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LocalityOption } from "@/lib/localities";
import { popupShowsOn, type SitePopup } from "@/lib/popups";
import Icon from "./Icon";
import LocalitySelect from "./LocalitySelect";
import { inputCls } from "./ui";

// A new key, so 7-day snoozes saved under the old rule (mn.popup.snoozeUntil.<id>) no longer hide pop-ups.
const SNOOZE_PREFIX = "mn.popup.hideUntil.";
// Closing hides the pop-up for a day; sending the form hides it for 30 days.
const CLOSE_SNOOZE_DAYS = 1;
const SENT_SNOOZE_DAYS = 30;
const INTERESTS = ["Buy", "Rent", "Sell"] as const;
// Stored values match the budget list used on leads; labels are the short chip text.
const BUDGETS = [
  { value: "Under ₹50 L", label: "Under ₹50 L" },
  { value: "₹50 L to ₹1 Cr", label: "₹50 L to ₹1 Cr" },
  { value: "₹1 Cr to ₹2 Cr", label: "₹1 to 2 Cr" },
  { value: "Above ₹2 Cr", label: "Above ₹2 Cr" },
];

type Suggestion = { slug: string; title: string; price: string; locality: string; image: string };
const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn(); } catch { return fallback; } };
const snoozed = (id: number) => safe(() => Number(localStorage.getItem(SNOOZE_PREFIX + id) || 0) > Date.now(), false);
const snooze = (id: number, days: number) => safe(() => localStorage.setItem(SNOOZE_PREFIX + id, String(Date.now() + days * 864e5)), undefined);

const chip = (on: boolean) => `inline-flex min-h-10 items-center rounded-brand border px-3 text-sm transition-colors ${on ? "border-accent bg-accent text-white" : "border-line bg-white text-ink hover:border-ink"}`;

/**
 * Website pop-ups managed under Admin → Pop-ups. At most one shows per page load (a refresh shows it again): the newest
 * live pop-up that suits the current page and that this visitor has not closed in the last day or sent in the last 30 days.
 * It appears after that pop-up's delay or once the visitor scrolls half-way down, never over another dialog.
 */
export default function SitePopups({ popups, localities }: { popups: SitePopup[]; localities: LocalityOption[] }) {
  const pathname = usePathname();
  const [popup, setPopup] = useState<SitePopup | null>(null);
  const [state, setState] = useState<"form" | "sending" | "done">("form");
  const [error, setError] = useState("");
  const [interest, setInterest] = useState<(typeof INTERESTS)[number]>("Buy");
  const [budget, setBudget] = useState("");
  const [locality, setLocality] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const dialog = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<Element | null>(null);
  const pathRef = useRef(pathname);
  const done = state === "done";
  useEffect(() => { pathRef.current = pathname; }, [pathname]);

  // Admin preview: ?popup=<id> shows that live pop-up straight away, ignoring the snooze rules.
  useEffect(() => {
    const want = Number(new URLSearchParams(window.location.search).get("popup"));
    const pick = want ? popups.find((p) => p.id === want) : undefined;
    if (!pick) return;
    const t = setTimeout(() => { lastFocus.current = document.activeElement; setPopup(pick); }, 300);
    return () => clearTimeout(t);
  }, [popups]);

  // Arm the trigger once per page load; it survives client-side navigation.
  useEffect(() => {
    if (!popups.length || new URLSearchParams(window.location.search).get("popup")) return;
    const loadedAt = Date.now();
    let fired = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const later = (ms: number) => { clearTimeout(retry); retry = setTimeout(() => tryShow(false), ms); };
    const tryShow = (scrolled: boolean) => {
      if (fired) return;
      const pick = popups.find((p) => popupShowsOn(p, pathRef.current) && !snoozed(p.id));
      // Nothing for this page (yet), another dialog is open, or the cookie notice is still waiting for an answer:
      // look again shortly, the visitor may move on.
      if (!pick || document.querySelector('[aria-modal="true"], [aria-label="Cookie notice"]')) return later(3000);
      const wait = pick.delaySeconds * 1000 - (Date.now() - loadedAt);
      if (!scrolled && wait > 0) return later(wait);
      fired = true;
      lastFocus.current = document.activeElement;
      setPopup(pick);
      cleanup();
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= 0.5) tryShow(true);
    };
    const timer = setTimeout(() => tryShow(false), Math.min(...popups.map((p) => p.delaySeconds)) * 1000);
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() { clearTimeout(timer); window.removeEventListener("scroll", onScroll); }
    return () => { cleanup(); clearTimeout(retry); };
  }, [popups]);

  const close = () => {
    if (popup && state !== "done") snooze(popup.id, CLOSE_SNOOZE_DAYS);
    setPopup(null);
    (lastFocus.current as HTMLElement | null)?.focus?.();
  };

  // Escape closes; Tab stays inside the dialog; page behind does not scroll.
  useEffect(() => {
    if (!popup) return;
    const el = dialog.current;
    (el?.querySelector<HTMLElement>('input[name="name"]') ?? el?.querySelector<HTMLElement>("a[href], button"))?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea')).filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const a = items[0], z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [popup, done]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!popup) return;
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    if (String(data.name ?? "").trim().length < 2) { setError("Enter your name."); return; }
    if (!/^[6-9]\d{9}$/.test(String(data.phone ?? "").replace(/\D/g, "").slice(-10))) { setError("Enter a 10-digit Indian mobile number."); return; }
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(popup.kind === "enquiry"
          ? { name: data.name, phone: data.phone, message: data.message || undefined, source: "popup_enquiry", subject: popup.title, projectId: popup.projectId ?? undefined, page: window.location.pathname }
          : { name: data.name, phone: data.phone, interest, budget: budget || undefined, locality: locality || undefined, source: "popup_consultation", subject: popup.title, page: window.location.pathname }),
      });
      const j = (await res.json()) as { ok: boolean; suggestions?: Suggestion[] };
      if (!res.ok || !j.ok) throw new Error("failed");
      setSuggestions(j.suggestions ?? []);
      setState("done");
      snooze(popup.id, SENT_SNOOZE_DAYS);
    } catch {
      setState("form");
      setError("Could not send. Please call or WhatsApp us instead.");
    }
  }

  if (!popup) return null;
  const external = !!popup.ctaHref && /^https?:\/\//i.test(popup.ctaHref);
  const withImage = !!popup.image && state !== "done";
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-4">
      <button type="button" tabIndex={-1} aria-label="Close" className="absolute inset-0 cursor-default bg-ink/50" onClick={close} />
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="popup-title"
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-brand border-t border-line bg-bg p-5 pb-6 md:rounded-brand md:border md:p-6 ${withImage ? "md:grid md:max-w-[820px] md:grid-cols-[300px_minmax(0,1fr)] md:gap-6" : "md:max-w-[480px]"}`}>
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line md:hidden" aria-hidden="true" />
        <button type="button" onClick={close} aria-label="Close" className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-muted hover:text-ink"><Icon name="close" size={20} /></button>
        {withImage && (
          // A 4:5 portrait frame: beside the text on larger screens, above it (smaller) on phones. Other shapes are cropped to fit.
          <div className={`relative mx-auto mb-4 aspect-[4/5] overflow-hidden rounded-brand bg-line md:mx-0 md:mb-0 md:w-full md:max-w-none md:self-start ${popup.kind === "promo" ? "w-3/4 max-w-[300px]" : "w-1/2 max-w-[200px]"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={popup.image!} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
        <div className="min-w-0">
        {popup.kind === "promo" ? (
          <>
            <h2 id="popup-title" className="pr-10 text-2xl">{popup.title}</h2>
            {popup.text && <p className="mt-1 whitespace-pre-line text-sm text-muted">{popup.text}</p>}
            {popup.ctaLabel && popup.ctaHref && (
              <Link href={popup.ctaHref} onClick={close} {...(external ? { target: "_blank", rel: "noopener" } : {})} className="mt-5 flex w-full items-center justify-center gap-2 rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-ink">
                {popup.ctaLabel}<Icon name="arrowRight" size={16} />
              </Link>
            )}
          </>
        ) : popup.kind === "enquiry" ? (
          state !== "done" ? (
            <>
              <h2 id="popup-title" className="pr-10 text-2xl">{popup.title}</h2>
              {popup.text && <p className="mt-1 whitespace-pre-line text-sm text-muted">{popup.text}</p>}
              <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm"><span className="mb-1.5 block">Name</span><input name="name" autoComplete="name" required className={inputCls} placeholder="Your name" /></label>
                  <label className="block text-sm"><span className="mb-1.5 block">Phone</span><input name="phone" inputMode="tel" autoComplete="tel" required className={inputCls} placeholder="10-digit mobile" /></label>
                </div>
                <label className="block text-sm"><span className="mb-1.5 block">Message (optional)</span><textarea name="message" rows={2} maxLength={500} className={inputCls} placeholder="What would you like to know?" /></label>
                {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
                <button type="submit" disabled={state === "sending"} className="w-full rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-60">{state === "sending" ? "Sending…" : popup.ctaLabel || "Send enquiry"}</button>
                <p className="text-center text-xs text-muted">We call only about your enquiry. No spam.</p>
              </form>
            </>
          ) : (
            <div role="status">
              <Icon name="check" size={28} className="text-accent" />
              <h2 id="popup-title" className="mt-2 pr-10 text-2xl">Thank you, we will call you shortly</h2>
              <p className="mt-1 text-sm text-muted">An advisor will call you within working hours. For anything urgent, call or WhatsApp us.</p>
              <button type="button" onClick={close} className="mt-5 w-full rounded-brand border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-white">Close</button>
            </div>
          )
        ) : state !== "done" ? (
          <>
            <h2 id="popup-title" className="pr-10 text-2xl">{popup.title}</h2>
            {popup.text && <p className="mt-1 text-sm text-muted">{popup.text}</p>}
            <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm"><span className="mb-1.5 block">Name</span><input name="name" autoComplete="name" required className={inputCls} placeholder="Your name" /></label>
                <label className="block text-sm"><span className="mb-1.5 block">Phone</span><input name="phone" inputMode="tel" autoComplete="tel" required className={inputCls} placeholder="10-digit mobile" /></label>
              </div>
              <fieldset>
                <legend className="mb-1.5 text-sm">Looking to</legend>
                <div className="flex flex-wrap gap-1.5">{INTERESTS.map((i) => <button key={i} type="button" aria-pressed={interest === i} onClick={() => setInterest(i)} className={chip(interest === i)}>{i}</button>)}</div>
              </fieldset>
              <fieldset>
                <legend className="mb-1.5 text-sm">Budget</legend>
                <div className="flex flex-wrap gap-1.5">{BUDGETS.map((b) => <button key={b.value} type="button" aria-pressed={budget === b.value} onClick={() => setBudget(budget === b.value ? "" : b.value)} className={chip(budget === b.value)}>{b.label}</button>)}</div>
              </fieldset>
              <div className="text-sm">
                <label htmlFor="popup-locality" className="mb-1.5 block">Preferred locality (optional)</label>
                <LocalitySelect id="popup-locality" options={localities} value={locality} onChange={setLocality} emptyLabel="Any locality" inputClassName={inputCls} />
              </div>
              {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
              <button type="submit" disabled={state === "sending"} className="w-full rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-60">{state === "sending" ? "Sending…" : "Get free suggestions"}</button>
              <p className="text-center text-xs text-muted">No spam. We call only about your requirement.</p>
            </form>
          </>
        ) : (
          <div role="status">
            <Icon name="check" size={28} className="text-accent" />
            <h2 id="popup-title" className="mt-2 pr-10 text-2xl">We will call you shortly</h2>
            <p className="mt-1 text-sm text-muted">An advisor will call within working hours with 3 shortlisted properties. Here are a few to start with.</p>
            <ul className="mt-4 space-y-2">
              {suggestions.map((s) => (
                <li key={s.slug}>
                  <Link href={`/properties/${s.slug}`} onClick={close} className="flex items-center gap-3 rounded-brand border border-line bg-white p-2 hover:border-ink">
                    <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-brand bg-line"><Image src={s.image} alt="" fill sizes="80px" className="object-cover" /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{s.title}</span>
                      <span className="block text-xs text-muted"><span className="tabular text-ink">{s.price}</span> · {s.locality}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <button type="button" onClick={close} className="mt-5 w-full rounded-brand border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-white">Close</button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
