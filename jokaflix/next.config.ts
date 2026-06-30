import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const rootDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
  env: {
    NEXT_PUBLIC_TMDB_API_KEY: process.env.NEXT_PUBLIC_TMDB_API_KEY ?? process.env.VITE_TMDB_API_KEY,
    NEXT_PUBLIC_DOWNLOAD_BASE_URL: process.env.NEXT_PUBLIC_DOWNLOAD_BASE_URL ?? process.env.VITE_DOWNLOAD_BASE_URL,
  },
};

export default nextConfig;
