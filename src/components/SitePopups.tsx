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

const SNOOZE_PREFIX = "mn.popup.snoozeUntil.";
const SESSION_KEY = "mn.popup.shown";
const SNOOZE_DAYS = 7;
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
const snooze = (id: number) => safe(() => localStorage.setItem(SNOOZE_PREFIX + id, String(Date.now() + SNOOZE_DAYS * 864e5)), undefined);

const chip = (on: boolean) => `inline-flex min-h-10 items-center rounded-brand border px-3 text-sm transition-colors ${on ? "border-accent bg-accent text-white" : "border-line bg-white text-ink hover:border-ink"}`;

/**
 * Website pop-ups managed under Admin → Pop-ups. At most one shows per visitor session: the newest live pop-up that suits
 * the current page and that this visitor has not closed in the last 7 days. It appears after that pop-up's delay or once the
 * visitor scrolls half-way down, never over another dialog.
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

  // Arm the trigger once per page load; it survives client-side navigation.
  useEffect(() => {
    if (!popups.length) return;
    const loadedAt = Date.now();
    const shownThisVisit = () => safe(() => sessionStorage.getItem(SESSION_KEY) === "1", false);
    if (shownThisVisit()) return;
    let fired = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const later = (ms: number) => { clearTimeout(retry); retry = setTimeout(() => tryShow(false), ms); };
    const tryShow = (scrolled: boolean) => {
      if (fired || shownThisVisit()) return;
      const pick = popups.find((p) => popupShowsOn(p, pathRef.current) && !snoozed(p.id));
      // Nothing for this page (yet), or another dialog is open: look again shortly, the visitor may move on.
      if (!pick || document.querySelector('[aria-modal="true"]')) return later(3000);
      const wait = pick.delaySeconds * 1000 - (Date.now() - loadedAt);
      if (!scrolled && wait > 0) return later(wait);
      fired = true;
      safe(() => sessionStorage.setItem(SESSION_KEY, "1"), undefined);
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
    if (popup) snooze(popup.id);
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
        body: JSON.stringify({ name: data.name, phone: data.phone, interest, budget: budget || undefined, locality: locality || undefined, source: "popup_consultation", subject: popup.title, page: window.location.pathname }),
      });
      const j = (await res.json()) as { ok: boolean; suggestions?: Suggestion[] };
      if (!res.ok || !j.ok) throw new Error("failed");
      setSuggestions(j.suggestions ?? []);
      setState("done");
      snooze(popup.id);
    } catch {
      setState("form");
      setError("Could not send. Please call or WhatsApp us instead.");
    }
  }

  if (!popup) return null;
  const external = !!popup.ctaHref && /^https?:\/\//i.test(popup.ctaHref);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-4">
      <button type="button" tabIndex={-1} aria-label="Close" className="absolute inset-0 cursor-default bg-ink/50" onClick={close} />
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="popup-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-brand border-t border-line bg-bg p-5 pb-6 md:max-w-[480px] md:rounded-brand md:border md:p-6">
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line md:hidden" aria-hidden="true" />
        <button type="button" onClick={close} aria-label="Close" className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-muted hover:text-ink"><Icon name="close" size={20} /></button>
        {popup.image && state !== "done" && (
          // Admin uploads vary in size and shape: show the whole picture, never cropped.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={popup.image} alt="" className={`mb-4 w-full rounded-brand bg-white object-contain ${popup.kind === "promo" ? "max-h-[55vh]" : "max-h-44"}`} />
        )}
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
  );
}
