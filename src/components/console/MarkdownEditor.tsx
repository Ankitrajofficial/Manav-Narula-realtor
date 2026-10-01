"use client";
import { useState } from "react";
import Markdown from "./Markdown";
import { inputCls } from "./Form";

export default function MarkdownEditor({ name, initial = "", label = "Body", rows = 18, error }: { name: string; initial?: string; label?: string; rows?: number; error?: string }) {
  const [v, setV] = useState(initial);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <label htmlFor={name} className="mb-1 block text-xs font-medium text-ink">{label}</label>
        <textarea id={name} name={name} value={v} onChange={(e) => setV(e.target.value)} rows={rows} className={`${inputCls} font-mono text-[13px] ${error ? "border-red-600" : ""}`} placeholder={"Write in markdown. Blank line between paragraphs, ## for headings, - for bullets, **bold**, [link](https://...)"} />
        {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : <p className="mt-1 text-xs text-muted">{v.trim().split(/\s+/).filter(Boolean).length} words</p>}
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-ink">Preview</p>
        <div className="prose-article max-h-[32rem] overflow-y-auto rounded-brand border border-line bg-white p-4 text-[15px] leading-relaxed">
          {v.trim() ? <Markdown source={v} /> : <p className="text-muted">Nothing to preview yet.</p>}
        </div>
      </div>
    </div>
  );
}
