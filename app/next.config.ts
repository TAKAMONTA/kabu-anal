import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel互換性のための設定
  output: "standalone",

  // API Routes の設定
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },

  // 外部画像ドメインの許可（必要に応じて）
  images: {
    domains: [],
  },

  // 型チェックとリント設定
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
