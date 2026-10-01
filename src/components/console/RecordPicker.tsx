"use client";
import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import Pill from "./Pill";
import { fieldCls } from "./Form";

export interface PickerItem { id: number; name: string; phone: string; locality: string | null; status: string; interest: string | null; assignee_name: string | null; assigned_to: number | null }

/**
 * Call-sheet picker: tick any number of leads and prospects to attach to a task.
 * Submits lead_ids[] and prospect_ids[] as hidden inputs inside the surrounding form.
 */
export default function RecordPicker({ leads, prospects, initialLeads = [], initialProspects = [] }: { leads: PickerItem[]; prospects: PickerItem[]; initialLeads?: number[]; initialProspects?: number[] }) {
  const [tab, setTab] = useState<"lead" | "prospect">(initialLeads.length === 0 && initialProspects.length > 0 ? "prospect" : "lead");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [locality, setLocality] = useState("");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [selLeads, setSelLeads] = useState<Set<number>>(new Set(initialLeads));
  const [selProspects, setSelProspects] = useState<Set<number>>(new Set(initialProspects));

  const items = tab === "lead" ? leads : prospects;
  const selected = tab === "lead" ? selLeads : selProspects;
  const setSelected = tab === "lead" ? setSelLeads : setSelProspects;
  const statuses = useMemo(() => Array.from(new Set(items.map((i) => i.status))), [items]);
  const localities = useMemo(() => Array.from(new Set(items.map((i) => i.locality).filter(Boolean))) as string[], [items]);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items.filter((i) => (!t || i.name.toLowerCase().includes(t) || i.phone.includes(t)) && (!status || i.status === status) && (!locality || i.locality === locality) && (!onlyUnassigned || !i.assigned_to));
  }, [items, q, status, locality, onlyUnassigned]);
  const allShownSelected = shown.length > 0 && shown.every((i) => selected.has(i.id));

  const toggle = (id: number) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected((prev) => { const n = new Set(prev); if (allShownSelected) shown.forEach((i) => n.delete(i.id)); else shown.forEach((i) => n.add(i.id)); return n; });
  const total = selLeads.size + selProspects.size;

  return (
    <div className="rounded-brand border border-line">
      {Array.from(selLeads).map((id) => <input key={`l${id}`} type="hidden" name="lead_ids" value={id} />)}
      {Array.from(selProspects).map((id) => <input key={`p${id}`} type="hidden" name="prospect_ids" value={id} />)}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="flex gap-1">
          {(["lead", "prospect"] as const).map((k) => (
            <button key={k} type="button" onClick={() => { setTab(k); setStatus(""); setLocality(""); }} className={`rounded-brand px-3 py-1.5 text-sm ${tab === k ? "bg-accent text-white" : "hover:bg-bg"}`}>
              {k === "lead" ? "Leads" : "Prospects"} <span className="tabular opacity-80">({k === "lead" ? selLeads.size : selProspects.size})</span>
            </button>
          ))}
        </div>
        <p className="text-sm"><span className="tabular font-medium">{total}</span> {total === 1 ? "person" : "people"} on this sheet</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <div className="relative">
          <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or phone" className={`${fieldCls} w-48 py-1.5 pl-8`} aria-label="Search" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${fieldCls} py-1.5`} aria-label="Status"><option value="">Status: all</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={locality} onChange={(e) => setLocality(e.target.value)} className={`${fieldCls} py-1.5`} aria-label="Locality"><option value="">Locality: all</option>{localities.map((l) => <option key={l}>{l}</option>)}</select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={onlyUnassigned} onChange={(e) => setOnlyUnassigned(e.target.checked)} className="accent-[#00BF63]" />Unassigned only</label>
        <button type="button" onClick={toggleAll} disabled={shown.length === 0} className="ml-auto text-sm text-accent-ink hover:underline disabled:opacity-40">{allShownSelected ? "Clear shown" : `Select all shown (${shown.length})`}</button>
      </div>
      <ul className="max-h-72 divide-y divide-line overflow-y-auto">
        {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No {tab === "lead" ? "leads" : "prospects"} match.</li>}
        {shown.map((i) => (
          <li key={i.id}>
            <label className={`flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-bg ${selected.has(i.id) ? "bg-accent/5" : ""}`}>
              <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} className="accent-[#00BF63]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{i.name} <span className="tabular text-muted">{i.phone}</span></span>
                <span className="block truncate text-xs text-muted">{[i.interest, i.locality, i.assignee_name ? `with ${i.assignee_name}` : "unassigned"].filter(Boolean).join(" · ")}</span>
              </span>
              <Pill value={i.status} />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
