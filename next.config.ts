import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.DEPLOY !== 'true' && {
    distDir: '.next-local',
    output: 'standalone',
  }),
};

export default nextConfig;
