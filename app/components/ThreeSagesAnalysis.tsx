"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FinalAnalysisReport, AIAnalysisResult } from "@/app/types/analysis";

type AnalysisResult = FinalAnalysisReport;

interface ThreeSagesAnalysisProps {
  initialSymbol?: string;
  autoStart?: boolean;
}

export default function ThreeSagesAnalysis({
  initialSymbol,
  autoStart,
}: ThreeSagesAnalysisProps) {
  const [stockCode] = useState(initialSymbol || "");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>("");

  const handleAnalyze = useCallback(async () => {
    if (!stockCode.trim()) {
      setError("証券コードを入力してください");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setCurrentPhase("Phase 1: データ収集中...");

    try {
      const response = await fetch("/api/three-sages-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCode: stockCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "分析に失敗しました");
      }

      setAnalysis(data.data);
      setCurrentPhase("完了");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [stockCode]);

  // initialSymbolとautoStartがtrueの場合は自動的に分析を開始
  useEffect(() => {
    if (initialSymbol && initialSymbol.trim() && autoStart) {
      handleAnalyze();
    }
  }, [initialSymbol, autoStart, handleAnalyze]);

  return (
    <div className="min-h-screen ukiyoe-layout p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="text-center space-y-4 relative">
          <h1 className="text-4xl font-bold text-[#2e4057] tracking-wider">
            市場三賢人の見立て
          </h1>
          <p className="text-[#2c2c2c] text-lg font-medium">
            3つのAIが統一データを基に株式分析を実施
          </p>
        </div>

        {/* ナビゲーション */}
        {!loading && !analysis && !error && (
          <div className="ukiyoe-card ukiyoe-card-shadow border-[#d4af37]">
            <div className="pt-6 space-y-4">
              <h2 className="text-xl font-semibold text-[#2e4057] text-center">
                📊 分析結果を待機中
              </h2>
              <p className="text-center text-[#2c2c2c]">
                メインページで銘柄コードを入力して分析を開始してください
              </p>
              <div className="flex justify-center">
                <Link
                  href="/"
                  className="bg-[#d4af37] hover:bg-[#b8941f] text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <span>← メインページに戻る</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ローディング画面 */}
        {loading && (
          <div className="ukiyoe-card ukiyoe-card-shadow border-[#d4af37]">
            <div className="pt-6 space-y-4">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#d4af37] border-t-transparent mb-4" />
                <h2 className="text-xl font-semibold text-[#2e4057]">
                  {currentPhase}
                </h2>
                <Progress value={33} className="mt-4" />
              </div>
              <div className="space-y-2 text-sm text-[#2c2c2c]">
                <p>📊 Phase 1: Perplexityが最新の市場データを取得しています</p>
                <p>🤖 Phase 2: 3人の賢人が分析を進めています</p>
                <p>📋 Phase 3: 結果を統合して総合判断を生成します</p>
              </div>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 分析結果 */}
        {analysis && (
          <div className="space-y-6">
            {/* A8.net 分析結果ページ広告 */}
            <div className="ukiyoe-card ukiyoe-card-shadow border-[#ffc107]">
              <div className="p-4">
                <div id="a8net-analysis-ad" className="text-center">
                  <a
                    href="https://px.a8.net/svt/ejp?a8mat=45FV1Z+55R9IQ+0K+11J5Z5"
                    rel="nofollow"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      width="250"
                      height="250"
                      alt="A8.net広告"
                      src="https://www25.a8.net/svt/bgt?aid=251002871312&wid=001&eno=01&mid=s00000000002006304000&mc=1"
                      style={{ border: 0 }}
                    />
                  </a>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    width="1"
                    height="1"
                    src="https://www19.a8.net/0.gif?a8mat=45FV1Z+55R9IQ+0K+11J5Z5"
                    alt=""
                    style={{ border: 0 }}
                  />
                </div>
              </div>
            </div>
            {/* 統一データ表示 */}
            <div className="ukiyoe-card ukiyoe-card-shadow border-[#6b8e23]">
              <div className="ukiyoe-card-header">
                <div className="flex items-center gap-2 text-xl font-bold text-[#2e4057]">
                  <span className="text-2xl">📈</span>
                  統一市場データ
                </div>
              </div>
              <div className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#2e4057]">企業名</p>
                    <p className="text-lg font-semibold text-[#2c2c2c]">
                      {analysis.企業名}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#2e4057]">証券コード</p>
                    <p className="text-lg font-semibold text-[#2c2c2c]">
                      {analysis.証券コード}
                    </p>
                  </div>
                </div>

                <div className="ukiyoe-info-block">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#2c2c2c]">
                      {analysis.統一データ.株価情報.現在値 != null
                        ? (() => {
                            const isJapanese = /^\d+$/.test(
                              analysis.証券コード
                            );
                            const symbol = isJapanese ? "¥" : "$";
                            return `${symbol}${analysis.統一データ.株価情報.現在値.toLocaleString()}`;
                          })()
                        : "データなし"}
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        (analysis.統一データ.株価情報.前日比.円 ||
                          analysis.統一データ.株価情報.前日比.ドル ||
                          0) > 0
                          ? "text-[#d64545]"
                          : "text-[#2e4057]"
                      }`}
                    >
                      {(() => {
                        const change =
                          analysis.統一データ.株価情報.前日比.円 ??
                          analysis.統一データ.株価情報.前日比.ドル ??
                          0;
                        const percent =
                          analysis.統一データ.株価情報.前日比.パーセント ?? 0;
                        return `${change > 0 ? "+" : ""}${change} (${percent}%)`;
                      })()}
                    </span>
                  </div>
                  <p className="text-sm text-[#2e4057] mt-2">
                    データ取得:{" "}
                    {new Date(
                      analysis.統一データ.metadata.収集日時
                    ).toLocaleString("ja-JP")}
                  </p>
                </div>

                <div className="ukiyoe-grid-2 text-sm">
                  <div className="ukiyoe-info-block">
                    <p className="text-[#2e4057]">PER</p>
                    <p className="font-semibold text-[#2c2c2c]">
                      {analysis.統一データ.財務指標.PER || "N/A"}
                    </p>
                  </div>
                  <div className="ukiyoe-info-block">
                    <p className="text-[#2e4057]">PBR</p>
                    <p className="font-semibold text-[#2c2c2c]">
                      {analysis.統一データ.財務指標.PBR || "N/A"}
                    </p>
                  </div>
                  <div className="ukiyoe-info-block">
                    <p className="text-[#2e4057]">ROE</p>
                    <p className="font-semibold text-[#2c2c2c]">
                      {analysis.統一データ.財務指標.ROE
                        ? `${analysis.統一データ.財務指標.ROE}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3つのAI分析カード */}
            <div className="ukiyoe-card-grid">
              <AICard data={analysis.分析結果.Gemini} color="green" icon="📊" />
              <AICard
                data={analysis.分析結果.Claude}
                color="purple"
                icon="💎"
              />
              <AICard data={analysis.分析結果.OpenAI} color="blue" icon="🤖" />
            </div>

            {/* 総合判断 */}
            <div className="ukiyoe-card ukiyoe-card-shadow border-[#d4af37] border-4 relative">
              <div className="ukiyoe-card-header">
                <div className="text-2xl text-center font-bold text-[#2e4057]">
                  市場三賢人の総合見立
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="ukiyoe-insho text-xs">三賢</div>
              </div>
              <div className="pt-6 space-y-6">
                <div className="text-center">
                  <div
                    className={`ukiyoe-badge ${
                      analysis.総合判断.判断 === "買い"
                        ? "ukiyoe-badge-buy"
                        : analysis.総合判断.判断 === "売り"
                          ? "ukiyoe-badge-sell"
                          : "ukiyoe-badge-hold"
                    } text-2xl px-8 py-3`}
                  >
                    {analysis.総合判断.判断}
                  </div>
                  <p className="text-lg mt-4 text-[#2c2c2c] font-medium">
                    {analysis.総合判断.理由}
                  </p>
                  <div className="mt-4">
                    <p className="text-sm text-[#2e4057]">信頼度</p>
                    <p className="text-3xl font-bold text-[#2e4057]">
                      {analysis.総合判断.信頼度}%
                    </p>
                  </div>
                </div>

                <div className="ukiyoe-grid-2">
                  <div className="ukiyoe-info-block text-center">
                    <p className="text-sm text-[#2e4057]">買い推奨</p>
                    <p className="text-2xl font-bold text-[#6b8e23]">
                      {analysis.総合判断.詳細.買い推奨}
                    </p>
                  </div>
                  <div className="ukiyoe-info-block text-center">
                    <p className="text-sm text-[#2e4057]">売り推奨</p>
                    <p className="text-2xl font-bold text-[#d64545]">
                      {analysis.総合判断.詳細.売り推奨}
                    </p>
                  </div>
                  <div className="ukiyoe-info-block text-center">
                    <p className="text-sm text-[#2e4057]">保留推奨</p>
                    <p className="text-2xl font-bold text-[#d4af37]">
                      {analysis.総合判断.詳細.保留推奨}
                    </p>
                  </div>
                </div>

                {analysis.総合判断.目標株価統合 && (
                  <div className="ukiyoe-info-block">
                    <p className="text-sm text-[#2e4057] mb-2">
                      目標株価レンジ（統合）
                    </p>
                    <p className="text-lg font-semibold text-[#2c2c2c]">
                      ¥
                      {analysis.総合判断.目標株価統合.平均下限.toLocaleString()}{" "}
                      〜 ¥
                      {analysis.総合判断.目標株価統合.平均上限.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// AIカードコンポーネント
function AICard({
  data,
  color,
  icon,
}: {
  data: AIAnalysisResult;
  color: "green" | "purple" | "blue";
  icon: string;
}) {
  const colorClasses = {
    green: "border-[#6b8e23]",
    purple: "border-[#9370db]",
    blue: "border-[#2e4057]",
  };

  const badgeClasses = {
    買い: "ukiyoe-badge-buy",
    売り: "ukiyoe-badge-sell",
    保留: "ukiyoe-badge-hold",
  };

  return (
    <div className={`ukiyoe-card ukiyoe-card-shadow ${colorClasses[color]}`}>
      <div className="ukiyoe-card-header flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-lg font-bold text-[#2e4057]">{data.AI名}</div>
          <div className="text-sm font-normal text-[#2c2c2c]">
            {data.専門分野}
          </div>
        </div>
      </div>
      <div className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div
            className={`ukiyoe-badge ${badgeClasses[data.推奨の見立て as keyof typeof badgeClasses] || "ukiyoe-badge-hold"}`}
          >
            {data.推奨の見立て}
          </div>
          <span className="text-sm text-[#2e4057]">信頼度: {data.信頼度}%</span>
        </div>

        <div className="space-y-2 text-sm">
          {Object.entries(data.分析内容).map(([key, value]) => {
            if (key === "株価情報" || typeof value !== "string") return null;
            return (
              <div key={key} className="ukiyoe-card-section">
                <h4>{key}</h4>
                <p>{value as string}</p>
              </div>
            );
          })}
        </div>

        {data.目標株価 && (data.目標株価.下限 || data.目標株価.上限) && (
          <div className="ukiyoe-info-block text-sm">
            <p className="text-xs text-[#2e4057] mb-1">目標株価</p>
            <p className="font-semibold text-[#2c2c2c]">
              ¥{data.目標株価.下限?.toLocaleString() || "N/A"} 〜 ¥
              {data.目標株価.上限?.toLocaleString() || "N/A"}
            </p>
          </div>
        )}

        {data.リスク要因 && data.リスク要因.length > 0 && (
          <div>
            <p className="text-xs text-[#2e4057] mb-2">リスク要因</p>
            <ul className="text-xs space-y-1">
              {data.リスク要因.map((risk: string, index: number) => (
                <li key={index} className="text-[#2c2c2c]">
                  ・{risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
