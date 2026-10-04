"use client";
import Image from "next/image";
import { useState } from "react";
import { unsplash } from "@/lib/format";
import Icon from "./Icon";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const go = (d: number) => setI((k) => (k + d + images.length) % images.length);
  const arrow = "absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white";
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-brand border border-line bg-line">
        <Image src={unsplash(images[i], 1200, 900)} alt={`${alt}, photo ${i + 1}`} fill priority sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" />
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-3`}><Icon name="arrowLeft" size={16} /></button>
            <button type="button" aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-3`}><Icon name="arrowRight" size={16} /></button>
            <span className="absolute bottom-3 right-3 rounded-brand bg-black/60 px-2 py-0.5 text-xs tabular text-white">{i + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        // Four thumbnails fit across; any more scroll sideways so every photo stays reachable.
        <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-1">
          {images.map((img, k) => (
            <button key={img + k} type="button" aria-label={`Photo ${k + 1}`} aria-current={k === i} onClick={() => setI(k)} className={`relative aspect-[4/3] w-[calc((100%-2.25rem)/4)] shrink-0 snap-start overflow-hidden rounded-brand border ${k === i ? "border-accent" : "border-line"}`}>
              <Image src={unsplash(img, 400, 300)} alt="" fill sizes="200px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
