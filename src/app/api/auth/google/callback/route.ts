import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { finishSignIn, googleConfigured } from "@/lib/google-auth";
import { audit } from "@/lib/records";

export const dynamic = "force-dynamic";
const GOOGLE_COOKIE = "mn_google";

/**
 * Google sends the person back here. The email Google confirms must belong to an active account on the Employees page;
 * then a normal console session starts (no PIN involved). Anything else goes back to /login with a short reason.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const back = (error: string, email?: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${error}${email ? `&email=${encodeURIComponent(email)}` : ""}`, req.url));
    res.cookies.set(GOOGLE_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  };
  if (!googleConfigured()) return back("google_off");
  if (u.searchParams.get("error")) return back("google_cancelled");
  const code = u.searchParams.get("code") ?? "";
  const state = u.searchParams.get("state") ?? "";
  const cookie = req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${GOOGLE_COOKIE}=([^;]+)`))?.[1] ?? "";
  const [savedState, verifier] = decodeURIComponent(cookie).split(".");
  if (!code || !state || !savedState || !verifier || state !== savedState) return back("google_state");

  let profile;
  try {
    profile = await finishSignIn(code, verifier, req.url);
  } catch (e) {
    console.error("[google-signin]", e instanceof Error ? e.message : e);
    await audit(null, "login_failed", "user", null, { method: "google", reason: e instanceof Error ? e.message.slice(0, 200) : "unknown" });
    return back("google_failed");
  }
  if (!profile.email_verified) return back("google_unverified", profile.email);
  const user = await one<{ id: number; role: string; status: string }>("SELECT id, role, status FROM users WHERE lower(email) = $1", [profile.email]);
  if (!user) {
    await audit(null, "login_failed", "user", null, { method: "google", email: profile.email, reason: "not on the staff list" });
    return back("not_staff", profile.email);
  }
  if (user.status !== "active") return back("blocked", profile.email);

  await q("UPDATE users SET last_login_at = now(), failed_logins = 0, locked_until = NULL WHERE id = $1", [user.id]);
  await audit(user.id, "login", "user", user.id, { method: "google" });
  const res = NextResponse.redirect(new URL(user.role === "admin" ? "/admin" : "/employee", req.url));
  const c = sessionCookie(user.id, "google");
  res.cookies.set(c.name, c.value, c.options);
  res.cookies.set(GOOGLE_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
