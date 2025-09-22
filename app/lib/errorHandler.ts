import { NextResponse } from "next/server";

// カスタムエラークラス
export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: any
  ) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// エラーコードの定義
export const ERROR_CODES = {
  // 認証・認可エラー
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // バリデーションエラー
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // レート制限エラー
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // 外部APIエラー
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
  OPENAI_API_ERROR: "OPENAI_API_ERROR",
  FIREBASE_ERROR: "FIREBASE_ERROR",

  // データベースエラー
  DATABASE_ERROR: "DATABASE_ERROR",
  DATA_NOT_FOUND: "DATA_NOT_FOUND",

  // 設定エラー
  CONFIG_ERROR: "CONFIG_ERROR",
  ENV_VAR_MISSING: "ENV_VAR_MISSING",

  // 一般的なエラー
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
} as const;

// エラーメッセージのマッピング
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: "認証が必要です",
  [ERROR_CODES.FORBIDDEN]: "アクセス権限がありません",
  [ERROR_CODES.TOKEN_EXPIRED]: "トークンの有効期限が切れています",
  [ERROR_CODES.VALIDATION_ERROR]: "入力値に問題があります",
  [ERROR_CODES.INVALID_INPUT]: "無効な入力です",
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: "必須フィールドが不足しています",
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    "リクエスト制限に達しました。しばらく時間をおいてから再試行してください",
  [ERROR_CODES.EXTERNAL_API_ERROR]: "外部APIでエラーが発生しました",
  [ERROR_CODES.OPENAI_API_ERROR]: "AI分析サービスでエラーが発生しました",
  [ERROR_CODES.FIREBASE_ERROR]: "データベースでエラーが発生しました",
  [ERROR_CODES.DATABASE_ERROR]: "データベースエラーが発生しました",
  [ERROR_CODES.DATA_NOT_FOUND]: "データが見つかりません",
  [ERROR_CODES.CONFIG_ERROR]: "サーバー設定に問題があります",
  [ERROR_CODES.ENV_VAR_MISSING]: "環境変数が設定されていません",
  [ERROR_CODES.INTERNAL_ERROR]: "内部サーバーエラーが発生しました",
  [ERROR_CODES.NETWORK_ERROR]: "ネットワークエラーが発生しました",
  [ERROR_CODES.TIMEOUT_ERROR]: "リクエストがタイムアウトしました",
} as const;

// エラーレスポンスの型定義
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: string;
}

// 統一されたエラーハンドラー
export class ErrorHandler {
  // エラーログの出力
  private static logError(error: Error, context?: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      error: error.message,
      stack: error.stack,
      context,
    };

    console.error("API Error:", JSON.stringify(logMessage, null, 2));
  }

  // エラーレスポンスの作成
  public static createErrorResponse(
    error: Error | APIError,
    context?: string
  ): NextResponse<ErrorResponse> {
    this.logError(error, context);

    let statusCode = 500;
    let code: string = ERROR_CODES.INTERNAL_ERROR;
    let message: string = ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR];
    let details: any = undefined;

    if (error instanceof APIError) {
      statusCode = error.statusCode;
      code = error.code;
      message =
        ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || error.message;
      details = error.details;
    } else {
      // 一般的なエラーの場合、エラーメッセージから適切なコードを推測
      if (error.message.includes("validation")) {
        code = ERROR_CODES.VALIDATION_ERROR;
        message = ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR];
        statusCode = 400;
      } else if (error.message.includes("rate limit")) {
        code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
        message = ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED];
        statusCode = 429;
      } else if (error.message.includes("unauthorized")) {
        code = ERROR_CODES.UNAUTHORIZED;
        message = ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED];
        statusCode = 401;
      } else if (error.message.includes("forbidden")) {
        code = ERROR_CODES.FORBIDDEN;
        message = ERROR_MESSAGES[ERROR_CODES.FORBIDDEN];
        statusCode = 403;
      } else if (error.message.includes("not found")) {
        code = ERROR_CODES.DATA_NOT_FOUND;
        message = ERROR_MESSAGES[ERROR_CODES.DATA_NOT_FOUND];
        statusCode = 404;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
        code,
        details,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }

  // 非同期関数のエラーハンドリング
  public static async handleAsync<T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await asyncFn();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new APIError(
          "Unknown error occurred",
          500,
          ERROR_CODES.INTERNAL_ERROR,
          error
        );
      }
    }
  }

  // バリデーションエラーの作成
  public static createValidationError(
    message: string,
    details?: any
  ): APIError {
    return new APIError(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }

  // 認証エラーの作成
  public static createAuthError(
    message: string = ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED]
  ): APIError {
    return new APIError(message, 401, ERROR_CODES.UNAUTHORIZED);
  }

  // 権限エラーの作成
  public static createForbiddenError(
    message: string = ERROR_MESSAGES[ERROR_CODES.FORBIDDEN]
  ): APIError {
    return new APIError(message, 403, ERROR_CODES.FORBIDDEN);
  }

  // データが見つからないエラーの作成
  public static createNotFoundError(
    message: string = ERROR_MESSAGES[ERROR_CODES.DATA_NOT_FOUND]
  ): APIError {
    return new APIError(message, 404, ERROR_CODES.DATA_NOT_FOUND);
  }

  // レート制限エラーの作成
  public static createRateLimitError(
    message: string = ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED]
  ): APIError {
    return new APIError(message, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }

  // 外部APIエラーの作成
  public static createExternalAPIError(
    service: string,
    originalError?: any
  ): APIError {
    return new APIError(
      `${service}でエラーが発生しました`,
      502,
      ERROR_CODES.EXTERNAL_API_ERROR,
      originalError
    );
  }

  // 設定エラーの作成
  public static createConfigError(
    message: string = ERROR_MESSAGES[ERROR_CODES.CONFIG_ERROR]
  ): APIError {
    return new APIError(message, 500, ERROR_CODES.CONFIG_ERROR);
  }
}

// エラーハンドリング用のデコレータ
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      } else if (error instanceof Error) {
        throw new APIError(error.message, 500, ERROR_CODES.INTERNAL_ERROR, {
          originalError: error.message,
          context,
        });
      } else {
        throw new APIError(
          "Unknown error occurred",
          500,
          ERROR_CODES.INTERNAL_ERROR,
          { originalError: error, context }
        );
      }
    }
  };
}

// エラーレスポンスの型ガード
export function isErrorResponse(response: any): response is ErrorResponse {
  return (
    response &&
    typeof response === "object" &&
    response.success === false &&
    typeof response.error === "string" &&
    typeof response.code === "string"
  );
}

// 成功レスポンスの型ガード
export function isSuccessResponse<T>(
  response: any
): response is { success: true; data: T } {
  return (
    response &&
    typeof response === "object" &&
    response.success === true &&
    "data" in response
  );
}
