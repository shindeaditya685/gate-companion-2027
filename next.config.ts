import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: process.env.NETLIFY ? undefined : 'standalone',
};

export default nextConfig;
