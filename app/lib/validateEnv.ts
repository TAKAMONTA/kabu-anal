/**
 * 環境変数検証ユーティリティ
 * アプリ起動時に必須の環境変数をチェック
 */

interface ValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

// 必須環境変数（APIキー）
const REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "CLAUDE_API_KEY",
  "GEMINI_API_KEY",
  "PERPLEXITY_API_KEY",
] as const;

// Firebase関連の必須環境変数（Client）
const REQUIRED_FIREBASE_CLIENT = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

// Firebase Admin SDK（Server-side）
const REQUIRED_FIREBASE_ADMIN = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

// オプション環境変数（警告のみ）
const OPTIONAL_ENV_VARS = [
  "NEXT_PUBLIC_APP_URL",
  "NODE_ENV",
  "LOG_LEVEL",
] as const;

/**
 * 環境変数を検証
 */
export function validateEnvironment(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // 必須AI APIキーの検証
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key] || process.env[key]?.trim() === "") {
      missing.push(key);
    }
  }

  // Firebase Client 環境変数の検証
  for (const key of REQUIRED_FIREBASE_CLIENT) {
    if (!process.env[key] || process.env[key]?.trim() === "") {
      missing.push(key);
    }
  }

  // Firebase Admin SDK 環境変数の検証
  for (const key of REQUIRED_FIREBASE_ADMIN) {
    if (!process.env[key] || process.env[key]?.trim() === "") {
      missing.push(key);
    }
  }

  // オプション環境変数の警告
  for (const key of OPTIONAL_ENV_VARS) {
    if (!process.env[key]) {
      warnings.push(`Optional: ${key} is not set (using default)`);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * 環境変数検証とエラーハンドリング
 * 起動時に呼び出すことを推奨
 */
export async function ensureValidEnvironment(): Promise<void> {
  const result = validateEnvironment();

  if (!result.isValid) {
    const errorMessage = [
      "❌ 必須環境変数が設定されていません:",
      "",
      ...result.missing.map(key => `  - ${key}`),
      "",
      "📝 .env.local ファイルを作成し、以下を参考に設定してください:",
      "   .env.example を参照",
      "",
    ].join("\n");

    throw new Error(errorMessage);
  }

  // 警告を出力（エラーではない）- 開発環境のみ
  if (result.warnings.length > 0 && process.env.NODE_ENV === "development") {
    if (typeof window === "undefined") {
      // サーバーサイドでのみloggerを使用
      try {
        const { logger } = await import("./logger");
        logger.warn({ warnings: result.warnings }, "オプション環境変数の警告");
      } catch {
        // logger読み込み失敗時はconsole.warnにフォールバック
        // eslint-disable-next-line no-console
        console.warn("⚠️  オプション環境変数の警告:", result.warnings);
      }
    }
  }
}

/**
 * 開発環境での環境変数チェック（Next.jsのビルド時）
 */
export async function checkEnvInBuild(): Promise<void> {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    if (typeof window === "undefined") {
      try {
        const { logger } = await import("./logger");
        logger.info("環境変数検証をスキップしました");
      } catch {
        // eslint-disable-next-line no-console
        console.log("⏭️  環境変数検証をスキップしました");
      }
    }
    return;
  }

  try {
    await ensureValidEnvironment();
    if (typeof window === "undefined") {
      try {
        const { logger } = await import("./logger");
        logger.info("環境変数の検証が完了しました");
      } catch {
        // eslint-disable-next-line no-console
        console.log("✅ 環境変数の検証が完了しました");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (typeof window === "undefined") {
        try {
          const { logger } = await import("./logger");
          logger.error({ error: error.message }, "環境変数検証エラー");
        } catch {
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      }
      process.exit(1);
    }
  }
}
