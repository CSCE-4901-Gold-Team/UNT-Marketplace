import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    unoptimized: true, // Allow base64 and any local images
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
