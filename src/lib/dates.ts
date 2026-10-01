/** Format a date/timestamp from either DB driver as YYYY-MM-DD in local time (safe for <input type=date>). Client-safe. */
export function toDateInput(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  return String(v).slice(0, 10);
}
