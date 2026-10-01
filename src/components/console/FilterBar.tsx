"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { fieldCls } from "./Form";

export interface FilterDef { key: string; label: string; options: { value: string; label: string }[] }

/** Search box, select filters and an optional date range. All state lives in the URL, so pages stay server-rendered. */
export default function FilterBar({ filters = [], search = true, searchPlaceholder = "Search name or phone", dates = false, extra }: { filters?: FilterDef[]; search?: boolean; searchPlaceholder?: string; dates?: boolean; extra?: React.ReactNode }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v); else next.delete(k);
    next.delete("page");
    router.push(`${pathname}?${next}`);
  };
  const active = [...filters.map((f) => f.key), "q", "from", "to"].filter((k) => sp.get(k)).length;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {search && (
        <form onSubmit={(e) => { e.preventDefault(); set("q", (new FormData(e.currentTarget).get("q") as string) ?? ""); }} className="relative w-full sm:w-auto">
          <Icon name="search" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={sp.get("q") ?? ""} placeholder={searchPlaceholder} className={`${fieldCls} w-full pl-8 sm:w-64`} aria-label="Search" />
        </form>
      )}
      {filters.map((f) => (
        <select key={f.key} value={sp.get(f.key) ?? ""} onChange={(e) => set(f.key, e.target.value)} className={fieldCls} aria-label={f.label}>
          <option value="">{f.label}: all</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      {dates && (
        <>
          <input type="date" value={sp.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} className={fieldCls} aria-label="From date" />
          <span className="text-xs text-muted">to</span>
          <input type="date" value={sp.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} className={fieldCls} aria-label="To date" />
        </>
      )}
      {extra}
      {active > 0 && <button type="button" onClick={() => router.push(pathname)} className="text-xs text-muted hover:text-ink">Clear filters ({active})</button>}
    </div>
  );
}
