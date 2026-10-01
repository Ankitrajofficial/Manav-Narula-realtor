"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { LocalityOption } from "@/lib/localities";
import LocalitySelect from "./LocalitySelect";
import Icon from "./Icon";
import { inputCls } from "./ui";

const types = ["Kothi", "Apartment", "Plot", "Commercial", "Farmhouse"];
const statuses = ["Ready", "Under construction", "New"];
const budgets = [
  { v: "", l: "Any budget" },
  { v: "0-5000000", l: "Under ₹50 L" },
  { v: "5000000-10000000", l: "₹50 L to ₹1 Cr" },
  { v: "10000000-20000000", l: "₹1 Cr to ₹2 Cr" },
  { v: "20000000-", l: "Above ₹2 Cr" },
];
const rentBudgets = [
  { v: "", l: "Any rent" },
  { v: "0-25000", l: "Under ₹25,000/mo" },
  { v: "25000-50000", l: "₹25,000 to ₹50,000/mo" },
  { v: "50000-", l: "Above ₹50,000/mo" },
];
const areas = [
  { v: "", l: "Any area" },
  { v: "0-1200", l: "Under 1,200 sq.ft" },
  { v: "1200-2000", l: "1,200 to 2,000 sq.ft" },
  { v: "2000-", l: "Above 2,000 sq.ft" },
];

function Fields({ sp, onChange, localities, idPrefix }: { sp: URLSearchParams; onChange: (k: string, v: string) => void; localities: LocalityOption[]; idPrefix: string }) {
  const purpose = sp.get("purpose") ?? "Buy";
  const sel = (k: string) => sp.get(k) ?? "";
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Looking to</legend>
        <div className="grid grid-cols-2 overflow-hidden rounded-brand border border-line text-sm">
          {["Buy", "Rent"].map((p) => (
            <button key={p} type="button" onClick={() => onChange("purpose", p)} className={`py-2 ${purpose === p ? "bg-accent text-white" : "bg-white"}`} aria-pressed={purpose === p}>{p}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Type</legend>
        <ul className="space-y-1.5 text-sm">
          {types.map((t) => (
            <li key={t}>
              <label className="flex items-center gap-2">
                <input type="radio" name="type" checked={sel("type") === t} onChange={() => onChange("type", sel("type") === t ? "" : t)} className="accent-[#00BF63]" />
                {t}
              </label>
            </li>
          ))}
          <li><button type="button" className="text-xs text-muted hover:text-ink" onClick={() => onChange("type", "")}>Any type</button></li>
        </ul>
      </fieldset>
      <div className="text-sm"><label htmlFor={`${idPrefix}-locality`} className="mb-1.5 block font-medium">Locality</label>
        <LocalitySelect id={`${idPrefix}-locality`} options={localities} value={sel("locality")} onChange={(v) => onChange("locality", v)} emptyLabel="Any locality" inputClassName={inputCls} />
      </div>
      <label className="block text-sm"><span className="mb-1.5 block font-medium">BHK</span>
        <select value={sel("bhk")} onChange={(e) => onChange("bhk", e.target.value)} className={inputCls}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}{n === 5 ? "+" : ""} BHK</option>)}
        </select>
      </label>
      <label className="block text-sm"><span className="mb-1.5 block font-medium">Budget</span>
        <select value={sel("budget")} onChange={(e) => onChange("budget", e.target.value)} className={inputCls}>
          {(purpose === "Rent" ? rentBudgets : budgets).map((b) => <option key={b.v} value={b.v}>{b.l}</option>)}
        </select>
      </label>
      <label className="block text-sm"><span className="mb-1.5 block font-medium">Area</span>
        <select value={sel("area")} onChange={(e) => onChange("area", e.target.value)} className={inputCls}>
          {areas.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
        </select>
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Status</legend>
        <ul className="space-y-1.5 text-sm">
          {statuses.map((s) => (
            <li key={s}><label className="flex items-center gap-2"><input type="radio" name="status" checked={sel("status") === s} onChange={() => onChange("status", sel("status") === s ? "" : s)} className="accent-[#00BF63]" />{s}</label></li>
          ))}
          <li><button type="button" className="text-xs text-muted hover:text-ink" onClick={() => onChange("status", "")}>Any status</button></li>
        </ul>
      </fieldset>
    </div>
  );
}

export default function PropertyFilters({ localities }: { localities: LocalityOption[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const onChange = (k: string, v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v); else next.delete(k);
    if (k === "purpose") next.delete("budget");
    next.delete("page");
    router.push(`/properties?${next.toString()}`, { scroll: false });
  };
  const active = ["type", "locality", "bhk", "budget", "area", "status"].filter((k) => sp.get(k)).length;
  return (
    <>
      <aside className="hidden md:block">
        <div className="sticky top-24">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg">Filters</p>
            {active > 0 && <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => router.push("/properties")}>Clear all</button>}
          </div>
          <Fields sp={sp} onChange={onChange} localities={localities} idPrefix="side" />
        </div>
      </aside>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-16 right-4 z-30 inline-flex items-center gap-2 rounded-brand border border-ink bg-white px-4 py-2.5 text-sm shadow-none md:hidden">
        <Icon name="filter" size={16} />Filters{active > 0 && <span className="tabular text-accent-ink">({active})</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close filters" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-brand border-t border-line bg-bg p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg">Filters</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"><Icon name="close" /></button>
            </div>
            <Fields sp={sp} onChange={onChange} localities={localities} idPrefix="sheet" />
            <button type="button" onClick={() => setOpen(false)} className="mt-6 w-full rounded-brand bg-accent py-3 text-sm font-medium text-white">Show results</button>
          </div>
        </div>
      )}
    </>
  );
}
