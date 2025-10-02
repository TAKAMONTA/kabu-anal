"use client";

import { useState } from "react";

export default function StockAnalysisForm() {
  const [symbol, setSymbol] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      // 入力された銘柄コードで分析ページに遷移（自動分析開始）
      window.location.href = `/three-sages?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}&auto=true`;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-[#2e4057] mb-2">
        銘柄コード
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
          placeholder="例：7203（トヨタ）、AAPL（Apple）"
          className="flex-1 px-3 py-2 border border-[#d4af37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!symbol.trim()}
          className="bg-[#d4af37] hover:bg-[#b8941f] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <span>分析開始</span>
          <span>🚀</span>
        </button>
      </div>
      {symbol.trim() && (
        <div className="mt-2 text-xs text-[#666]">
          銘柄コード「{symbol.trim().toUpperCase()}」で分析を開始します
        </div>
      )}
    </form>
  );
}
