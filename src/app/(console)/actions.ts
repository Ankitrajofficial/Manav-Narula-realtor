"use server";
import { redirect } from "@/lib/nav";
import { logout } from "@/lib/auth";

export async function logoutAction() {
  await logout();
  redirect("/login");
}
