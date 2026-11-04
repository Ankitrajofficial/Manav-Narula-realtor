import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { site } from "@/data/site";

/**
 * "Sign in with Google" for the staff console (OpenID Connect, authorization code + PKCE, no library).
 * The admin adds a person's email on the Employees page; that person then signs in with the Google account that owns
 * the email. Nothing is emailed and no PIN is needed. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from a Google Cloud
 * OAuth client whose authorised redirect URI is https://<site>/api/auth/google/callback.
 */
export const googleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token";
const USERINFO_URL = process.env.GOOGLE_USERINFO_URL || "https://openidconnect.googleapis.com/v1/userinfo";

/**
 * An address on the public site, or on the local origin in development. Behind the host's proxy `req.url` carries the
 * server's internal address (https://0.0.0.0:3000), so it must not be used for anything sent back to a browser or Google.
 */
export function publicUrl(path: string, requestUrl: string): URL {
  const origin = new URL(requestUrl).origin;
  const base = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : (process.env.PUBLIC_URL || site.url).replace(/\/$/, "");
  return new URL(path, base);
}

/** The callback address registered with Google. */
export const redirectUri = (requestUrl: string): string => publicUrl("/api/auth/google/callback", requestUrl).toString();

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** One-time values for a sign-in attempt; `state` and `verifier` are kept in a short-lived cookie until the callback. */
export function beginSignIn(requestUrl: string): { url: string; state: string; verifier: string } {
  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const u = new URL(AUTH_URL);
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  u.searchParams.set("redirect_uri", redirectUri(requestUrl));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  u.searchParams.set("code_challenge", b64url(createHash("sha256").update(verifier).digest()));
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("prompt", "select_account");
  return { url: u.toString(), state, verifier };
}

export interface GoogleProfile { sub: string; email: string; email_verified: boolean; name?: string; picture?: string }

/** Swaps the code for tokens and asks Google who signed in. Throws with a short reason on any failure. */
export async function finishSignIn(code: string, verifier: string, requestUrl: string): Promise<GoogleProfile> {
  const body = new URLSearchParams({
    code, code_verifier: verifier, grant_type: "authorization_code", redirect_uri: redirectUri(requestUrl),
    client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  });
  const tok = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(15000), cache: "no-store" });
  const t = (await tok.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!tok.ok || !t.access_token) throw new Error(`Google token exchange failed: ${t.error_description || t.error || tok.status}`);
  const info = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${t.access_token}` }, signal: AbortSignal.timeout(15000), cache: "no-store" });
  const p = (await info.json().catch(() => ({}))) as Partial<GoogleProfile>;
  if (!info.ok || !p.email || !p.sub) throw new Error(`Google did not return the account's email (${info.status})`);
  return { sub: p.sub, email: String(p.email).trim().toLowerCase(), email_verified: p.email_verified === true || (p.email_verified as unknown) === "true", name: p.name, picture: p.picture };
}
