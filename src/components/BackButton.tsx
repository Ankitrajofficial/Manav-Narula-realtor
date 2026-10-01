"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Icon from "./Icon";

const KEY = "mn.nav.internal";

/** Where "back" goes when there is no earlier page from this site in the tab's history. */
export function logicalParent(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "admin" || parts[0] === "employee") {
    // Console: any sub-page goes to its list page; a list page goes to the dashboard.
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
