"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { nav, site } from "@/data/site";
import BackButton from "./BackButton";
import Icon from "./Icon";
import { Container } from "./ui";

export default function Header({ phone = site.phone }: { phone?: string }) {
  const tel = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-6">
        <div className="flex min-w-0 items-center">
          {pathname !== "/" && <BackButton className="-ml-2.5 mr-0.5" />}
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={`${site.name} home`} onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-brand border border-ink font-heading text-sm">{site.monogram}</span>
            <span className="truncate font-heading text-lg leading-none md:text-xl">{site.name}</span>
          </Link>
        </div>
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {nav.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} className={`text-sm ${active ? "text-accent-ink" : "text-ink hover:text-accent-ink"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <a href={tel} className="flex items-center gap-2 text-sm tabular">
            <Icon name="phone" size={16} />
            {phone}
          </a>
          <Link href="/contact" className="rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">
            Enquire
          </Link>
        </div>
        <button type="button" className="flex h-10 w-10 items-center justify-center lg:hidden" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
          <Icon name={open ? "close" : "menu"} size={22} />
        </button>
      </Container>
      {open && (
        <div className="border-t border-line bg-bg lg:hidden">
          <Container className="flex flex-col py-2">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="border-b border-line py-3 text-base" onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 py-4">
              <a href={tel} className="flex items-center gap-2 text-sm tabular">
                <Icon name="phone" size={16} />
                {phone}
              </a>
              <Link href="/contact" onClick={() => setOpen(false)} className="rounded-brand bg-accent px-4 py-3 text-center text-sm font-medium text-white">
                Enquire
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
