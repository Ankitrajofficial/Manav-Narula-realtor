"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import Icon from "@/components/Icon";
import Pill from "@/components/console/Pill";
import ToggleForm from "@/components/console/ToggleForm";
import ConfirmButton from "@/components/console/ConfirmButton";

export interface BannerCard { id: number; image: string | null; headline: string; line: string | null; cta_label: string | null; cta_href: string | null; active: boolean; start: string; end: string; scheduleState: "Live" | "Scheduled" | "Expired" | "Inactive" }

export default function BannerCards({ group, items, onToggle, onMove, onReorder, onDelete }: {
  group: string; items: BannerCard[];
  onToggle: (id: number, value: boolean) => Promise<void>; onMove: (id: number, dir: -1 | 1) => Promise<void>; onReorder: (group: string, ids: number[]) => Promise<void>; onDelete: (id: number) => Promise<void>;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const drop = (targetIdx: number) => {
    if (drag === null) return;
    const from = items.findIndex((b) => b.id === drag);
    if (from < 0 || from === targetIdx) { setDrag(null); return; }
    const ids = items.map((b) => b.id); const [m] = ids.splice(from, 1); ids.splice(targetIdx, 0, m);
    setDrag(null);
    start(() => onReorder(group, ids));
  };
  if (items.length === 0) return <p className="rounded-brand border border-dashed border-line bg-white p-6 text-center text-sm text-muted">No banners in this group yet.</p>;
  return (
    <ul className={`space-y-2 ${pending ? "opacity-60" : ""}`}>
      {items.map((b, i) => (
        <li key={b.id} draggable onDragStart={() => setDrag(b.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(i)} className={`flex items-center gap-4 rounded-brand border bg-white p-3 ${drag === b.id ? "border-accent opacity-50" : "border-line"}`}>
          <span className="cursor-grab text-muted" title="Drag to reorder" aria-hidden="true"><Icon name="list" size={16} /></span>
          <span className="text-xs tabular text-muted">{i + 1}</span>
          {b.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.image} alt="" className="h-14 w-24 shrink-0 rounded-brand border border-line object-cover" />
          ) : <span className="h-14 w-24 shrink-0 rounded-brand border border-line bg-bg" />}
          <div className="min-w-0 flex-1">
            <Link href={`/admin/banners/${b.id}`} className="block truncate font-medium hover:text-accent-ink">{b.headline}</Link>
            <p className="truncate text-xs text-muted">{b.line}</p>
            <p className="mt-1 truncate text-xs text-muted">{b.cta_label ? `${b.cta_label} → ${b.cta_href ?? ""}` : "No button"}{b.start || b.end ? ` · ${b.start || "any time"} to ${b.end || "no end"}` : " · no schedule"}</p>
          </div>
          <Pill value={b.scheduleState === "Live" ? "Published" : b.scheduleState === "Scheduled" ? "Upcoming" : b.scheduleState === "Expired" ? "Closed lost" : "Draft"} />
          <span className="text-xs text-muted">{b.scheduleState}</span>
          <ToggleForm on={b.active} label={b.active ? "Deactivate" : "Activate"} action={onToggle.bind(null, b.id, !b.active)} />
          <form className="flex gap-1">
            <button formAction={onMove.bind(null, b.id, -1)} aria-label="Move up" className="rounded-brand border border-line p-1.5 hover:border-ink" disabled={i === 0}><Icon name="up" size={12} /></button>
            <button formAction={onMove.bind(null, b.id, 1)} aria-label="Move down" className="rounded-brand border border-line p-1.5 hover:border-ink" disabled={i === items.length - 1}><Icon name="down" size={12} /></button>
          </form>
          <Link href={`/admin/banners/${b.id}`} className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Edit</Link>
          <form><ConfirmButton label="Delete" confirmLabel="Delete" action={onDelete.bind(null, b.id)} /></form>
        </li>
      ))}
    </ul>
  );
}
