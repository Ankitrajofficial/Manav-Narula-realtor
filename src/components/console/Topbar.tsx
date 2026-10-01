"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { inputCls } from "./Form";

export default function Topbar({ searchPath, quick, notifications }: { searchPath: string; quick: { label: string; href: string }[]; notifications: { count: number; href: string } }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-line bg-bg/95 px-6 backdrop-blur-sm">
      <form action={searchPath} className="relative w-full max-w-md">
        <Icon name="search" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input name="q" placeholder="Search leads, prospects, properties by name or phone" className={`${inputCls} pl-8`} aria-label="Global search" />
      </form>
      <div className="flex items-center gap-2">
        <Link href={notifications.href} className="relative flex h-9 w-9 items-center justify-center rounded-brand border border-line bg-white hover:border-ink" aria-label={`${notifications.count} notifications`}>
          <Icon name="bell" size={18} />
          {notifications.count > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white tabular">{notifications.count}</span>}
        </Link>
        <div ref={ref} className="relative">
          <button type="button" onClick={() => setOpen(!open)} className="inline-flex h-9 items-center gap-1.5 rounded-brand bg-accent px-3 text-sm font-medium text-white hover:bg-accent-ink" aria-expanded={open}>
            <Icon name="plus" size={16} />New
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-44 overflow-hidden rounded-brand border border-line bg-white py-1" role="menu">
              {quick.map((qk) => <Link key={qk.href} href={qk.href} role="menuitem" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-bg">{qk.label}</Link>)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
