"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ★ ドット記法の“静的参照”で構成を定義（←ここが置換される）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

// ★ クライアントだけで不足チェック（SSR崩壊を防ぐ）
function validateFirebaseConfig() {
  if (typeof window === "undefined") return;

  const keyMap = {
    apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
    authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
  } as const;

  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => keyMap[k as keyof typeof firebaseConfig]);

  if (missing.length) {
    throw new Error(
      `Firebase設定が不完全です。以下の環境変数が設定されていません: ${missing.join(", ")}`
    );
  }
}
validateFirebaseConfig();

const app = getApps().length ? getApp() : initializeApp(firebaseConfig as any);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
