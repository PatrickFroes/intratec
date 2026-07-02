/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    APP_AWS_ACCESS_KEY_ID: process.env.APP_AWS_ACCESS_KEY_ID,
    APP_AWS_SECRET_ACCESS_KEY: process.env.APP_AWS_SECRET_ACCESS_KEY,
    APP_AWS_REGION: process.env.APP_AWS_REGION,
    APP_AWS_S3_BUCKET: process.env.APP_AWS_S3_BUCKET,
  },
  reactStrictMode: true,
  // output: 'standalone', // Optimized for Docker/App Runner
  // distDir: 'out',   // Removed to use default .next build folder
  trailingSlash: false, // Changed to false for better dynamic routing compatibility
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
