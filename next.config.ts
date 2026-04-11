import path from "path";
import type { NextConfig } from "next";

const baseSecurityHeaders: { key: string; value: string }[] = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const headersOut = [...baseSecurityHeaders];
    if (
      process.env.VERCEL_ENV === "production" ||
      (process.env.NODE_ENV === "production" && !process.env.VERCEL)
    ) {
      headersOut.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }
    return [{ source: "/:path*", headers: headersOut }];
  },
  images: {
    localPatterns: [
      {
        pathname: "/**",
      },
      {
        pathname: "/api/files",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
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
