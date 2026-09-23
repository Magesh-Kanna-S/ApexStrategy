import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No `output: "standalone"` — Vercel handles this automatically.
  // For GitHub Pages, you would use `output: "export"` instead, but
  // this app uses client-side features that require a server runtime,
  // so Vercel is the recommended deployment target.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
