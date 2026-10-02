import type { NextConfig } from "next";
import withPWAInit, { type PluginOptions } from "@ducanh2912/next-pwa";

type WorkboxUrlMatch = {
  sameOrigin: boolean;
  url: URL;
};

export function isProtectedPwaRequest({ sameOrigin, url }: WorkboxUrlMatch) {
  return sameOrigin && /^\/(?:workspace(?:\/|$)|login(?:\/|$)|auth(?:\/|$)|api\/generate(?:\/|$))/.test(url.pathname);
}

export const pwaOptions = {
  dest: "public",
  // The plugin's blanket navigation helper writes directly to the pages cache
  // and cannot exclude authenticated routes. Workbox runtime caching remains on.
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Disables PWA in dev mode
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: isProtectedPwaRequest,
        handler: "NetworkOnly",
        method: "GET",
      },
    ],
  },
} satisfies PluginOptions;

const withPWA = withPWAInit(pwaOptions);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {}, // Tells Next.js 16 to safely use Turbopack for local dev
};

export default withPWA(nextConfig);
