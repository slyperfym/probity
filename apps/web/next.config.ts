import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@probity/ui", "@probity/config", "@probity/types"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false
    };

    return config;
  }
};

export default nextConfig;
