import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/**",
      },
      {
        pathname: "/api/files",
      },
    ],
  },
  webpack: (config) => {
    config.externals.push({ libsql: "libsql" });
    return config;
  },
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
