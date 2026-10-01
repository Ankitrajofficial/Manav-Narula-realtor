"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { unsplash } from "@/lib/format";
import Icon from "./Icon";

export type OfferSlide = { id: string; image: string; headline: string; line: string; cta: { label: string; href: string } };

/** Home page offer slot: every active offer from Admin > Offers, one at a time. */
export default function OfferCarousel({ offers }: { offers: OfferSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = offers.length;
  const go = (k: number) => setI(((k % n) + n) % n);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    const t = setTimeout(update, 0);
    mq.addEventListener("change", update);
    return () => { clearTimeout(t); mq.removeEventListener("change", update); };
  }, []);
  useEffect(() => {
    if (n < 2 || paused || reduced) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, paused, reduced]);

  if (!n) return null;
  const o = offers[i];
  const multi = n > 1;
  return (
    <div
      className="relative overflow-hidden rounded-brand border border-line"
      {...(multi ? { role: "region", "aria-roledescription": "carousel", "aria-label": "Offers" } : {})}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false); }}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null || !multi) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
      }}
    >
      <div className="relative h-[320px] md:h-[360px]">
        {offers.map((of, k) => (
          <div key={of.id} className={`absolute inset-0 ${reduced ? "" : "transition-opacity duration-500"} ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={k !== i}>
            <Image src={unsplash(of.image, 1600, 700)} alt="" fill sizes="100vw" className="object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-ink/50" />
        <div className="relative flex h-full flex-col justify-center px-6 text-white md:px-14" aria-live={multi && !paused && !reduced ? "off" : "polite"}>
          <p className="text-xs uppercase tracking-wide">Offer{multi && <span className="sr-only">{` ${i + 1} of ${n}`}</span>}</p>
          <h2 className="mt-2 max-w-2xl text-3xl md:text-4xl">{o.headline}</h2>
          {o.line && <p className="mt-3 max-w-xl">{o.line}</p>}
          <Link href={o.cta.href} className="mt-6 inline-flex w-fit rounded-brand bg-accent px-5 py-3 text-sm font-medium hover:bg-accent-ink">{o.cta.label}</Link>
        </div>
        {multi && (
          <div className="absolute bottom-4 right-4 flex items-center gap-3 md:bottom-6 md:right-8">
            <button type="button" aria-label="Previous offer" onClick={() => go(i - 1)} className="flex h-8 w-8 items-center justify-center rounded-brand border border-white/60 text-white hover:border-white">
              <Icon name="arrowLeft" size={16} />
            </button>
            {offers.map((of, k) => (
              <button key={of.id} type="button" aria-label={`Offer ${k + 1}`} aria-current={k === i} onClick={() => go(k)} className="flex h-6 w-4 items-center justify-center">
                <span className={`h-2 w-2 rounded-full ${k === i ? "bg-accent" : "bg-white/60"}`} />
              </button>
            ))}
            <button type="button" aria-label="Next offer" onClick={() => go(i + 1)} className="flex h-8 w-8 items-center justify-center rounded-brand border border-white/60 text-white hover:border-white">
              <Icon name="arrowRight" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
