import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const rootDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
  async headers() {
    return [
      {
        source: "/play/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "fullscreen=(self \"https://vidsrc-embed.ru\" \"https://www.2embed.cc\" \"https://www.2embed.skin\"), picture-in-picture=*" },
        ],
      },
      {
        source: "/download/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
  env: {
    NEXT_PUBLIC_TMDB_API_KEY: process.env.NEXT_PUBLIC_TMDB_API_KEY ?? process.env.VITE_TMDB_API_KEY,
    NEXT_PUBLIC_DOWNLOAD_BASE_URL: process.env.NEXT_PUBLIC_DOWNLOAD_BASE_URL ?? process.env.VITE_DOWNLOAD_BASE_URL,
  },
};

export default nextConfig;
