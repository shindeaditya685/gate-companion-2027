import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-local",
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
