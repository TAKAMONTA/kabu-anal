import pino from "pino";

// 環境に応じたログレベルの設定
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

/**
 * ログレベル優先度:
 * 1. 環境変数 LOG_LEVEL (明示的指定)
 * 2. 本番環境: "warn" (エラーと警告のみ)
 * 3. 開発環境: "debug" (全ログ出力)
 */
const getLogLevel = (): string => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  if (isProduction) {
    return "warn"; // 本番環境ではwarn以上のみ
  }
  return "debug"; // 開発環境は全て出力
};

export const logger = pino({
  level: getLogLevel(),

  // 開発環境: 人間が読みやすい形式 (pino-pretty)
  // 本番環境: JSON形式 (ログ集約システム向け)
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,

  formatters: {
    level: (label) => {
      return { level: label };
    },
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  // 本番環境用の追加設定
  ...(isProduction && {
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'apiKey',
        'password',
        'secret',
        'token',
      ],
      remove: true, // 本番環境では機密情報を完全削除
    },
  }),
});

// APIログ用のヘルパー関数
export const logApiRequest = (
  method: string,
  path: string,
  metadata?: Record<string, unknown>
) => {
  logger.info({ method, path, ...metadata }, "API Request");
};

export const logApiResponse = (
  method: string,
  path: string,
  statusCode: number,
  duration: number
) => {
  logger.info({ method, path, statusCode, duration }, "API Response");
};

export const logApiError = (
  method: string,
  path: string,
  error: Error | unknown,
  metadata?: Record<string, unknown>
) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(
    {
      method,
      path,
      error: errorMessage,
      stack: errorStack,
      ...metadata,
    },
    "API Error"
  );
};

// AI API呼び出しログ
export const logAIRequest = (
  provider: "OpenAI" | "Claude" | "Gemini" | "Perplexity",
  operation: string,
  metadata?: Record<string, unknown>
) => {
  logger.info({ provider, operation, ...metadata }, "AI API Request");
};

export const logAIResponse = (
  provider: "OpenAI" | "Claude" | "Gemini" | "Perplexity",
  operation: string,
  success: boolean,
  duration?: number
) => {
  logger.info(
    { provider, operation, success, duration },
    "AI API Response"
  );
};

// データ収集ログ
export const logDataCollection = (
  stockCode: string,
  phase: string,
  status: "start" | "success" | "error",
  metadata?: Record<string, unknown>
) => {
  logger.info(
    { stockCode, phase, status, ...metadata },
    "Data Collection"
  );
};
