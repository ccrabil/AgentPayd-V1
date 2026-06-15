/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Don't let lint findings block production builds on Vercel.
  // Run `npm run lint` locally / in CI to catch issues during development.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
