const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
  // Allow imports from parent directories (monorepo setup)
  webpack: (config, { isServer }) => {
    // Add the root src directory to module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@flowguard/core': path.resolve(__dirname, '../../src'),
    };
    return config;
  },
  // Allow importing from outside the app directory
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;

