"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import Icon from "./Icon";

const KEY = "mn.nav.internal";
/** The console pages visited in this tab, oldest first. Cleared when the sign-in page opens. */
export const TRAIL_KEY = "mn.nav.trail";
const TRAIL_MAX = 30;
const isConsole = (path: string) => /^\/(admin|employee)(\/|$)/.test(path);
const pathOf = (url: string) => url.split("?")[0];
/** Forms that are finished with once left: Back never reopens them. */
const isForm = (path: string) => /\/(new|edit|data-entry)$/.test(path);

function readTrail(): string[] {
  try { const t = JSON.parse(sessionStorage.getItem(TRAIL_KEY) ?? "[]"); return Array.isArray(t) ? t.filter((x) => typeof x === "string") : []; } catch { return []; }
}
function writeTrail(trail: string[]) {
  try { sessionStorage.setItem(TRAIL_KEY, JSON.stringify(trail.slice(-TRAIL_MAX))); } catch {}
}

/** Records console pages for the back arrow. A new filter on the same list replaces the entry, so Back returns to the list as it was last seen. */
export function NavTrail() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const query = (() => { const q = new URLSearchParams(sp.toString()); q.delete("toast"); q.delete("error"); return q.toString(); })();
  useEffect(() => {
    if (!isConsole(pathname)) return;
    const url = query ? `${pathname}?${query}` : pathname;
    const trail = readTrail();
    const last = trail[trail.length - 1];
    if (last === url) return;
    if (last && pathOf(last) === pathname) trail[trail.length - 1] = url;
    else trail.push(url);
    writeTrail(trail);
  }, [pathname, query]);
  return null;
}

/** Where the console's back arrow goes: the last page that is not this one or a finished form, in this console. */
function previousConsolePage(pathname: string): string {
  const section = pathname.split("/")[1];
  const trail = readTrail();
  while (trail.length) {
    const path = pathOf(trail[trail.length - 1]);
    if (path !== pathname && !isForm(path) && path.split("/")[1] === section) break;
    trail.pop();
  }
  writeTrail(trail);
  return trail[trail.length - 1] ?? logicalParent(pathname);
}

/** Where "back" goes when there is no earlier page from this site in the tab's history. */
export function logicalParent(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "admin" || parts[0] === "employee") {
    // Console: an edit page goes to its record, any other sub-page to its list, a list page to the dashboard.
    if (parts.length > 3) return `/${parts.slice(0, 3).join("/")}`;
    return parts.length > 2 ? `/${parts[0]}/${parts[1]}` : `/${parts[0]}`;
  }
  if (parts.length > 1 && ["properties", "projects", "blog"].includes(parts[0])) return `/${parts[0]}`;
  return "/";
}

/** Phone-only back arrow (hidden from 768px up). 44x44 target. Uses history when the visitor came from within the site. */
export default function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const first = useRef(pathname);

  useEffect(() => {
    try {
      // Arrived from another page of this site (full page load), or navigated inside the app since.
      if (document.referrer && new URL(document.referrer).origin === window.location.origin) sessionStorage.setItem(KEY, "1");
      if (pathname !== first.current) sessionStorage.setItem(KEY, "1");
    } catch {}
  }, [pathname]);

  function back() {
    if (isConsole(pathname)) { router.push(previousConsolePage(pathname)); return; }
    let internal = false;
    try { internal = sessionStorage.getItem(KEY) === "1"; } catch {}
    if (internal && window.history.length > 1) router.back();
    else router.push(logicalParent(pathname));
  }

  return (
    <button type="button" onClick={back} aria-label="Go back" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-brand text-ink hover:bg-bg md:hidden ${className}`}>
      <Icon name="arrowLeft" size={20} />
    </button>
  );
}
