import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configures Turbopack for local development
  turbopack: {
    resolveAlias: {
      '@x402/core/client': '',
      '@x402/svm/exact/client': '',
    },
  },
  // Keeps Webpack resolution for production builds
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/core/client': false,
      '@x402/svm/exact/client': false,
    };
    return config;
  },
};

export default nextConfig;