// Plain JavaScript (not next.config.ts) so the config loads without compiling TypeScript: on hosts whose Linux is too old
// for Next's native compiler (Hostinger: GLIBC < 2.29), the WebAssembly fallback cannot load a .ts config.

/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, { protocol: "https", hostname: "i.ytimg.com" }],
  },
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Forms with an upload (sale documents, images, brochures) post through server actions, which Next caps at 1 MB.
  // Match the 16 MB file limit in src/lib/upload.ts, plus room for the multipart overhead.
  experimental: { serverActions: { bodySizeLimit: "17mb" } },
};

export default nextConfig;
