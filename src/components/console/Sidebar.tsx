"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { logoutAction } from "@/app/(console)/actions";
import { fieldCls } from "./Form";

type NavItem = { href: string; label: string; icon: string };
type Props = { nav: NavItem[]; user: { name: string; role: string }; home: string; quick: { label: string; href: string }[]; notifications: { count: number; href: string } };

function NavLinks({ nav, home, collapsed, onNavigate }: { nav: NavItem[]; home: string; collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {nav.map((n) => {
        const active = n.href === home ? pathname === home : pathname.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} title={n.label} onClick={onNavigate} className={`mx-2 my-0.5 flex items-center gap-3 rounded-brand px-2.5 py-2.5 text-sm md:py-2 ${active ? "bg-accent/10 text-accent-ink" : "text-ink hover:bg-bg"}`}>
            <Icon name={n.icon} size={18} className={active ? "text-accent" : "text-muted"} />
            {!collapsed && <span className="truncate">{n.label}</span>}
          </Link>
        );
      })}
    </>
  );
}

export default function Sidebar({ nav, user, home, quick, notifications }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { const t = setTimeout(() => { try { setCollapsed(localStorage.getItem("mn.sidebar") === "1"); } catch {} }, 0); return () => clearTimeout(t); }, []);
  useEffect(() => { const t = setTimeout(() => setOpen(false), 0); return () => clearTimeout(t); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const toggle = () => { const v = !collapsed; setCollapsed(v); try { localStorage.setItem("mn.sidebar", v ? "1" : "0"); } catch {} };

  return (
    <>
      {/* Phone header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white px-3 md:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-brand hover:bg-bg"><Icon name="menu" size={22} /></button>
        <Link href={home} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-brand border border-ink font-heading text-xs">MN</span>
          <span className="font-heading text-sm">Manav Narula Realtor</span>
        </Link>
        <Link href={notifications.href} className="relative flex h-10 w-10 items-center justify-center rounded-brand hover:bg-bg" aria-label={`${notifications.count} notifications`}>
          <Icon name="bell" size={20} />
          {notifications.count > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white tabular">{notifications.count}</span>}
        </Link>
      </header>

      {/* Phone drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col bg-white">
            <div className="flex h-14 items-center justify-between border-b border-line px-3">
              <div>
                <p className="text-sm">{user.name}</p>
                <p className="text-xs capitalize text-muted">{user.role}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-brand hover:bg-bg"><Icon name="close" size={20} /></button>
            </div>
            <form action={`${home}/search`} className="relative border-b border-line p-3">
              <Icon name="search" size={16} className="absolute left-5.5 top-1/2 -translate-y-1/2 text-muted" />
              <input name="q" placeholder="Search name or phone" className={`${fieldCls} w-full pl-8`} aria-label="Search" />
            </form>
            <nav className="flex-1 overflow-y-auto py-2" aria-label="Console">
              <NavLinks nav={nav} home={home} collapsed={false} onNavigate={() => setOpen(false)} />
              <p className="mx-4 mb-1 mt-4 text-xs uppercase tracking-[0.1em] text-muted">Quick add</p>
              {quick.map((qk) => (
                <Link key={qk.href} href={qk.href} onClick={() => setOpen(false)} className="mx-2 my-0.5 flex items-center gap-3 rounded-brand px-2.5 py-2.5 text-sm hover:bg-bg"><Icon name="plus" size={18} className="text-accent" />{qk.label}</Link>
              ))}
            </nav>
            <form action={logoutAction} className="border-t border-line p-2">
              <button type="submit" className="flex w-full items-center gap-3 rounded-brand px-2.5 py-2.5 text-sm text-muted hover:bg-bg hover:text-ink"><Icon name="logout" size={18} />Log out</button>
            </form>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white transition-[width] md:flex ${collapsed ? "w-14" : "w-56"}`}>
        <div className="flex h-14 items-center gap-2 border-b border-line px-3">
          <Link href={home} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-brand border border-ink font-heading text-xs" aria-label="Home">MN</Link>
          {!collapsed && <span className="truncate font-heading text-sm">Manav Narula Realtor</span>}
        </div>
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Console">
          <NavLinks nav={nav} home={home} collapsed={collapsed} />
        </nav>
        <div className="border-t border-line p-2">
          {!collapsed && (
            <div className="px-2 py-1.5">
              <p className="truncate text-sm">{user.name}</p>
              <p className="text-xs capitalize text-muted">{user.role}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <form action={logoutAction}>
              <button type="submit" title="Log out" className="flex items-center gap-2 rounded-brand px-2.5 py-2 text-sm text-muted hover:bg-bg hover:text-ink"><Icon name="logout" size={18} />{!collapsed && "Log out"}</button>
            </form>
            <button type="button" onClick={toggle} title={collapsed ? "Expand" : "Collapse"} className="rounded-brand p-2 text-muted hover:bg-bg hover:text-ink" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
