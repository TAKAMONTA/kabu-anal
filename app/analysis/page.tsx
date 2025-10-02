"use client";

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Decision = "買い" | "売り" | "保留";

interface StructuredFields {
  price?: {
    current?: string;
    range?: string;
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
}

export default function AnalysisPage() {
  const [stockCode, setStockCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!stockCode.trim()) {
      setError("銘柄コードを入力してください");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCode: stockCode.trim() }),
      });

      if (!response.ok) {
        throw new Error("分析に失敗しました");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期しないエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const recommendationBadgeClass = useMemo(() => {
    if (!analysis) return "ukiyoe-badge ukiyoe-badge-hold";
    switch (analysis.finalJudgement.decision) {
      case "買い":
        return "ukiyoe-badge ukiyoe-badge-buy";
      case "売り":
        return "ukiyoe-badge ukiyoe-badge-sell";
      default:
        return "ukiyoe-badge ukiyoe-badge-hold";
    }
  }, [analysis]);

  return (
    <main className="ukiyoe-layout">
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
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
                onChange={e => setStockCode(e.target.value)}
                placeholder="銘柄コード (例: 7203)"
                className="ukiyoe-input w-full text-lg"
                disabled={loading}
                aria-label="分析したい銘柄コード"
              />
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
            <div className="mt-4 rounded-2xl border-2 border-[#d64545] bg-[#d64545]/10 p-4 text-[#8b0000]">
              {error}
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

        {loading && (
          <div className="mt-10 rounded-3xl border-[3px] border-[#2e4057] bg-[#fff8dc]/90 p-10 text-center">
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-[#2e4057]/50 border-t-[#d4af37]" />
            <p className="text-[#2e4057]">三賢人が市場を調査中です...</p>
          </div>
        )}

        {analysis && (
          <section className="mt-10 space-y-8">
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
                    <span className={recommendationBadgeClass}>
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

            <div className="ukiyoe-card-grid">
              <AIAnalysisCard
                title="Gemini 賢人"
                subtitle="📈 テクニカル分析"
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
      badgeClass: "ukiyoe-badge-buy",
    },
    claude: {
      borderColor: "#d4af37",
      gradient: "linear-gradient(to bottom, #fff3e0, #fff8dc)",
      badgeClass: "ukiyoe-badge-hold",
    },
    openai: {
      borderColor: "#2e4057",
      gradient: "linear-gradient(to bottom, #e3f2fd, #fff8dc)",
      badgeClass: "ukiyoe-badge-hold",
    },
  } as const;

  const { borderColor, gradient } = themeStyles[theme];
  const structured = analysis.structured;

  return (
    <article
      className="ukiyoe-card ukiyoe-card-shadow"
      style={{ borderColor, background: gradient }}
    >
      <header className="ukiyoe-card-header">
        <div className="flex items-center gap-3 text-[#2e4057]">
          <span className="text-2xl" aria-hidden="true">
            {theme === "gemini" ? "🟢" : theme === "claude" ? "🟡" : "🔵"}
          </span>
          <div>
            <h3 className="text-xl font-semibold tracking-wide">{title}</h3>
            {subtitle && <p className="text-sm text-[#666666]">{subtitle}</p>}
          </div>
        </div>
      </header>

      <section className="ukiyoe-card-section" aria-label="推奨">
        <h4 style={{ color: borderColor }}>推奨の見立て</h4>
        <p className="text-lg font-bold text-[#2c2c2c]">
          {analysis.recommendation}
        </p>
        <p className="mt-2 text-sm text-[#555555]">{analysis.analysis}</p>
      </section>

      <div className="ukiyoe-divider" />

      <div className="ukiyoe-grid-2">
        <DetailBlock
          title="📊 株価情報"
          content={
            structured?.price ? (
              <ul>
                {structured.price.current && (
                  <li>現在値: {structured.price.current}</li>
                )}
                {structured.price.range && (
                  <li>目標: {structured.price.range}</li>
                )}
              </ul>
            ) : (
              <p>最新の株価情報を分析中です。</p>
            )
          }
          accent={borderColor}
        />
        <DetailBlock
          title="📈 トレンド分析"
          content={
            structured?.trend ? (
              <p>{structured.trend}</p>
            ) : (
              <p>市況トレンドを解析中です。</p>
            )
          }
          accent={borderColor}
        />
        <DetailBlock
          title="💰 ファンダメンタル"
          content={
            structured?.fundamentals ? (
              <p>{structured.fundamentals}</p>
            ) : (
              <p>財務・指標を整理しています。</p>
            )
          }
          accent={borderColor}
        />
        <DetailBlock
          title="⚖️ 投資判断の根拠"
          content={
            structured?.rationale ? (
              <p>{structured.rationale}</p>
            ) : (
              <p>投資判断の根拠を集約しています。</p>
            )
          }
          accent={borderColor}
        />
        <DetailBlock
          title="⚠️ リスク要因"
          content={
            structured?.risks ? (
              <p>{structured.risks}</p>
            ) : (
              <p>懸念事項を抽出しています。</p>
            )
          }
          accent={borderColor}
        />
        <DetailBlock
          title="🎯 目標株価レンジ"
          content={
            structured?.targetRange ? (
              <p>{structured.targetRange}</p>
            ) : (
              <p>目標レンジを推定中です。</p>
            )
          }
          accent={borderColor}
        />
        <DetailBlock
          title="📅 時間軸"
          content={
            structured?.horizon ? (
              <p>{structured.horizon}</p>
            ) : (
              <p>投資の時間軸を設定しています。</p>
            )
          }
          accent={borderColor}
        />
      </div>

      <footer className="mt-6">
        <p className="ukiyoe-confidence">
          信頼度 {(analysis.confidence * 100).toFixed(0)}%
        </p>
      </footer>
    </article>
  );
}

function DetailBlock({
  title,
  content,
  accent,
}: {
  title: string;
  content: ReactNode;
  accent: string;
}) {
  return (
    <section className="ukiyoe-info-block bg-[#fff8dc]/80" aria-label={title}>
      <h5 style={{ borderLeft: `4px solid ${accent}`, paddingLeft: "0.75rem" }}>
        {title}
      </h5>
      <div className="mt-2 text-sm text-[#333333]">{content}</div>
    </section>
  );
}
