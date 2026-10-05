import { MAX_STARS, STAR_TIERS } from "@/lib/growth";

const PATH = "m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z";

/** Five star slots: earned stars filled in their own tier colour, the rest as faint outlines. */
export default function Stars({ count, size = 16, showEmpty = true, className = "" }: { count: number; size?: number; showEmpty?: boolean; className?: string }) {
  const n = Math.max(0, Math.min(MAX_STARS, count));
  const label = n === 0 ? "No stars yet" : `${n} ${n === 1 ? "star" : "stars"}: ${STAR_TIERS.slice(0, n).map((t) => t.name).join(", ")}`;
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={label} title={label}>
      {STAR_TIERS.map((t, i) => {
        if (i >= n && !showEmpty) return null;
        const earned = i < n;
        return (
          <svg key={t.name} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <path d={PATH} fill={earned ? t.color : "none"} stroke={earned ? t.color : "var(--line)"} strokeWidth={1.6} strokeLinejoin="round" />
          </svg>
        );
      })}
    </span>
  );
}

/** One filled star in a tier's colour (star number 1 to 5). */
export function TierStar({ star, size = 14 }: { star: number; size?: number }) {
  const t = STAR_TIERS[star - 1];
  if (!t) return null;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d={PATH} fill={t.color} /></svg>;
}

/** Legend of the five tiers with the sales each one needs. */
export function StarLegend({ thresholds }: { thresholds: readonly number[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {STAR_TIERS.map((t, i) => (
        <li key={t.name} className="inline-flex items-center gap-1">
          <svg width={12} height={12} viewBox="0 0 24 24" aria-hidden="true"><path d={PATH} fill={t.color} /></svg>
          {t.name} · {thresholds[i]} {thresholds[i] === 1 ? "sale" : "sales"}
        </li>
      ))}
    </ul>
  );
}
