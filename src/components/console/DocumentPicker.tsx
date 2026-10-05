"use client";
import { useState } from "react";
import Icon from "@/components/Icon";

const MAX_TOTAL = 16 * 1024 * 1024;
const mb = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/** Multi-file picker for PDFs and images. Lists what was chosen and warns before the 16 MB per-save limit is hit. */
export default function DocumentPicker({ id = "documents", name = "documents", error }: { id?: string; name?: string; error?: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const total = files.reduce((n, f) => n + f.size, 0);
  return (
    <div>
      <label htmlFor={id} className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-brand border border-dashed bg-white px-4 py-5 text-center text-sm hover:border-ink ${error ? "border-red-600" : "border-line"}`}>
        <Icon name="upload" size={20} className="text-muted" />
        <span>Choose files <span className="text-muted">(PDF, JPG, PNG, WebP · several at once)</span></span>
        <input id={id} name={name} type="file" multiple accept=".pdf,image/jpeg,image/png,image/webp" className="sr-only" aria-invalid={!!error}
          onChange={(e) => setFiles(Array.from(e.currentTarget.files ?? []))} />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 divide-y divide-line rounded-brand border border-line bg-white text-xs">
          {files.map((f) => (
            <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-3 px-3 py-1.5">
              <span className="flex min-w-0 items-center gap-2"><Icon name={f.type.startsWith("image/") ? "image" : "file"} size={14} className="shrink-0 text-muted" /><span className="truncate">{f.name}</span></span>
              <span className="shrink-0 tabular text-muted">{mb(f.size)}</span>
            </li>
          ))}
          <li className={`flex justify-between px-3 py-1.5 ${total > MAX_TOTAL ? "text-red-700" : "text-muted"}`}>
            <span>{files.length} {files.length === 1 ? "file" : "files"}{total > MAX_TOTAL ? " · over 16 MB, choose fewer" : ""}</span>
            <span className="tabular">{mb(total)}</span>
          </li>
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-700" role="alert">{error}</p>}
    </div>
  );
}
