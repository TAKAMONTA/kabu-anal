"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import StockChart from "@/app/components/StockChart";
import FinanceTable from "@/app/components/FinanceTable";
import FinanceChart from "@/app/components/FinanceChart";
import ParagraphOrList from "@/app/components/ParagraphOrList";
import { FinanceApiResponse, AnalysisApiResponse } from "@/app/types/api";

export default function ResultContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  const [financeData, setFinanceData] = useState<FinanceApiResponse | null>(
    null
  );
  const [analysis, setAnalysis] = useState<AnalysisApiResponse | null>(null);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<"3y" | "5y" | "all">("3y");

  useEffect(() => {
    if (!query) return;

    async function fetchData() {
      try {
        setLoading(true);

        // 財務データとAI分析を並列呼び出し
        const [financeRes, analysisRes] = await Promise.all([
          fetch(`/api/finance?input=${encodeURIComponent(query)}`),
          fetch(`/api/analyze?query=${encodeURIComponent(query)}`),
        ]);

        const financeData = await financeRes.json();
        const analysisData = await analysisRes.json();

        // 財務データの処理
        if (financeData.error) {
          setFinanceError(financeData.error);
        } else {
          setFinanceData(financeData);
        }

        // AI分析データの処理
        if (analysisData.error) {
          setAnalysisError(analysisData.error);
        } else {
          setAnalysis(analysisData);
        }
      } catch {
        setFinanceError("データの取得に失敗しました");
        setAnalysisError("AI分析の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [query]);

  // AI分析結果を5セクションに分割
  function parseAnalysis(text: string) {
    const sections = text.split(/###\s*/);

    const formatSection = (section: string) => {
      if (!section) return "データなし";
      return section.replace(/^\d+\.\s*[^:：\n]*[:：]?\s*/, "").trim();
    };

    return {
      overview: formatSection(sections[1]) || "企業情報を取得できませんでした",
      strengths:
        formatSection(sections[2]) || "強みの情報を取得できませんでした",
      weaknesses:
        formatSection(sections[3]) || "注意点の情報を取得できませんでした",
      factors:
        formatSection(sections[4]) || "株価要因の情報を取得できませんでした",
      hints: formatSection(sections[5]) || "投資ヒントを取得できませんでした",
    };
  }

  const parsedAnalysis = analysis ? parseAnalysis(analysis.result) : null;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">
          {query} の株分析
        </h1>
        <p className="text-slate-600 mb-8">
          初心者にもわかりやすく、中級者も満足できる株式分析をお届けします
        </p>
        <div className="text-center py-12">
          <div className="text-slate-600 text-lg">データを取得中...</div>
          <div className="text-slate-500 text-sm mt-2">
            株価データとAI分析を並行処理しています
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-slate-800">
        {query} の株分析
      </h1>
      <p className="text-slate-600 mb-8">
        初心者にもわかりやすく、中級者も満足できる株式分析をお届けします
      </p>

      {/* 株価・財務データセクション */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-6 text-slate-800 flex items-center">
          <span className="mr-3">📊</span>データ分析
        </h2>

        {financeError ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center mb-2">
              <span className="mr-2 text-red-500">⚠️</span>
              <h3 className="font-semibold text-red-800">
                データを取得できませんでした
              </h3>
            </div>
            <p className="text-red-600">{financeError}</p>
          </div>
        ) : financeData ? (
          <div className="space-y-6">
            {/* 現在株価表示 */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-blue-800 mb-1">
                    {financeData.symbol}
                  </h3>
                  <p className="text-sm text-slate-600">現在の株価</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {financeData.price?.toLocaleString() || "N/A"}
                  </div>
                  <div className="text-sm text-slate-600">
                    {financeData.currency}
                  </div>
                </div>
              </div>
            </div>

            {/* 期間選択 */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">
                データ期間
              </h3>
              <select
                value={selectedRange}
                onChange={(e) =>
                  setSelectedRange(e.target.value as "3y" | "5y" | "all")
                }
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="3y">直近3年</option>
                <option value="5y">直近5年</option>
                <option value="all">全期間</option>
              </select>
            </div>

            {/* 株価チャートと財務データ */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 株価チャート */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                <StockChart
                  labels={financeData.labels}
                  prices={financeData.prices.filter(
                    (p): p is number => p !== null
                  )}
                  unit={financeData.currency}
                />
              </div>

              {/* 財務テーブル */}
              <div>
                <FinanceTable
                  data={financeData.financeHistory}
                  range={selectedRange}
                />
              </div>
            </div>

            {/* 財務グラフ */}
            <div>
              <FinanceChart
                data={financeData.financeHistory.slice(
                  selectedRange === "3y" ? -3 : selectedRange === "5y" ? -5 : 0
                )}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* AI分析セクション */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-slate-800 flex items-center">
          <span className="mr-3">🤖</span>AI分析レポート
        </h2>

        {analysisError ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center mb-2">
              <span className="mr-2 text-red-500">⚠️</span>
              <h3 className="font-semibold text-red-800">
                AI分析に失敗しました
              </h3>
            </div>
            <p className="text-red-600">{analysisError}</p>
          </div>
        ) : parsedAnalysis ? (
          <div className="space-y-6">
            {/* 企業概要 */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-4 text-emerald-700 flex items-center">
                <span className="mr-2">🏢</span>企業概要
              </h3>
              <ParagraphOrList text={parsedAnalysis.overview} />
            </div>

            {/* 強みと弱み */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 良いところ */}
              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-4 text-green-700 flex items-center">
                  <span className="mr-2">✅</span>良いところ
                </h3>
                <ParagraphOrList text={parsedAnalysis.strengths} />
              </div>

              {/* 注意点 */}
              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-4 text-red-700 flex items-center">
                  <span className="mr-2">⚠️</span>注意点
                </h3>
                <ParagraphOrList text={parsedAnalysis.weaknesses} />
              </div>
            </div>

            {/* 株価が動く理由 */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-4 text-orange-700 flex items-center">
                <span className="mr-2">📊</span>株価が動く理由
              </h3>
              <ParagraphOrList text={parsedAnalysis.factors} />
            </div>

            {/* 投資を考える時のポイント */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-4 text-blue-700 flex items-center">
                <span className="mr-2">💡</span>投資を考える時のポイント
              </h3>
              <ParagraphOrList text={parsedAnalysis.hints} />
            </div>

            {/* 免責事項 */}
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
                <span className="mr-2">⚠️</span>重要な注意事項
              </h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                この分析は参考情報であり、投資を推奨するものではありません。
                投資は必ずご自身の判断と責任で行ってください。
                過去の実績は将来の運用成果を保証するものではありません。
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
