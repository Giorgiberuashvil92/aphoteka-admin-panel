import type { NextConfig } from "next";

const NEST_PROXY_TARGET =
  process.env.NEST_API_DIRECT_URL?.trim() ||
  process.env.RAILWAY_NEST_API_URL?.trim() ||
  "https://aphoteka-admin-panel-production.up.railway.app/api";

const nextConfig: NextConfig = {
  /**
   * ბრაუზერი → `/api/nest/*` (იგივე Vercel origin, CORS არაა) → Railway Nest `/api/*`.
   * `getApiBaseUrl()` ბრაუზერზე აბრუნებს `origin/api/nest`.
   */
  async rewrites() {
    if (!process.env.VERCEL) {
      return [];
    }
    const base = NEST_PROXY_TARGET.replace(/\/$/, "");
    return [
      {
        source: "/api/nest/:path*",
        destination: `${base}/:path*`,
      },
    ];
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  output: 'standalone', // Optimize for Vercel
  images: {
    domains: [], // Add image domains if needed
  },
};

export default nextConfig;
