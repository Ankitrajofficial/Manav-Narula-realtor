"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { markNotificationsRead } from "@/lib/queries/common";

const listPath = (role: string) => (role === "admin" ? "/admin/notifications" : "/employee/notifications");

export async function markAllReadAction() {
  const user = await requireUser();
  await markNotificationsRead(user.id);
  revalidatePath(listPath(user.role));
}

/** Sends the signed-in person a test notification: the bell, the pop-up and (when allowed on a device) a push. */
export async function sendTestNotificationAction() {
  const user = await requireUser();
  await notify([user.id], { kind: "test", title: "Test notification", body: "Notifications are working on this account.", path: "notifications" });
  revalidatePath(listPath(user.role));
}
