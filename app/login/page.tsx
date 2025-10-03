"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/analysis");
    } catch (err) {
      const errorCode = (err as { code?: string }).code;
      setError(
        errorCode === "auth/invalid-credential"
          ? "メールアドレスまたはパスワードが正しくありません"
          : errorCode === "auth/email-already-in-use"
            ? "このメールアドレスは既に使用されています"
            : "認証エラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen ukiyoe-layout flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-[#2e4057] hover:text-[#d4af37] font-semibold"
          >
            ← ホームに戻る
          </Link>
        </div>

        <div className="ukiyoe-card ukiyoe-card-shadow border-[#d4af37] relative">
          <div className="absolute top-4 right-4">
            <div className="ukiyoe-insho text-xs">認</div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-6 text-[#2e4057] tracking-wider">
            {isSignUp ? "新規登録" : "ログイン"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2e4057] mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full ukiyoe-input"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2e4057] mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full ukiyoe-input"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 border-2 border-[#d64545] bg-[#d64545]/10 rounded-lg text-[#8b0000] text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full ukiyoe-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "処理中..." : isSignUp ? "登録" : "ログイン"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-[#2e4057] hover:text-[#d4af37] text-sm font-medium"
            >
              {isSignUp
                ? "アカウントをお持ちの方はこちら"
                : "アカウントをお持ちでない方はこちら"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
