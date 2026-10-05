/** Levels, star thresholds and star colours. Shared by server pages and client components. */
export const LEVELS = ["intern", "employee", "executive"] as const;
export type Level = (typeof LEVELS)[number];
export const levelLabel = (role: string, level?: string | null) => (role === "admin" ? "Admin" : level === "intern" ? "Intern" : level === "executive" ? "Executive" : "Employee");

/** Approved sales needed for each star: star 1 at 1 sale, star 2 at 5 ... star 5 at 30. */
export const STAR_THRESHOLDS = [1, 5, 10, 20, 30] as const;
export const MAX_STARS = STAR_THRESHOLDS.length;
/** Each star has its own colour, in the order it is earned. */
export const STAR_TIERS = [
  { name: "Bronze", color: "#B0702E" },
  { name: "Silver", color: "#8A94A6" },
  { name: "Gold", color: "#D4A017" },
  { name: "Sapphire", color: "#2563EB" },
  { name: "Ruby", color: "#C2185B" },
] as const;

/** Stars the sales count has reached (what the admin may award up to). */
export const starsDue = (sales: number) => STAR_THRESHOLDS.filter((t) => sales >= t).length;
/** Sales needed for the next star, or null at five stars. */
export const nextThreshold = (stars: number): number | null => STAR_THRESHOLDS[stars] ?? null;
export const canPromote = (role: string, level: string | null | undefined, stars: number) => role !== "admin" && level !== "executive" && stars >= MAX_STARS;
