"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { site } from "@/data/site";
import Icon from "./Icon";

/**
 * Phone bottom bar. It keeps --bottom-bar-h on <html> equal to its height (0 when hidden on larger screens), so the hero,
 * the footer and the cookie notice can leave room for it.
 */
export default function MobileBar({ enquireHref = "/contact" }: { enquireHref?: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--bottom-bar-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => { ro.disconnect(); root.style.removeProperty("--bottom-bar-h"); };
  }, []);
  return (
    <div ref={bar} className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <a href={site.phoneHref} className="flex items-center justify-center gap-2 py-3.5 text-sm">
        <Icon name="phone" size={18} />Call
      </a>
      <a href={site.whatsappHref} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 border-x border-line py-3.5 text-sm">
        <Icon name="whatsapp" size={18} />WhatsApp
      </a>
      <Link href={enquireHref} className="flex items-center justify-center gap-2 bg-accent py-3.5 text-sm font-medium text-white">
        Enquire
      </Link>
    </div>
  );
}
