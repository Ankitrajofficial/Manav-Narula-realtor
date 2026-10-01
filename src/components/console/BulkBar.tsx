"use client";
import { useEffect, useRef, useState } from "react";

/** Place inside the <form> that wraps a selectable DataTable. Shows how many rows are ticked and the bulk actions. */
export default function BulkBar({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const update = () => setCount(form.querySelectorAll('input[name="ids"]:checked').length);
    form.addEventListener("change", update);
    return () => form.removeEventListener("change", update);
  }, []);
  return (
    <div ref={ref} className={`mb-3 flex flex-wrap items-center gap-2 rounded-brand border px-3 py-2 text-sm ${count ? "border-accent bg-white" : "border-line bg-white text-muted"}`}>
      <span className="tabular">{count} selected</span>
      <span className={count ? "flex flex-wrap items-center gap-2" : "pointer-events-none flex flex-wrap items-center gap-2 opacity-50"}>{children}</span>
    </div>
  );
}
