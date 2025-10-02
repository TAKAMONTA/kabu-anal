/**
 * 環境変数検証スクリプト（CommonJS）
 * Next.jsビルド前に実行
 */

// 必須環境変数リスト
const REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "CLAUDE_API_KEY",
  "GEMINI_API_KEY",
  "PERPLEXITY_API_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

function checkEnvInBuild() {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    console.log("⏭️  環境変数検証をスキップしました");
    return;
  }

  const missing = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key] || process.env[key].trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("❌ 必須環境変数が設定されていません:\n");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error("\n📝 .env.local ファイルを作成し、.env.example を参照してください\n");
    process.exit(1);
  }

  console.log("✅ 環境変数の検証が完了しました");
}

module.exports = { checkEnvInBuild };
