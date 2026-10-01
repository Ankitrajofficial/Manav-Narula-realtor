"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { inputCls } from "./ui";

export default function SortSelect() {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Sort</span>
      <select value={sp.get("sort") ?? "featured"} onChange={(e) => { const n = new URLSearchParams(sp.toString()); n.set("sort", e.target.value); n.delete("page"); router.push(`/properties?${n}`, { scroll: false }); }} className={`${inputCls} w-auto py-1.5`}>
        <option value="featured">Featured</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="area-desc">Area: largest first</option>
      </select>
    </label>
  );
}
