"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// 型定義
type Decision = "買い" | "売り" | "保留";

interface StructuredFields {
  summary?: string;
  price?: {
    current?: string;
    range?: string;
  };
  financialMetrics?: {
    PER?: number | null;
    PBR?: number | null;
    ROE?: number | null;
    配当利回り?: number | null;
  };
  technicalMetrics?: {
    MA25?: number | null;
    MA75?: number | null;
    MA200?: number | null;
    RSI?: number | null;
    MACD?: {
      値?: number | null;
      シグナル?: number | null;
      ヒストグラム?: number | null;
    } | null;
  };
  trend?: string;
  fundamentals?: string;
  rationale?: string;
  risks?: string;
  targetRange?: string;
  horizon?: string;
}

interface DetailedAnalysis {
  analysis: string;
  recommendation: Decision;
  confidence: number;
  structured?: StructuredFields;
}

interface DataQuality {
  score: number;
  isAdequate: boolean;
  report: string;
  details: {
    hasStockPrice: boolean;
    hasFinancials: boolean;
    hasTechnicals: boolean;
    hasNews: boolean;
  };
}

interface Analysis {
  stockCode: string;
  timestamp: string;
  openai: DetailedAnalysis;
  claude: DetailedAnalysis;
  gemini: DetailedAnalysis;
  finalJudgement: {
    decision: Decision;
    reasoning: string;
    confidence: number;
  };
  dataQuality?: DataQuality;
}

