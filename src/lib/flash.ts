import "server-only";
import { cookies } from "next/headers";

/**
 * One-off confirmation for server actions that stay on the page (switches, reorder arrows): the console shell reads
 * this cookie on the refresh that follows the action and the toast shows it. Actions that redirect use ?toast= instead.
 */
export const FLASH_COOKIE = "mn_flash";
export interface Flash { id: string; text: string; kind: "ok" | "error" }

export async function flash(text: string, kind: Flash["kind"] = "ok") {
  const value: Flash = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: text.slice(0, 200), kind };
  (await cookies()).set(FLASH_COOKIE, encodeURIComponent(JSON.stringify(value)), { path: "/", maxAge: 30, sameSite: "lax" });
}

export async function readFlash(): Promise<Flash | null> {
  const raw = (await cookies()).get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw)) as Flash; } catch { return null; }
}
