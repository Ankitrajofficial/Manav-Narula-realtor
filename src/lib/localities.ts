/** Zones used to group localities in the admin, the property form and the website filters, in display order. */
export const ZONES = ["Central", "West", "North", "South", "East", "Outskirts"] as const;
export type Zone = (typeof ZONES)[number];
export interface LocalityOption { name: string; zone: string; count?: number }

/** SQL ORDER BY fragment that sorts a localities table aliased `l` by zone order, then admin order, then name. */
export const LOCALITY_ORDER = `array_position(ARRAY[${ZONES.map((z) => `'${z}'`).join(",")}]::text[], l.zone), l.sort_order, l.name`;

export function groupByZone<T extends { zone: string }>(items: T[]): { zone: string; items: T[] }[] {
  const zones = [...ZONES, ...Array.from(new Set(items.map((i) => i.zone))).filter((z) => !(ZONES as readonly string[]).includes(z))];
  return zones.map((zone) => ({ zone, items: items.filter((i) => i.zone === zone) })).filter((g) => g.items.length);
}
