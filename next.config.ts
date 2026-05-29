import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // standalone مطلوب لـ Docker فقط؛ على Vercel نترك الإخراج الافتراضي
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
