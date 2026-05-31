import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // standalone مطلوب لـ Docker فقط؛ على Vercel نترك الإخراج الافتراضي
  output: process.env.VERCEL ? undefined : "standalone",
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
