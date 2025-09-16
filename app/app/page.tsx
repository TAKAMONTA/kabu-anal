"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    router.push(`/result?query=${encodeURIComponent(input)}`);
  };

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <div className="font-bold text-xl tracking-tight text-indigo-800">
          株穴
        </div>
        <a
          href="/disclaimer"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          免責
        </a>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-6 text-slate-900">
          AI株分析（簡易版）
        </h1>

        {/* Search Form */}
        <form className="flex gap-2 mb-3" onSubmit={handleSubmit}>
          <input
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-300"
            placeholder="会社名 / 証券コード / ティッカー（例：トヨタ, 7203, AAPL）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-700 px-5 py-3 text-white font-medium hover:bg-indigo-800"
          >
            検索
          </button>
        </form>

        <p className="text-sm text-slate-600 mb-10">
          例：7203 / トヨタ / AAPL を入力し、Enter で検索できます。
        </p>

        {/* Ad Space */}
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-4 text-center">
          <span className="text-xs text-slate-500 block mb-2">Sponsored</span>
          {/* A8.netタグをここに */}
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500">
        © 2025 Kabu-Ana — 投資判断はご自身の責任でお願いします
      </footer>
    </div>
  );
}
