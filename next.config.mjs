/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "production" ? ".next-prod-clean" : ".next",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    // In Windows environments, filesystem cache may fail with ENOENT rename warnings.
    // Use in-memory cache during development to avoid disk rename conflicts.
    if (dev) {
      config.cache = { type: "memory" }
    }
    return config
  },
}

export default nextConfig
