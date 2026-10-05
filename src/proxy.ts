import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Hides the admin and employee console behind a private address.
 *
 * When CONSOLE_PATH is set (e.g. "mn-office-7x4k"), the console pages answer "Page not found" to anyone who has neither
 * a valid sign-in nor the staff mark. Visiting /<CONSOLE_PATH> sets the staff mark on that browser for a year and opens the
 * login page, so staff bookmark that address. Without CONSOLE_PATH (local development) the console is open as before.
 * The pages still check the sign-in themselves; this only keeps the console out of sight.
 */
const CONSOLE_PREFIXES = ["/admin", "/employee", "/login", "/change-password", "/forgot-password", "/certificate"];
const SESSION_COOKIE = "mn_session";
const GATE_COOKIE = "mn_console";

const secret = () => process.env.SESSION_SECRET || "dev-only-secret-change-me";
const hmac = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

function hasSession(req: NextRequest): boolean {
  const [id, exp, sig] = (req.cookies.get(SESSION_COOKIE)?.value ?? "").split(".");
  return !!id && !!exp && !!sig && Number(exp) > Date.now() && same(sig, hmac(`${id}.${exp}`));
}

const noStore = (res: NextResponse) => {
  res.headers.set("Cache-Control", "private, no-store");
  return res;
};

export function proxy(req: NextRequest) {
  const slug = process.env.CONSOLE_PATH?.trim().replace(/^\/+|\/+$/g, "");
  if (!slug) return NextResponse.next();
  const { pathname } = req.nextUrl;
  const gate = hmac(`console:${slug}`);

  if (pathname === `/${slug}`) {
    const res = NextResponse.redirect(new URL(hasSession(req) ? "/admin" : "/login", req.url));
    res.cookies.set(GATE_COOKIE, gate, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return noStore(res);
  }

  const isConsole = CONSOLE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isConsole) return NextResponse.next();
  if (same(req.cookies.get(GATE_COOKIE)?.value ?? "", gate) || hasSession(req)) return noStore(NextResponse.next());
  // Same "Page not found" as any unknown address.
  return noStore(NextResponse.rewrite(new URL("/_console-not-found", req.url), { status: 404 }));
}

export const config = {
  // Everything except Next's own files, API routes and files with an extension (images, robots.txt...).
  matcher: ["/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};
