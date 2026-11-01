import { NextResponse } from "next/server";
import { beginSignIn, googleConfigured } from "@/lib/google-auth";

export const dynamic = "force-dynamic";
const GOOGLE_COOKIE = "mn_google";

/** Starts "Sign in with Google": remembers the one-time state in a short cookie and sends the person to Google. */
export async function GET(req: Request) {
  if (!googleConfigured()) return NextResponse.redirect(new URL("/login?error=google_off", req.url));
  const { url, state, verifier } = beginSignIn(req.url);
  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_COOKIE, `${state}.${verifier}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth/google", maxAge: 600 });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
