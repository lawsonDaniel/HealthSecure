import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
   eslint: {
    ignoreDuringBuilds: true, // Also ignore ESLint errors if needed
  },
};

export default nextConfig;
