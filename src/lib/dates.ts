/** Format a date/timestamp from either DB driver as YYYY-MM-DD in local time (safe for <input type=date>). Client-safe. */
export function toDateInput(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  return String(v).slice(0, 10);
}

/** Today's date in India (YYYY-MM-DD), whatever the server's time zone. */
export const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** Due-date shortcuts used by the quick task bar. "This week" is the coming Saturday (the office works Monday to Saturday). */
export function dueFromChip(chip: string, picked?: string | null): string | null {
  const today = todayIST();
  if (chip === "today") return today;
  if (chip === "tomorrow") return addDays(today, 1);
  if (chip === "week") { const day = new Date(`${today}T00:00:00Z`).getUTCDay(); return day === 0 ? today : addDays(today, 6 - day); }
  if (chip === "date" && picked && /^\d{4}-\d{2}-\d{2}$/.test(picked)) return picked;
  return null;
}
