"use client";
import Image from "next/image";
import { useState } from "react";

/** Shows the YouTube thumbnail and loads the real player only after a click, so the page stays fast. */
export default function YouTubeLite({ id, title, large = false }: { id: string; title: string; large?: boolean }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-brand border border-line bg-ink">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} aria-label={`Play video: ${title}`} className="group absolute inset-0">
          <Image src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" fill sizes={large ? "(min-width: 1024px) 900px, 100vw" : "(min-width: 768px) 300px, 100vw"} className="object-cover opacity-90 transition-opacity group-hover:opacity-100" />
          <span className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-brand bg-accent text-white group-hover:bg-accent-ink ${large ? "h-14 w-20" : "h-10 w-14"}`}>
            <svg viewBox="0 0 24 24" width={large ? 28 : 20} height={large ? 28 : 20} fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}
