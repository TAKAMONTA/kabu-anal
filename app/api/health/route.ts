import { NextResponse } from "next/server";
import { auth, db } from "@/app/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// 包括的なヘルスチェックAPI
export async function GET() {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    services: {
      api: "healthy",
      firebase: "unknown",
      environment: "unknown",
    },
    details: {} as any,
  };

  try {
    // 環境変数チェック
    const envStatus = checkEnvironmentVariables();
    healthCheck.services.environment = envStatus.healthy
      ? "healthy"
      : "unhealthy";
    healthCheck.details.environment = envStatus;

    // Firebase接続チェック
    const firebaseStatus = await checkFirebaseConnection();
    healthCheck.services.firebase = firebaseStatus.healthy
      ? "healthy"
      : "unhealthy";
    healthCheck.details.firebase = firebaseStatus;

    // 全体のステータス判定
    const allHealthy = Object.values(healthCheck.services).every(
      status => status === "healthy"
    );
    healthCheck.status = allHealthy ? "healthy" : "degraded";

    return NextResponse.json(healthCheck, {
      status: allHealthy ? 200 : 503,
    });
  } catch (error) {
    healthCheck.status = "unhealthy";
    healthCheck.services.api = "unhealthy";
    healthCheck.details.error =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(healthCheck, { status: 500 });
  }
}

// 環境変数チェック
function checkEnvironmentVariables() {
  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  const optionalEnvVars = [
    "OPENAI_API_KEY",
    "CLAUDE_API_KEY",
    "GEMINI_API_KEY",
    "ALPHA_VANTAGE_API_KEY",
  ];

  const status = {
    healthy: true,
    required: {} as any,
    optional: {} as any,
    missing: [] as string[],
  };

  // 必須環境変数のチェック
  requiredEnvVars.forEach(key => {
    const value = process.env[key];
    status.required[key] = value ? "set" : "missing";
    if (!value) {
      status.healthy = false;
      status.missing.push(key);
    }
  });

  // オプション環境変数のチェック
  optionalEnvVars.forEach(key => {
    const value = process.env[key];
    status.optional[key] = value ? "set" : "missing";
  });

  return status;
}

// Firebase接続チェック
async function checkFirebaseConnection() {
  const status = {
    healthy: true,
    auth: "unknown",
    firestore: "unknown",
    errors: [] as string[],
  };

  try {
    // Auth接続チェック
    try {
      // 認証サービスの初期化確認
      if (auth) {
        status.auth = "connected";
      } else {
        status.auth = "disconnected";
        status.healthy = false;
        status.errors.push("Firebase Auth not initialized");
      }
    } catch (error) {
      status.auth = "error";
      status.healthy = false;
      status.errors.push(
        `Auth error: ${error instanceof Error ? error.message : "Unknown"}`
      );
    }

    // Firestore接続チェック
    try {
      if (db) {
        // 簡単な読み取りテスト（存在しないドキュメントでもエラーにならない）
        const testDoc = doc(db, "health-check", "test");
        await getDoc(testDoc);
        status.firestore = "connected";
      } else {
        status.firestore = "disconnected";
        status.healthy = false;
        status.errors.push("Firestore not initialized");
      }
    } catch (error) {
      status.firestore = "error";
      status.healthy = false;
      status.errors.push(
        `Firestore error: ${error instanceof Error ? error.message : "Unknown"}`
      );
    }
  } catch (error) {
    status.healthy = false;
    status.errors.push(
      `Firebase connection error: ${error instanceof Error ? error.message : "Unknown"}`
    );
  }

  return status;
}
