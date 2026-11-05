"use client";
import { useEffect, useRef } from "react";

/** Keeps a usable list on short windows; below this the page scrolls as well. */
const MIN_HEIGHT = 320;
/** Space kept under the list: the page's bottom padding. */
const BOTTOM_GAP = 24;

/**
 * On desktop the list scrolls inside the window while the title, filters and page numbers stay in place. The height is
 * measured because what sits above changes (More filters, the bulk bar). Phones keep normal page scrolling.
 */
export default function TableFrame({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const measure = () => {
      if (!desktop.matches) { el.style.maxHeight = ""; return; }
      const after = el.nextElementSibling instanceof HTMLElement ? el.nextElementSibling.offsetHeight + 16 : 0;
      const top = el.getBoundingClientRect().top + window.scrollY;
      el.style.maxHeight = `${Math.max(window.innerHeight - top - after - BOTTOM_GAP, MIN_HEIGHT)}px`;
    };
    measure();
    const seen = new ResizeObserver(measure);
    seen.observe(document.body);
    window.addEventListener("resize", measure);
    return () => { seen.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  return <div ref={ref} className={`md:overflow-auto ${className}`}>{children}</div>;
}
