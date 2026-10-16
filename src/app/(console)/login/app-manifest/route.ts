import { NextResponse } from "next/server";

/**
 * Web app manifest for the staff console, so it can be added to a phone's home screen (on iPhone that is required for
 * push notifications). It lives under /login so the private-address gate in src/proxy.ts hides it like the console, and it
 * starts at the private address, which lets the home-screen app (it has its own cookies) through the gate.
 */
export function GET() {
  const slug = process.env.CONSOLE_PATH?.trim().replace(/^\/+|\/+$/g, "");
  return NextResponse.json(
    {
      id: "/mn-console",
      name: "Manav Narula Realtor console",
      short_name: "MN Console",
      start_url: slug ? `/${slug}` : "/login",
      scope: "/",
      display: "standalone",
      background_color: "#fafaf8",
      theme_color: "#091732",
      icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "private, no-store" } },
  );
}
