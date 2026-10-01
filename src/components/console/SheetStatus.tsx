"use client";
import { LEAD_STATUSES, PILL_COLORS } from "@/lib/console";

/** Status dropdown for one call-sheet row; submits its form as soon as a new status is picked. */
export default function SheetStatus({ value }: { value: string }) {
  const color = PILL_COLORS[value] ?? "var(--pill-grey)";
  return (
    <select
      name="status"
      defaultValue={value}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      aria-label="Change status"
      className="rounded-brand border bg-white py-1 pl-2 pr-6 text-xs focus:outline-none"
      style={{ borderColor: color, color }}
    >
      {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
