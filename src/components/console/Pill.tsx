import { PILL_COLORS } from "@/lib/console";

export default function Pill({ value, className = "" }: { value: string; className?: string }) {
  const color = PILL_COLORS[value] ?? "var(--pill-grey)";
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-brand border px-2 py-0.5 text-xs ${className}`} style={{ borderColor: color, color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {value}
    </span>
  );
}
