"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import { inputCls } from "./Form";

export interface RowCol { name: string; label: string; type?: "text" | "date" | "checkbox"; placeholder?: string; width?: string }
type RowValue = Record<string, string | boolean>;

/**
 * Add-row table for server-action forms. Each column submits one value per row under its `name`
 * (read with formData.getAll(name)); checkbox columns submit "1" or "0" so rows stay aligned.
 */
export default function RowsEditor({ columns, initial = [], addLabel = "Add row", emptyRow }: { columns: RowCol[]; initial?: RowValue[]; addLabel?: string; emptyRow?: RowValue }) {
  const blank = () => emptyRow ?? Object.fromEntries(columns.map((c) => [c.name, c.type === "checkbox" ? false : ""]));
  const [rows, setRows] = useState<RowValue[]>(initial.length ? initial : []);
  const update = (i: number, k: string, v: string | boolean) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= rows.length) return; const next = [...rows]; [next[i], next[j]] = [next[j], next[i]]; setRows(next); };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-muted">{columns.map((c) => <th key={c.name} className="pb-1 pr-2 font-medium" style={{ width: c.width }}>{c.label}</th>)}<th className="w-24" /></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.name} className="pr-2 pb-2 align-middle">
                  {c.type === "checkbox" ? (
                    <>
                      <input type="checkbox" checked={!!r[c.name]} onChange={(e) => update(i, c.name, e.target.checked)} className="accent-[#00BF63]" aria-label={c.label} />
                      <input type="hidden" name={c.name} value={r[c.name] ? "1" : "0"} />
                    </>
                  ) : (
                    <input type={c.type ?? "text"} name={c.name} value={String(r[c.name] ?? "")} onChange={(e) => update(i, c.name, e.target.value)} placeholder={c.placeholder} className={`${inputCls} py-1.5`} aria-label={c.label} />
                  )}
                </td>
              ))}
              <td className="pb-2 align-middle">
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Move up" className="rounded-brand border border-line p-1 hover:border-ink"><Icon name="up" size={12} /></button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Move down" className="rounded-brand border border-line p-1 hover:border-ink"><Icon name="down" size={12} /></button>
                  <button type="button" onClick={() => setRows(rows.filter((_, k) => k !== i))} aria-label="Remove row" className="rounded-brand border border-line p-1 text-red-700 hover:border-red-700"><Icon name="x" size={12} /></button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => setRows([...rows, blank()])} className="mt-1 inline-flex items-center gap-1 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="plus" size={14} />{addLabel}</button>
    </div>
  );
}
