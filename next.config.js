// 環境変数検証（ビルド時）
// Vercel環境では環境変数が動的に注入されるため、ローカル開発時のみ検証
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  try {
    require("./scripts/validateEnv").checkEnvInBuild();
  } catch (error) {
    console.warn("Environment validation skipped:", error.message);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
