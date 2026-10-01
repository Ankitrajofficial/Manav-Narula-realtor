"use client";
import Link from "next/link";
import { useRef } from "react";
import type { Property } from "@/data/properties";
import PropertyCard from "./PropertyCard";
import Icon from "./Icon";

export default function FeaturedStrip({ items, title, intro, action }: { items: Property[]; title: string; intro?: string; action: { label: string; href: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  const arrow = "flex h-9 w-9 items-center justify-center rounded-brand border border-line bg-white hover:border-ink";
  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl">{title}</h2>
          {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
        </div>
        <div className="flex items-center gap-4">
          <Link href={action.href} className="inline-flex items-center gap-1 text-sm text-accent-ink hover:underline">
            {action.label}
            <Icon name="arrowRight" size={16} />
          </Link>
          <div className="hidden gap-2 md:flex">
            <button type="button" aria-label="Scroll left" onClick={() => scroll(-1)} className={arrow}><Icon name="arrowLeft" size={16} /></button>
            <button type="button" aria-label="Scroll right" onClick={() => scroll(1)} className={arrow}><Icon name="arrowRight" size={16} /></button>
          </div>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
        {items.map((p) => <PropertyCard key={p.slug} p={p} />)}
      </div>
    </div>
  );
}
