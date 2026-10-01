/** Home page trust numbers (settings key "trust_stats"). Client-safe. */
export interface TrustStat { value: string; suffix: "+" | "★" | ""; label: string; link: string | null; sort_order: number; is_active: boolean }
export const TRUST_SUFFIXES = ["+", "★", ""] as const;
export const MIN_ACTIVE_STATS = 3;
export const MAX_ACTIVE_STATS = 6;

/**
 * Where each stat sits so the grid never has an empty cell.
 * Tablet/desktop use a 6-unit grid: 3 → 3, 4 → 2+2, 5 → 3+2, 6 → 3+3. Phones use 2 columns, a lone last stat spans both.
 * Returned spans are in grid units; left/top say whether the cell draws a hairline on that side.
 */
export function trustLayout(n: number) {
  const desktopRows = n === 4 ? [2, 2] : n === 5 ? [3, 2] : n === 6 ? [3, 3] : [n];
  const place = (rows: number[], units: number) => {
    const out: { span: number; left: boolean; top: boolean }[] = [];
    rows.forEach((len, r) => { for (let c = 0; c < len; c++) out.push({ span: units / len, left: c > 0, top: r > 0 }); });
    return out;
  };
  const mobileRows = Array.from({ length: Math.ceil(n / 2) }, (_, r) => Math.min(2, n - r * 2));
  const d = place(desktopRows, 6), m = place(mobileRows, 2);
  return Array.from({ length: n }, (_, i) => ({ desktop: d[i], mobile: m[i] }));
}
