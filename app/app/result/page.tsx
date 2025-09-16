"use client";

import { Suspense } from "react";
import ResultContent from "./ResultContent";

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-slate-600 text-lg">読み込み中...</div>
            <div className="text-slate-500 text-sm mt-2">
              株価データとAI分析を準備しています
            </div>
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
