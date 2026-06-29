import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-local",
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  reactStrictMode: true,
};

export default nextConfig;
