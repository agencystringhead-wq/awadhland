import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // app/global-not-found.tsx: one 404 for both root layouts, carrying the analytics tags.
  experimental: { globalNotFound: true },
};

export default nextConfig;
