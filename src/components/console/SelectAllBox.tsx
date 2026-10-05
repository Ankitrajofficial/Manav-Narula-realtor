"use client";
import { useEffect, useRef } from "react";

/** Header checkbox for a selectable DataTable: ticks or clears every row checkbox on the page, and shows a partial state. */
export default function SelectAllBox() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const box = ref.current;
    const form = box?.closest("form");
    if (!box || !form) return;
    const sync = () => {
      const all = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="ids"]'));
      const on = all.filter((c) => c.checked).length;
      box.checked = all.length > 0 && on === all.length;
      box.indeterminate = on > 0 && on < all.length;
    };
    form.addEventListener("change", sync);
    sync();
    return () => form.removeEventListener("change", sync);
  }, []);
  const toggle = () => {
    const box = ref.current;
    const form = box?.closest("form");
    if (!box || !form) return;
    form.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((c) => { c.checked = box.checked; });
    form.dispatchEvent(new Event("change", { bubbles: true }));
  };
  return <input ref={ref} type="checkbox" onChange={toggle} className="accent-[#00BF63]" aria-label="Select all rows on this page" />;
}
