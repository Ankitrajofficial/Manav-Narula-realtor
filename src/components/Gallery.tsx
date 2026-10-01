"use client";
import Image from "next/image";
import { useState } from "react";
import { unsplash } from "@/lib/format";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const thumbs = images.slice(0, 5);
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-brand border border-line bg-line">
        <Image src={unsplash(images[i], 1200, 900)} alt={`${alt}, photo ${i + 1}`} fill priority sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" />
      </div>
      {thumbs.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {thumbs.slice(0, 4).map((img, k) => (
            <button key={img + k} type="button" aria-label={`Photo ${k + 1}`} aria-current={k === i} onClick={() => setI(k)} className={`relative aspect-[4/3] overflow-hidden rounded-brand border ${k === i ? "border-accent" : "border-line"}`}>
              <Image src={unsplash(img, 400, 300)} alt="" fill sizes="200px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
