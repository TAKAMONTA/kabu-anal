// app/api/health/firebase/route.ts
import { NextResponse } from "next/server";

const KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export async function GET() {
  const status = Object.fromEntries(
    KEYS.map(k => [k, process.env[k] ? "set" : "missing"])
  );
  return NextResponse.json({
    ok: Object.values(status).every(v => v === "set"),
    status,
    runtime: process.env.NEXT_RUNTIME ?? "node",
  });
}
