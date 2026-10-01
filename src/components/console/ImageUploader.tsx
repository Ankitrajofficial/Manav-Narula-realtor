"use client";
import { useState } from "react";
import Icon from "@/components/Icon";

/**
 * Multi-image field for server-action forms. Existing images are kept in order as hidden inputs (`<name>_urls`),
 * the cover as `<name>_cover`, and newly chosen files go in the file input named `<name>`.
 * Reorder with the arrows or by dragging a tile; click "Cover" to set the cover.
 */
export default function ImageUploader({ name, initial = [], initialCover, withCover = true, label = "Images", hint }: { name: string; initial?: string[]; initialCover?: string | null; withCover?: boolean; label?: string; hint?: string }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [cover, setCover] = useState<string | null>(initialCover ?? initial[0] ?? null);
  const [drag, setDrag] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= urls.length || from === to) return;
    const next = [...urls]; const [it] = next.splice(from, 1); next.splice(to, 0, it); setUrls(next);
  };
  const remove = (i: number) => { const next = urls.filter((_, k) => k !== i); setUrls(next); if (cover === urls[i]) setCover(next[0] ?? null); };
  return (
    <div>
      <p className="mb-1 block text-xs font-medium text-ink">{label}</p>
      {urls.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {urls.map((u, i) => (
            <li key={u + i} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }}
              className={`overflow-hidden rounded-brand border bg-white ${cover === u && withCover ? "border-accent" : "border-line"} ${drag === i ? "opacity-50" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center justify-between gap-1 px-2 py-1.5 text-xs">
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} aria-label="Move left" className="rounded-brand border border-line p-1 hover:border-ink"><Icon name="arrowLeft" size={12} /></button>
                  <button type="button" onClick={() => move(i, i + 1)} aria-label="Move right" className="rounded-brand border border-line p-1 hover:border-ink"><Icon name="arrowRight" size={12} /></button>
                </span>
                <span className="flex gap-1">
                  {withCover && (cover === u ? <span className="text-accent-ink">Cover</span> : <button type="button" onClick={() => setCover(u)} className="text-muted hover:text-ink">Set cover</button>)}
                  <button type="button" onClick={() => remove(i)} aria-label="Remove" className="text-red-700"><Icon name="x" size={12} /></button>
                </span>
              </div>
              <input type="hidden" name={`${name}_urls`} value={u} />
            </li>
          ))}
        </ul>
      )}
      {withCover && cover && <input type="hidden" name={`${name}_cover`} value={cover} />}
      <input type="file" name={name} multiple accept="image/jpeg,image/png,image/webp" className="block w-full text-sm text-muted file:mr-3 file:rounded-brand file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-ink" />
      <p className="mt-1 text-xs text-muted">{hint ?? "JPG, PNG or WebP, up to 15 MB each. New files are added after the existing ones; drag tiles to reorder."}</p>
    </div>
  );
}
