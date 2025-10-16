import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb"],
  webpack: (config) => {
    config.externals = [...(config.externals || []), "mongodb"];
    return config;
  },
};

export default nextConfig;
