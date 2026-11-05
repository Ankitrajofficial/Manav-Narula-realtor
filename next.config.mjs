// Plain JavaScript (not next.config.ts) so the config loads without compiling TypeScript: on hosts whose Linux is too old
// for Next's native compiler (Hostinger: GLIBC < 2.29), the WebAssembly fallback cannot load a .ts config.

/** @type {import("next").NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, { protocol: "https", hostname: "i.ytimg.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'" },
      { key: "Strict-Transport-Security", value: "max-age=15552000" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Forms with an upload (sale documents, images, brochures) post through server actions, which Next caps at 1 MB.
  // Match the 16 MB file limit in src/lib/upload.ts, plus room for the multipart overhead.
  experimental: { serverActions: { bodySizeLimit: "17mb" } },
};

export default nextConfig;
