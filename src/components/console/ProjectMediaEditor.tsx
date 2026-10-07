"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import type { ProjectMedia, ProjectMediaKind } from "@/data/projects";

export const MEDIA_KINDS: { value: ProjectMediaKind; label: string }[] = [
  { value: "elevation", label: "Elevation (hero + gallery)" },
  { value: "interior", label: "Interior (gallery)" },
  { value: "gallery", label: "Gallery" },
  { value: "floor-plan", label: "Floor plan" },
  { value: "master-plan", label: "Master plan" },
  { value: "amenity", label: "Amenity" },
  { value: "location-map", label: "Location map" },
];

interface Row extends ProjectMedia { key: string }
let seq = 0;
const newKey = () => `n${Date.now().toString(36)}${seq++}`;

/**
 * Every image of a project (or of one unit type, with `prefix`) with its section, alt text and whether it is shown. Each row
 * posts `<prefix>media_key` (order), `_url`, `_kind`, `_alt`, `_published`, `_developer` and an optional replacement file
 * `<prefix>media_file_<key>`. The first elevation is the hero image.
 */
export default function ProjectMediaEditor({ initial, prefix = "", heroLabel = "Hero image" }: { initial: ProjectMedia[]; prefix?: string; heroLabel?: string }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map((m, i) => ({ ...m, key: `m${i}` })));
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (i: number, to: number) => setRows((rs) => {
    if (to < 0 || to >= rs.length) return rs;
    const next = [...rs]; const [it] = next.splice(i, 1); next.splice(to, 0, it); return next;
  });
  const coverKey = rows.find((r) => r.kind === "elevation" && r.published !== false)?.key;

  return (
    <div>
      <p className="mb-1 block text-xs font-medium text-ink">Images</p>
      <p className="mb-3 text-xs text-muted">The first elevation is the hero image. Choose a file on any row to replace that image; its section and alt text stay. Alt text describes the picture for search engines and screen readers.</p>
      {rows.length === 0 && <p className="mb-3 rounded-brand border border-dashed border-line px-3 py-4 text-sm text-muted">No images yet. The project page shows a branded placeholder until you add one.</p>}
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={r.key} className={`grid gap-3 rounded-brand border bg-white p-3 sm:grid-cols-[160px_1fr] ${r.key === coverKey ? "border-accent" : "border-line"}`}>
            <input type="hidden" name={`${prefix}media_key`} value={r.key} />
            <input type="hidden" name={`${prefix}media_url`} value={r.url} />
            <input type="hidden" name={`${prefix}media_published`} value={r.published === false ? "0" : "1"} />
            <input type="hidden" name={`${prefix}media_developer`} value={r.developer ? "1" : "0"} />
            <div>
              {previews[r.key] || r.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[r.key] || r.url} alt="" className="aspect-[4/3] w-full rounded-brand border border-line bg-bg object-contain" />
              ) : <div className="flex aspect-[4/3] items-center justify-center rounded-brand border border-dashed border-line text-xs text-muted">Choose a file</div>}
              {r.key === coverKey && <p className="mt-1 text-xs text-accent-ink">{heroLabel}</p>}
              {r.developer && <p className="mt-1 text-xs text-muted">Developer&apos;s image{r.published === false ? ": hidden on the website" : ""}</p>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-medium text-muted">Section
                <select name={`${prefix}media_kind`} value={r.kind} onChange={(e) => update(r.key, { kind: e.target.value as ProjectMediaKind })} className="mt-1 w-full rounded-brand border border-line bg-white px-2 py-2 text-sm text-ink">
                  {MEDIA_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium text-muted">{r.url ? "Replace with" : "File"}
                <input type="file" name={`${prefix}media_file_${r.key}`} accept="image/jpeg,image/png,image/webp" required={!r.url}
                  onChange={(e) => { const f = e.target.files?.[0]; setPreviews((p) => ({ ...p, [r.key]: f ? URL.createObjectURL(f) : "" })); }}
                  className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-brand file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-ink" />
              </label>
              <label className="text-xs font-medium text-muted sm:col-span-2">Alt text
                <input name={`${prefix}media_alt`} value={r.alt} onChange={(e) => update(r.key, { alt: e.target.value })} required maxLength={200} placeholder="e.g. Entrance gate of the project (render)"
                  className="mt-1 w-full rounded-brand border border-line bg-white px-3 py-2 text-sm text-ink" />
              </label>
              <div className="flex items-center gap-1 sm:col-span-2">
                <label className="mr-2 inline-flex items-center gap-1.5 text-xs text-ink">
                  <input type="checkbox" checked={r.published !== false} onChange={(e) => update(r.key, { published: e.target.checked })} className="accent-[#00BF63]" />Show on website
                </label>
                <button type="button" onClick={() => move(i, i - 1)} aria-label="Move up" className="rounded-brand border border-line p-1.5 hover:border-ink"><Icon name="up" size={12} /></button>
                <button type="button" onClick={() => move(i, i + 1)} aria-label="Move down" className="rounded-brand border border-line p-1.5 hover:border-ink"><Icon name="down" size={12} /></button>
                <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="ml-auto inline-flex items-center gap-1 rounded-brand border border-line px-2 py-1 text-xs text-red-700 hover:border-red-700"><Icon name="x" size={12} />Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setRows((rs) => [...rs, { key: newKey(), url: "", alt: "", kind: rs.length ? "gallery" : "elevation", published: true }])}
        className="mt-3 inline-flex items-center gap-2 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="plus" size={14} />Add image</button>
      <p className="mt-1 text-xs text-muted">JPG, PNG or WebP, up to 16 MB each. Changes are saved when you save the project.</p>
    </div>
  );
}
