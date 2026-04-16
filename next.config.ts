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
    /** ძველი path-ები → canonical `/api/balance/ItemSeries`. */
    const balanceItemSeriesLegacy = [
      {
        source: "/api/balance/items-series-manual-url",
        destination: "/api/balance/item-series-manual-url",
      },
      {
        source: "/api/balance/items-series/probe",
        destination: "/api/balance/ItemSeries/probe",
      },
      {
        source: "/api/balance/items-series",
        destination: "/api/balance/ItemSeries",
      },
      {
        source: "/api/balance/item-series/probe",
        destination: "/api/balance/ItemSeries/probe",
      },
      {
        source: "/api/balance/item-series",
        destination: "/api/balance/ItemSeries",
      },
    ];

    if (!process.env.VERCEL) {
      return balanceItemSeriesLegacy;
    }
    const base = NEST_PROXY_TARGET.replace(/\/$/, "");
    return [
      {
        source: "/api/nest/:path*",
        destination: `${base}/:path*`,
      },
      ...balanceItemSeriesLegacy,
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
