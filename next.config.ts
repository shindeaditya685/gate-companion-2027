import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Netlify sets NETLIFY=true, Render doesn't — fall back to DEPLOY for Render
  ...(!process.env.NETLIFY && process.env.DEPLOY !== 'true' && {
    distDir: '.next-local',
    output: 'standalone',
  }),
};

export default nextConfig;
