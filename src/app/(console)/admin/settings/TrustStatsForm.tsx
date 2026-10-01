"use client";
import { useActionState, useState } from "react";
import Icon from "@/components/Icon";
import { FormError, SubmitButton, fieldCls, inputCls } from "@/components/console/Form";
import { MAX_ACTIVE_STATS, MIN_ACTIVE_STATS, type TrustStat } from "@/lib/trust-stats";
import type { TrustState } from "./actions";

type Row = TrustStat & { key: number };

/** Admin > Settings > Trust numbers: the stats row under the brand statement on the home page. */
export default function TrustStatsForm({ stats, foundedYear, action }: { stats: TrustStat[]; foundedYear: number; action: (p: TrustState, fd: FormData) => Promise<TrustState> }) {
  const [state, act] = useActionState<TrustState, FormData>(action, {});
  const [rows, setRows] = useState<Row[]>(() => [...stats].sort((a, b) => a.sort_order - b.sort_order).map((s, i) => ({ ...s, key: i })));
  const [dragKey, setDragKey] = useState<number | null>(null);
  const active = rows.filter((r) => r.is_active).length;
  const patch = (key: number, p: Partial<TrustStat>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const move = (from: number, to: number) => setRows((rs) => {
    if (to < 0 || to >= rs.length || from === to) return rs;
    const next = [...rs]; const [it] = next.splice(from, 1); next.splice(to, 0, it); return next;
  });
  const payload = JSON.stringify(rows.map(({ key: _key, ...r }, i) => ({ ...r, sort_order: i }))); // eslint-disable-line @typescript-eslint/no-unused-vars

  return (
    <form action={act} id="trust" className="scroll-mt-20 space-y-3">
      <section className="rounded-brand border border-line bg-white p-5">
        <h2 className="text-base">Trust numbers</h2>
        <p className="mt-1 text-xs text-muted">The row of numbers under the brand statement on the home page. Turn on {MIN_ACTIVE_STATS} to {MAX_ACTIVE_STATS}; the grid adjusts with no gaps. Drag rows or use the arrows to reorder.</p>
        <FormError message={state.error} />
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {rows.map((r, i) => (
            <li key={r.key} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (dragKey != null) move(rows.findIndex((x) => x.key === dragKey), i); setDragKey(null); }}
              className={`py-3 ${dragKey === r.key ? "opacity-50" : ""} ${r.is_active ? "" : "text-muted"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span draggable onDragStart={() => setDragKey(r.key)} onDragEnd={() => setDragKey(null)} className="hidden cursor-grab text-muted md:inline" title="Drag to reorder" aria-hidden="true"><Icon name="menu" size={16} /></span>
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${r.label} up`} className="rounded-brand border border-line p-1.5 hover:border-ink disabled:opacity-40"><Icon name="up" size={12} /></button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} aria-label={`Move ${r.label} down`} className="rounded-brand border border-line p-1.5 hover:border-ink disabled:opacity-40"><Icon name="down" size={12} /></button>
                <input value={r.value} onChange={(e) => patch(r.key, { value: e.target.value })} inputMode="decimal" aria-label="Value" placeholder="12" className={`${fieldCls} w-20 py-1.5 tabular`} />
                <select value={r.suffix} onChange={(e) => patch(r.key, { suffix: e.target.value as TrustStat["suffix"] })} aria-label="Suffix" className={`${fieldCls} w-20 py-1.5`}>
                  <option value="+">+</option><option value="★">★</option><option value="">none</option>
                </select>
                <input value={r.label} onChange={(e) => patch(r.key, { label: e.target.value })} aria-label="Label" placeholder="Years in Jalandhar" maxLength={40} className={`${fieldCls} min-w-0 flex-1 basis-40 py-1.5`} />
                <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={r.is_active} onChange={(e) => patch(r.key, { is_active: e.target.checked })} className="accent-[#00BF63]" />Show</label>
                <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} aria-label={`Remove ${r.label}`} className="rounded-brand border border-line p-1.5 text-red-700 hover:border-red-700"><Icon name="x" size={12} /></button>
              </div>
              <input value={r.link ?? ""} onChange={(e) => patch(r.key, { link: e.target.value || null })} aria-label="Link (optional)" placeholder="Link (optional), e.g. Google Business profile" className={`${inputCls} mt-2 py-1.5 text-xs`} />
              {state.rowErrors?.[i] && <p className="mt-1 text-xs text-red-700" role="alert">{state.rowErrors[i]}</p>}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button type="button" disabled={rows.length >= 10} onClick={() => setRows((rs) => [...rs, { value: "", suffix: "+", label: "", link: null, sort_order: rs.length, is_active: false, key: Date.now() }])} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink disabled:opacity-40"><Icon name="plus" size={14} />Add number</button>
          <span className={`text-xs tabular ${active < MIN_ACTIVE_STATS || active > MAX_ACTIVE_STATS ? "text-red-700" : "text-muted"}`}>{active} shown</span>
        </div>
        <label className="mt-4 block border-t border-line pt-4 text-xs font-medium">Founded year
          <input name="founded_year" type="number" min={1950} max={new Date().getFullYear()} defaultValue={foundedYear} className={`${fieldCls} mt-1 block w-32`} />
          <span className="mt-1 block font-normal text-muted">Used in the tagline, e.g. “Trusted property advisors in Jalandhar since {foundedYear}”.</span>
        </label>
        <input type="hidden" name="stats" value={payload} />
      </section>
      <SubmitButton>Save trust numbers</SubmitButton>
    </form>
  );
}
