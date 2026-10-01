"use client";
import { useRouter } from "next/navigation";
import { fieldCls } from "./Form";

export default function ReportRange({ from, to, basePath }: { from: string; to: string; basePath: string }) {
  const router = useRouter();
  const go = (f: string, t: string) => router.push(`${basePath}?from=${f}&to=${t}`);
  const preset = (days: number) => { const t = new Date(); const f = new Date(); f.setDate(t.getDate() - days); go(f.toISOString().slice(0, 10), t.toISOString().slice(0, 10)); };
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <input type="date" value={from} max={to} onChange={(e) => go(e.target.value, to)} className={`${fieldCls} w-auto`} aria-label="From date" />
      <span className="text-xs text-muted">to</span>
      <input type="date" value={to} min={from} onChange={(e) => go(from, e.target.value)} className={`${fieldCls} w-auto`} aria-label="To date" />
      <span className="mx-1 h-5 border-l border-line" />
      {[{ d: 7, l: "7 days" }, { d: 30, l: "30 days" }, { d: 90, l: "90 days" }, { d: 365, l: "12 months" }].map((p) => (
        <button key={p.d} type="button" onClick={() => preset(p.d)} className="rounded-brand border border-line bg-white px-3 py-1.5 text-xs hover:border-ink">{p.l}</button>
      ))}
    </div>
  );
}
