/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
};

module.exports = nextConfig;

