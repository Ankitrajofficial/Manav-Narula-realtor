"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import type { StoredUnit } from "@/lib/project-import";
import { inputCls, labelCls } from "./Form";
import ProjectMediaEditor from "./ProjectMediaEditor";

interface Row extends StoredUnit { key: string }
let seq = 0;

/**
 * A project's unit types (e.g. 2 BHK, 3 BHK, Affordable): each becomes a tab on the project page and its own page at
 * /projects/<project>/<unit slug>. Fields post as `unit_<field>_<key>`; images use the Images manager with prefix `unit_<key>_`.
 */
export default function UnitsEditor({ initial, projectSlug }: { initial: StoredUnit[]; projectSlug: string }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map((u, i) => ({ ...u, key: `u${i}` })));
  const [open, setOpen] = useState<string | null>(null);
  const move = (i: number, to: number) => setRows((rs) => { if (to < 0 || to >= rs.length) return rs; const n = [...rs]; const [it] = n.splice(i, 1); n.splice(to, 0, it); return n; });
  const add = () => {
    const key = `n${Date.now().toString(36)}${seq++}`;
    setRows((rs) => [...rs, { key, slug: "", label: "", name: "", source_url: null, rera: null, rera_source: "missing", configurations: [], size_range: null, description: null, highlights: [], seo_title: null, seo_description: null, media: [], edited: [] }]);
    setOpen(key);
  };
  const field = (r: Row, name: string, label: string, value: string | null, opts: { hint?: string; area?: boolean; wide?: boolean; placeholder?: string } = {}) => (
    <label className={opts.wide ? "md:col-span-2" : ""}>
      <span className={labelCls}>{label}</span>
      {opts.area
        ? <textarea name={`unit_${name}_${r.key}`} defaultValue={value ?? ""} rows={name === "description" ? 5 : 3} placeholder={opts.placeholder} className={inputCls} />
        : <input name={`unit_${name}_${r.key}`} defaultValue={value ?? ""} placeholder={opts.placeholder} className={inputCls} />}
      {opts.hint && <span className="mt-1 block text-xs text-muted">{opts.hint}</span>}
    </label>
  );

  return (
    <div>
      {rows.length === 0 && <p className="mb-3 rounded-brand border border-dashed border-line px-3 py-4 text-sm text-muted">No unit types. Add one to show tabs such as 2 BHK | 3 BHK on the project page.</p>}
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={r.key} className="rounded-brand border border-line bg-white">
            <input type="hidden" name="unit_key" value={r.key} />
            <input type="hidden" name={`unit_source_url_${r.key}`} value={r.source_url ?? ""} />
            <input type="hidden" name={`unit_rera_source_${r.key}`} value={r.rera_source} />
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <button type="button" onClick={() => setOpen(open === r.key ? null : r.key)} aria-expanded={open === r.key} className="flex flex-1 items-center gap-2 text-left text-sm font-medium">
                <Icon name={open === r.key ? "down" : "chevronRight"} size={14} />{r.label || "New unit type"}
                {r.slug && <span className="font-normal text-muted">/projects/{projectSlug}/{r.slug}</span>}
                {r.edited?.length > 0 && <span className="rounded-brand bg-bg px-1.5 py-0.5 text-xs font-normal text-muted">edited: {r.edited.join(", ")}</span>}
              </button>
              <button type="button" onClick={() => move(i, i - 1)} aria-label="Move up" className="rounded-brand border border-line p-1.5 hover:border-ink"><Icon name="up" size={12} /></button>
              <button type="button" onClick={() => move(i, i + 1)} aria-label="Move down" className="rounded-brand border border-line p-1.5 hover:border-ink"><Icon name="down" size={12} /></button>
              <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="inline-flex items-center gap-1 rounded-brand border border-line px-2 py-1 text-xs text-red-700 hover:border-red-700"><Icon name="x" size={12} />Remove</button>
            </div>
            {/* Closed rows stay in the form (hidden) so their values are saved too. */}
            <div hidden={open !== r.key} className="grid gap-4 border-t border-line p-4 md:grid-cols-2">
              {field(r, "label", "Tab label", r.label, { placeholder: "2 BHK" })}
              {field(r, "name", "Name", r.name, { placeholder: "2 BHK Flats", hint: "Used in headings: \"2 BHK Flats at Mexmon Dreams\"." })}
              {field(r, "slug", "Page address", r.slug, { placeholder: "2-bhk-flats-jalandhar", hint: "Blank: made from the name." })}
              {field(r, "rera", "Project RERA No.", r.rera, { hint: r.rera_source === "inherited from parent" ? "Inherited from the project: the unit's own page did not show one." : r.rera_source === "found on page" ? "Found on the developer's page." : undefined })}
              {field(r, "configurations", "Configurations", r.configurations.join(", "), { placeholder: "2 BHK", hint: "Comma-separated." })}
              {field(r, "sizes", "Sizes", r.size_range, { placeholder: "1,150–1,250 sq ft", hint: "Blank shows \"On request\"." })}
              {field(r, "description", "Description", r.description, { area: true, wide: true, hint: "Our own words. Blank line between paragraphs." })}
              {field(r, "highlights", "Highlights", r.highlights.join("\n"), { area: true, wide: true, hint: "One per line." })}
              {field(r, "seo_title", "SEO title", r.seo_title)}
              {field(r, "seo_description", "SEO description", r.seo_description)}
              <div className="md:col-span-2"><ProjectMediaEditor initial={r.media} prefix={`unit_${r.key}_`} heroLabel="Shown first in this tab" /></div>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={add} className="mt-3 inline-flex items-center gap-2 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="plus" size={14} />Add unit type</button>
    </div>
  );
}
