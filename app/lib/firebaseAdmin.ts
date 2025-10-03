import * as admin from "firebase-admin";
import { logger } from "./logger";

if (!admin.apps.length) {
  try {
    // 環境変数の検証
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Firebase Admin SDK: 必須環境変数が不足しています (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)"
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    logger.info({ projectId }, "Firebase Admin SDK initialized successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      { error: errorMessage },
      "Firebase Admin SDK initialization failed"
    );

    // 本番環境では初期化失敗時に明示的にエラーを投げる
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
