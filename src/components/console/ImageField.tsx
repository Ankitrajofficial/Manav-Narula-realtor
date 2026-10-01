"use client";
import { useState } from "react";

/** Single image or PDF field: shows the current file, lets the admin replace or clear it. Submits `<name>` (file), `<name>_current` (kept URL) and `<name>_clear`. */
export default function ImageField({ name, label, initial, hint, accept = "image/jpeg,image/png,image/webp", preview = true }: { name: string; label: string; initial?: string | null; hint?: string; accept?: string; preview?: boolean }) {
  const [current, setCurrent] = useState<string | null>(initial ?? null);
  return (
    <div>
      <p className="mb-1 block text-xs font-medium text-ink">{label}</p>
      {current && (
        <div className="mb-2 flex items-center gap-3">
          {preview && !current.endsWith(".pdf") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current} alt="" className="h-16 w-24 rounded-brand border border-line object-cover" />
          ) : (
            <a href={current} target="_blank" rel="noopener" className="text-sm text-accent-ink underline">{current.split("/").pop()}</a>
          )}
          <button type="button" onClick={() => setCurrent(null)} className="text-xs text-red-700 hover:underline">Remove</button>
          <input type="hidden" name={`${name}_current`} value={current} />
        </div>
      )}
      {!current && initial && <input type="hidden" name={`${name}_clear`} value="1" />}
      <input type="file" name={name} accept={accept} className="block w-full text-sm text-muted file:mr-3 file:rounded-brand file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-ink" />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