export default function AnalysisPage() {
  const [stockCode, setStockCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [loadingStage, setLoadingStage] = useState("");
  const [inputError, setInputError] = useState("");

  const validateStockCode = (code: string): boolean => {
    const trimmed = code.trim();
    if (!trimmed) {
      setInputError("銘柄コードを入力してください");
      return false;
    }
    if (!/^\d{4}$/.test(trimmed)) {
      setInputError("4桁の数字を入力してください（例: 7203）");
      return false;
    }
    setInputError("");
    return true;
  };

  const handleAnalyze = async () => {
    if (!validateStockCode(stockCode)) {
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    setLoadingStage("Phase 1: 市場データを収集中...");

    try {
      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCode: stockCode.trim() }),
      });

      setLoadingStage("Phase 2: 三賢人が分析中...");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `分析リクエストが失敗しました (ステータス: ${response.status})`
        );
      }

      const data = await response.json();

      // データ検証
      if (!data.stockCode || !data.openai || !data.claude || !data.gemini || !data.finalJudgement) {
        throw new Error("分析データが不完全です。もう一度お試しください。");
      }

      setLoadingStage("Phase 3: 結果を整理中...");
      setAnalysis(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "予期しないエラーが発生しました";
      setError(errorMessage);
      setAnalysis(null);

      // ネットワークエラーの場合は詳細を追加
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("ネットワークエラーが発生しました。接続を確認してください。");
      }
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  const recommendationBadgeClass = (decision: Decision) => {
    switch (decision) {
      case "買い":
        return "ukiyoe-badge ukiyoe-badge-buy";
      case "売り":
        return "ukiyoe-badge ukiyoe-badge-sell";
      default:
        return "ukiyoe-badge ukiyoe-badge-hold";
    }
  };

  return (
    <main className="ukiyoe-layout">
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="ukiyoe-header ukiyoe-header-gradient ukiyoe-pattern rounded-3xl p-10 text-center text-[#fff8dc] relative">
          <Link
            href="/"
            className="absolute left-6 top-6 text-[#d4af37] underline-offset-4 hover:text-[#fff8dc] z-20"
          >
            ← ホームに戻る
          </Link>
          <div className="ukiyoe-pattern-overlay" aria-hidden="true" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-widest sm:text-4xl">
              株式分析AI - 三賢人による多角的見立
            </h1>
            <p className="mt-2 text-sm text-[#d4af37]">
              銘柄コードを入力し、三賢人の叡智を授かりましょう
            </p>
          </div>
          <div className="ukiyoe-stamp">
            <div className="ukiyoe-insho text-sm">印</div>
          </div>
        </div>

        {/* 入力フォーム */}
        <section className="mt-10 rounded-3xl border-[3px] border-[#d4af37] bg-[#fff8dc]/95 p-8 shadow-lg shadow-black/10">
          <header className="mb-6 text-center">
            <h2 className="ukiyoe-section-title">市場三賢人に問いかける</h2>
            <p className="mt-2 text-sm text-[#2e4057]">
              市場（いちば）の気配を読み解くため、分析したい銘柄コードを入力してください。
            </p>
          </header>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <input
                type="text"
                value={stockCode}
                onChange={e => {
                  setStockCode(e.target.value);
                  if (inputError) {
                    validateStockCode(e.target.value);
                  }
                }}
                onBlur={() => stockCode && validateStockCode(stockCode)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !loading) {
                    handleAnalyze();
                  }
                }}
                placeholder="銘柄コード (例: 7203)"
                className={`ukiyoe-input w-full text-lg ${inputError ? "border-[#d64545] border-2" : ""}`}
                disabled={loading}
                aria-label="分析したい銘柄コード"
                aria-invalid={!!inputError}
                aria-describedby={inputError ? "stock-code-error" : undefined}
              />
              {inputError && (
                <p id="stock-code-error" className="mt-2 text-sm text-[#d64545]">
                  {inputError}
                </p>
              )}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="ukiyoe-button w-full md:w-auto"
              type="button"
            >
              {loading ? "分析中..." : "分析を依頼する"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border-2 border-[#d64545] bg-[#d64545]/10 p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold text-[#8b0000]">エラーが発生しました</p>
                  <p className="mt-1 text-sm text-[#8b0000]">{error}</p>
                  <button
                    onClick={handleAnalyze}
                    className="mt-3 text-sm text-[#d64545] underline underline-offset-2 hover:text-[#8b0000]"
                    type="button"
                  >
                    再試行
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-4 text-sm text-[#2e4057] md:grid-cols-3">
            <div className="ukiyoe-info-block">
              <h5>📈 Gemini 賢人</h5>
              <p>市場の波を読み、トレンドのうねりを捉えます。</p>
            </div>
            <div className="ukiyoe-info-block">
              <h5>💼 Claude 賢人</h5>
              <p>決算書を読み解き、企業の懐を見通します。</p>
            </div>
            <div className="ukiyoe-info-block">
              <h5>⚖️ OpenAI 賢人</h5>
              <p>諸要素を統べ、投資判断として整えます。</p>
            </div>
          </div>
        </section>

        {/* ローディング画面 */}
        {loading && (
          <div className="mt-10 rounded-3xl border-[3px] border-[#2e4057] bg-[#fff8dc]/90 p-10 text-center">
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-[#2e4057]/50 border-t-[#d4af37]" />
            <p className="text-lg font-semibold text-[#2e4057]">三賢人が市場を調査中です...</p>
            {loadingStage && (
              <p className="mt-3 text-sm text-[#666666]">{loadingStage}</p>
            )}
            <div className="mt-6 flex justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${loadingStage.includes("Phase 1") || loadingStage.includes("収集") ? "bg-[#d4af37] animate-pulse" : "bg-[#d4af37]/30"}`} />
                <span className="text-xs text-[#666666]">データ収集</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${loadingStage.includes("Phase 2") || loadingStage.includes("分析") ? "bg-[#d4af37] animate-pulse" : "bg-[#d4af37]/30"}`} />
                <span className="text-xs text-[#666666]">AI分析</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${loadingStage.includes("Phase 3") || loadingStage.includes("整理") ? "bg-[#d4af37] animate-pulse" : "bg-[#d4af37]/30"}`} />
                <span className="text-xs text-[#666666]">結果整理</span>
              </div>
            </div>
          </div>
        )}

        {/* 分析結果 */}
        {analysis && (
          <section className="mt-10 space-y-8">
            {/* データ品質警告 */}
            {analysis.dataQuality && !analysis.dataQuality.isAdequate && (
              <div className="rounded-2xl border-2 border-[#ffc107] bg-[#ffc107]/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[#996600]">データ品質について</p>
                    <p className="mt-1 text-sm text-[#996600]">
                      {analysis.dataQuality.report}
                    </p>
                    <p className="mt-2 text-xs text-[#666666]">
                      品質スコア: {analysis.dataQuality.score}% |
                      株価: {analysis.dataQuality.details.hasStockPrice ? "✓" : "✗"} |
                      財務: {analysis.dataQuality.details.hasFinancials ? "✓" : "✗"} |
                      テクニカル: {analysis.dataQuality.details.hasTechnicals ? "✓" : "✗"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 総合判断 */}
            <div className="relative overflow-hidden rounded-3xl border-[3px] border-[#d4af37] bg-[#fff8dc]/95 p-8">
              <div className="ukiyoe-pattern-overlay" aria-hidden="true" />
              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm tracking-[0.3em] text-[#2e4057]">
                    市場全体の見立て
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold tracking-widest text-[#2e4057]">
                    {analysis.stockCode} - 総合判断
                  </h3>
                  <p className="mt-4 text-[#333333]">
                    {analysis.finalJudgement.reasoning}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[#2e4057]">
                    <span className={recommendationBadgeClass(analysis.finalJudgement.decision)}>
                      {analysis.finalJudgement.decision}
                    </span>
                    <span className="ukiyoe-tag">
                      信頼度{" "}
                      {(analysis.finalJudgement.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="ukiyoe-tag">
                      分析実行{" "}
                      {new Date(analysis.timestamp).toLocaleString("ja-JP")}
                    </span>
                  </div>
                </div>
                <Image
                  src="/illustrations/fuji-silhouette.svg"
                  alt="富士山のシルエット"
                  width={200}
                  height={150}
                  className="fuji-silhouette hidden md:block"
                  priority={false}
                />
              </div>
            </div>

            {/* AI分析カード */}
            <div className="ukiyoe-card-grid">
              <AIAnalysisCard
                title="Gemini 賢人"
                subtitle="📈 短期トレンド・市場センチメント分析"
                theme="gemini"
                analysis={analysis.gemini}
              />
              <AIAnalysisCard
                title="Claude 賢人"
                subtitle="💼 ファンダメンタル分析"
                theme="claude"
                analysis={analysis.claude}
              />
              <AIAnalysisCard
                title="OpenAI 賢人"
                subtitle="⚖️ 総合判断"
                theme="openai"
                analysis={analysis.openai}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function AIAnalysisCard({
  title,
  subtitle,
  analysis,
  theme,
}: {
  title: string;
  subtitle?: string;
  analysis: DetailedAnalysis;
  theme: "gemini" | "claude" | "openai";
}) {
  const themeStyles = {
    gemini: {
      borderColor: "#6b8e23",
      gradient: "linear-gradient(to bottom, #e8f5e9, #fff8dc)",
      icon: "🟢",
    },
    claude: {
      borderColor: "#d4af37",
      gradient: "linear-gradient(to bottom, #fff3e0, #fff8dc)",
      icon: "🟡",
    },
    openai: {
      borderColor: "#2e4057",
      gradient: "linear-gradient(to bottom, #e3f2fd, #fff8dc)",
      icon: "🔵",
    },
  } as const;

  const { borderColor, gradient, icon } = themeStyles[theme];
  const structured = analysis.structured;

  const badgeClass = (decision: Decision) => {
    switch (decision) {
      case "買い":
        return "ukiyoe-badge-buy";
      case "売り":
        return "ukiyoe-badge-sell";
      default:
        return "ukiyoe-badge-hold";
    }
  };

  return (
    <article
      className="ukiyoe-card ukiyoe-card-shadow"
      style={{ borderColor, background: gradient }}
    >
      <header className="ukiyoe-card-header">
        <div className="flex items-center gap-3 text-[#2e4057]">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          <div>
            <h3 className="text-xl font-semibold tracking-wide">{title}</h3>
            {subtitle && <p className="text-sm text-[#666666]">{subtitle}</p>}
          </div>
        </div>
      </header>

      {/* 推奨の見立て */}
      <section className="mt-4">
        <div className="flex items-center gap-3">
          <span className={`ukiyoe-badge ${badgeClass(analysis.recommendation)}`}>
            {analysis.recommendation}
          </span>
          <span className="text-sm text-[#666666]">
            信頼度 {(analysis.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </section>

      <div className="ukiyoe-divider" />

      {/* 分析テキスト全文表示 */}
      <section className="mt-4">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-[#333333] leading-relaxed font-sans">
            {analysis.analysis}
          </pre>
        </div>
      </section>

      {/* 構造化データがある場合は追加表示 */}
      {structured && (
        <>
          <div className="ukiyoe-divider" />
          <div className="grid grid-cols-1 gap-3 mt-4">
            {/* 株価情報 */}
            {(structured.price?.current || structured.price?.range) && (
              <DetailBlock
                title="📊 株価情報"
                content={
                  <div className="space-y-1">
                    {structured.price.current && (
                      <p className="font-medium">現在値: {structured.price.current}</p>
                    )}
                    {structured.price.range && (
                      <p className="font-medium">目標: {structured.price.range}</p>
                    )}
                  </div>
                }
                accent={borderColor}
              />
            )}

            {/* 財務指標 */}
            {structured.financialMetrics &&
              Object.values(structured.financialMetrics).some(v => v !== null && v !== undefined) && (
                <DetailBlock
                  title="💹 財務指標"
                  content={
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {structured.financialMetrics.PER !== null && structured.financialMetrics.PER !== undefined && (
                        <div>PER: {structured.financialMetrics.PER.toFixed(2)}倍</div>
                      )}
                      {structured.financialMetrics.PBR !== null && structured.financialMetrics.PBR !== undefined && (
                        <div>PBR: {structured.financialMetrics.PBR.toFixed(2)}倍</div>
                      )}
                      {structured.financialMetrics.ROE !== null && structured.financialMetrics.ROE !== undefined && (
                        <div>ROE: {structured.financialMetrics.ROE.toFixed(2)}%</div>
                      )}
                      {structured.financialMetrics.配当利回り !== null && structured.financialMetrics.配当利回り !== undefined && (
                        <div>配当利回り: {structured.financialMetrics.配当利回り.toFixed(2)}%</div>
                      )}
                    </div>
                  }
                  accent={borderColor}
                />
              )}

            {/* テクニカル指標 */}
            {structured.technicalMetrics &&
              Object.values(structured.technicalMetrics).some(v => v !== null && v !== undefined) && (
                <DetailBlock
                  title="📊 テクニカル指標"
                  content={
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {structured.technicalMetrics.MA25 !== null && structured.technicalMetrics.MA25 !== undefined && (
                        <div>MA25: {structured.technicalMetrics.MA25.toFixed(2)}円</div>
                      )}
                      {structured.technicalMetrics.MA75 !== null && structured.technicalMetrics.MA75 !== undefined && (
                        <div>MA75: {structured.technicalMetrics.MA75.toFixed(2)}円</div>
                      )}
                      {structured.technicalMetrics.MA200 !== null && structured.technicalMetrics.MA200 !== undefined && (
                        <div>MA200: {structured.technicalMetrics.MA200.toFixed(2)}円</div>
                      )}
                      {structured.technicalMetrics.RSI !== null && structured.technicalMetrics.RSI !== undefined && (
                        <div>RSI: {structured.technicalMetrics.RSI.toFixed(1)}</div>
                      )}
                    </div>
                  }
                  accent={borderColor}
                />
              )}

            {/* 目標株価・投資期間 */}
            {(structured.targetRange || structured.horizon) && (
              <DetailBlock
                title="🎯 投資目標"
                content={
                  <div className="space-y-1 text-xs">
                    {structured.targetRange && <p>目標株価: {structured.targetRange}</p>}
                    {structured.horizon && <p>投資期間: {structured.horizon}</p>}
                  </div>
                }
                accent={borderColor}
              />
            )}

            {/* リスク要因 */}
            {structured.risks && (
              <DetailBlock
                title="⚠️ リスク要因"
                content={<p className="text-xs text-[#d64545] leading-relaxed">{structured.risks}</p>}
                accent={borderColor}
              />
            )}
          </div>
        </>
      )}
    </article>
  );
}

function DetailBlock({
  title,
  content,
  accent,
}: {
  title: string;
  content: React.ReactNode;
  accent: string;
}) {
  return (
    <section className="ukiyoe-info-block bg-[#fff8dc]/80 p-3" aria-label={title}>
      <h5
        className="text-xs font-semibold mb-2"
        style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "0.5rem" }}
      >
        {title}
      </h5>
      <div className="text-[#333333]">{content}</div>
    </section>
  );
}
