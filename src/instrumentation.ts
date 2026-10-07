/** Runs once when a Next.js server starts: starts the daily 9:00 AM lead hand-out timer (Admin → Auto-assign). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { startDailyAutoAssign } = await import("@/lib/auto-assign");
  startDailyAutoAssign();
}
