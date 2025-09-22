import { NextResponse } from "next/server";
import { callOpenAI } from "@/app/lib/apiUtils";

// API統合のヘルスチェック
export async function GET() {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    apis: {
      openai: "unknown",
      environment: "unknown",
    },
    details: {} as any,
  };

  try {
    // 環境変数チェック
    const envStatus = checkAPIEnvironmentVariables();
    healthCheck.apis.environment = envStatus.healthy ? "healthy" : "unhealthy";
    healthCheck.details.environment = envStatus;

    // OpenAI API接続チェック
    const openaiStatus = await checkOpenAIConnection();
    healthCheck.apis.openai = openaiStatus.healthy ? "healthy" : "unhealthy";
    healthCheck.details.openai = openaiStatus;

    // 全体のステータス判定
    const allHealthy = Object.values(healthCheck.apis).every(
      status => status === "healthy"
    );
    healthCheck.status = allHealthy ? "healthy" : "degraded";

    return NextResponse.json(healthCheck, {
      status: allHealthy ? 200 : 503,
    });
  } catch (error) {
    healthCheck.status = "unhealthy";
    healthCheck.details.error =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(healthCheck, { status: 500 });
  }
}

// API環境変数チェック
function checkAPIEnvironmentVariables() {
  const apiKeys = [
    { key: "OPENAI_API_KEY", required: true },
    { key: "CLAUDE_API_KEY", required: false },
    { key: "GEMINI_API_KEY", required: false },
    { key: "ALPHA_VANTAGE_API_KEY", required: false },
  ];

  const status = {
    healthy: true,
    keys: {} as any,
    missing: [] as string[],
  };

  apiKeys.forEach(({ key, required }) => {
    const value = process.env[key];
    const isSet = !!value;
    const isPlaceholder =
      value?.includes("placeholder") || value?.includes("your_");

    status.keys[key] = {
      set: isSet,
      placeholder: isPlaceholder,
      valid: isSet && !isPlaceholder,
    };

    if (required && (!isSet || isPlaceholder)) {
      status.healthy = false;
      status.missing.push(key);
    }
  });

  return status;
}

// OpenAI API接続チェック
async function checkOpenAIConnection() {
  const status = {
    healthy: true,
    connection: "unknown",
    responseTime: 0,
    error: null as string | null,
  };

  try {
    const startTime = Date.now();

    // 簡単なテストリクエスト
    const response = await callOpenAI(
      "Hello, this is a health check. Please respond with 'OK'.",
      "You are a helpful assistant. Respond briefly.",
      {
        model: "gpt-4o-mini",
        temperature: 0.1,
        maxTokens: 10,
      }
    );

    status.responseTime = Date.now() - startTime;

    if (response && response.trim().toLowerCase().includes("ok")) {
      status.connection = "connected";
      status.healthy = true;
    } else {
      status.connection = "unexpected_response";
      status.healthy = false;
      status.error = "Unexpected response from OpenAI API";
    }
  } catch (error) {
    status.connection = "error";
    status.healthy = false;
    status.error = error instanceof Error ? error.message : "Unknown error";
  }

  return status;
}
