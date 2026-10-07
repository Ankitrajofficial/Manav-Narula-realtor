"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { unsplash } from "@/lib/format";

type Banner = { id: string; image: string; headline: string; line: string; cta: { label: string; href: string }; showText?: boolean };
import Icon from "./Icon";

/** Admin-managed banner slot: creatives come from the banners table (Admin console > Banners). */
export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const n = banners.length;
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n]);
  const b = banners[i];
  return (
    <section aria-roledescription="carousel" aria-label="Featured banners" className="relative border-b border-line bg-white">
      <div className="relative h-[520px] w-full md:h-[560px]">
        {banners.map((bn, k) => (
          <div key={bn.id} className={`absolute inset-0 transition-opacity duration-500 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={k !== i}>
            {bn.showText === false ? (
              // A finished creative with its own text: shown untinted and linked as a whole. On phones it is shown whole
              // (contain) over a blurred copy, since cropping it to the tall slot would cut off its text.
              <Link href={bn.cta.href} aria-label={bn.headline} tabIndex={k === i ? 0 : -1} className="absolute inset-0 block bg-ink">
                <Image src={unsplash(bn.image, 1600, 900)} alt="" fill sizes="100vw" className="scale-110 object-cover blur-xl md:hidden" />
                <Image src={unsplash(bn.image, 1600, 900)} alt={bn.headline} fill priority={k === 0} sizes="100vw" className="object-contain md:object-cover" />
              </Link>
            ) : (
              <>
                <Image src={unsplash(bn.image, 1600, 900)} alt="" fill priority={k === 0} sizes="100vw" className="object-cover" />
                <div className="absolute inset-0 bg-ink/45" />
              </>
            )}
          </div>
        ))}
        {b.showText === false && <h1 className="sr-only">{b.headline}</h1>}
        {b.showText !== false && <div className="relative mx-auto flex h-full max-w-[1280px] flex-col justify-end px-4 pb-16 text-white md:px-8 md:pb-24">
          <h1 className="max-w-3xl text-4xl leading-tight md:text-6xl">{b.headline}</h1>
          <p className="mt-4 max-w-xl text-base md:text-lg">{b.line}</p>
          <Link href={b.cta.href} className="mt-6 inline-flex w-fit items-center gap-2 rounded-brand bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-ink">
            {b.cta.label}
            <Icon name="arrowRight" size={16} />
          </Link>
        </div>}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 md:bottom-8">
          <button type="button" aria-label="Previous banner" onClick={() => setI((i - 1 + n) % n)} className="flex h-8 w-8 items-center justify-center rounded-brand border border-white/60 text-white">
            <Icon name="arrowLeft" size={16} />
          </button>
          {banners.map((bn, k) => (
            <button key={bn.id} type="button" aria-label={`Banner ${k + 1}`} aria-current={k === i} onClick={() => setI(k)} className={`h-2 w-2 rounded-full ${k === i ? "bg-accent" : "bg-white/60"}`} />
          ))}
          <button type="button" aria-label="Next banner" onClick={() => setI((i + 1) % n)} className="flex h-8 w-8 items-center justify-center rounded-brand border border-white/60 text-white">
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
