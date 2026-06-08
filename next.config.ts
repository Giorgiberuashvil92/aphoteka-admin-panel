import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /**
   * Nest პროქსი — `src/app/api/nest/[...path]/route.ts` (არა rewrite; rewrite ხშირად არასწორ პორტზე მიდიოდა).
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

    return balanceItemSeriesLegacy;
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  turbopack: {
    root: projectRoot,
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
