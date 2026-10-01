import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, { protocol: "https", hostname: "i.ytimg.com" }],
  },
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default nextConfig;
