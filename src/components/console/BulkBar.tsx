"use client";
import { useEffect, useRef, useState } from "react";

const rowBoxes = (form: HTMLFormElement) => Array.from(form.querySelectorAll<HTMLInputElement>('input[name="ids"]'));
const link = "text-accent-ink underline-offset-2 hover:underline";

/**
 * Place inside the <form> that wraps a selectable DataTable. Shows how many rows are ticked and the bulk actions.
 * With `total` and `filter`, it also offers "select all N matching": the form then posts all_matching=1 and the
 * current filters, and the server works out the rows itself, including those on other pages.
 */
export default function BulkBar({ children, total, filter }: { children: React.ReactNode; total?: number; filter?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [onPage, setOnPage] = useState(0);
  const [allMatching, setAllMatching] = useState(false);
  const form = () => ref.current?.closest("form") ?? null;

  useEffect(() => {
    const f = ref.current?.closest("form");
    if (!f) return;
    const update = () => {
      const boxes = rowBoxes(f);
      const on = boxes.filter((c) => c.checked).length;
      setCount(on);
      setOnPage(boxes.length);
      // Unticking any row narrows the selection back to what is ticked.
      if (on < boxes.length) setAllMatching(false);
    };
    f.addEventListener("change", update);
    update();
    return () => f.removeEventListener("change", update);
  }, []);

  const setPage = (on: boolean) => {
    const f = form();
    if (!f) return;
    rowBoxes(f).forEach((c) => { c.checked = on; });
    f.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const selectMatching = () => { setPage(true); setAllMatching(true); };
  const clear = () => { setAllMatching(false); setPage(false); };

  const canMatch = total != null && filter != null && total > onPage;
  const shown = allMatching && total != null ? total : count;
  return (
    <div ref={ref} className={`mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-brand border px-3 py-2 text-sm ${shown ? "border-accent bg-white" : "border-line bg-white text-muted"}`}>
      {allMatching && <><input type="hidden" name="all_matching" value="1" /><input type="hidden" name="filter" value={filter ?? ""} /></>}
      <span className="tabular">{allMatching ? `All ${shown.toLocaleString("en-IN")} matching selected` : `${shown} selected`}</span>
      {onPage > 0 && (
        <span className="flex flex-wrap items-center gap-x-3 text-xs">
          {!allMatching && count < onPage && <button type="button" onClick={() => setPage(true)} className={link}>{total != null && total <= onPage ? `Select all ${onPage}` : `Select page (${onPage})`}</button>}
          {!allMatching && canMatch && <button type="button" onClick={selectMatching} className={link}>Select all {total!.toLocaleString("en-IN")} matching filters</button>}
          {(count > 0 || allMatching) && <button type="button" onClick={clear} className="text-muted hover:text-ink hover:underline">Clear</button>}
        </span>
      )}
      <span className={shown ? "flex flex-wrap items-center gap-2" : "pointer-events-none flex flex-wrap items-center gap-2 opacity-50"}>{children}</span>
    </div>
  );
}
