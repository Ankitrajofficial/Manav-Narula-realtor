"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { flash } from "@/lib/flash";
import { one } from "@/lib/db";
import { audit } from "@/lib/records";
import { autoAssignConfig } from "@/lib/auto-assign";

/** The intern's or employee's own "Get leads automatically at 9:00 AM" switch (same flag as the admin's per-person switch). */
export async function setMyAutoAssign(on: boolean) {
  const user = await requireUser("employee");
  await one("UPDATE users SET auto_assign = $1 WHERE id = $2 RETURNING id", [on, user.id]);
  await audit(user.id, on ? "auto_assign_on" : "auto_assign_off", "user", user.id, { by: "self" });
  const cfg = await autoAssignConfig();
  const when = cfg.schedule === "daily_9am" ? "at 9:00 AM every day" : "as they arrive";
  await flash(on ? `You will get new leads automatically ${when}` : "Automatic leads paused. Your current batch stays with you");
  revalidatePath("/employee");
}
