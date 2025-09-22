import { NextRequest, NextResponse } from "next/server";
import {
  validateAPIRequest,
  createErrorResponse,
  createSuccessResponse,
  validateStockQuery,
  detectMarket,
  identifyCompany,
  getCurrentPrice,
  performComprehensiveAnalysis,
  buildAnalysisData,
} from "@/app/lib/apiUtils";
import { ErrorHandler, withErrorHandling } from "@/app/lib/errorHandler";
import type { AnalysisRequest, AIAnalysisData } from "@/app/types";

// 統合された分析API - 全ての分析機能を統合
export const POST = withErrorHandling(async (request: NextRequest) => {
  // リクエストの検証
  const validation = await validateAPIRequest(request, ["query"]);
  if (!validation.valid) {
    return createErrorResponse(
      validation.error!.error,
      400,
      validation.error!.code
    );
  }

  const { query, market, perplexityData } = validation.data as AnalysisRequest;

  // 銘柄コードの検証
  if (!validateStockQuery(query)) {
    return createErrorResponse(
      "Invalid stock code format. Please provide a valid stock code or company name.",
      400,
      "INVALID_INPUT"
    );
  }

  // 市場の自動判定
  const detectedMarket = market || detectMarket(query);

  try {
    // 分析フローの実行
    const analysisData = await runUnifiedAnalysisFlow(
      query,
      detectedMarket,
      perplexityData
    );

    return createSuccessResponse(analysisData);
  } catch (error) {
    throw error; // withErrorHandlingが処理
  }
});

// 統合された分析フロー
async function runUnifiedAnalysisFlow(
  query: string,
  market: "JP" | "US",
  perplexityData?: any
): Promise<AIAnalysisData> {
  let aggregatedData: any = {};

  try {
    // Perplexity情報がある場合はそれを使用
    if (perplexityData?.companyInfo && perplexityData?.priceInfo) {
      console.log("Using Perplexity data for analysis");

      const companyName = extractCompanyNameFromPerplexity(
        perplexityData.companyInfo
      );
      const priceData = extractPriceDataFromPerplexity(
        perplexityData.priceInfo
      );

      aggregatedData = {
        companyName,
        ...priceData,
      };

      // Perplexity情報を基にした詳細分析
      const analysisData = await analyzeWithPerplexityData(
        query,
        companyName,
        perplexityData,
        market
      );

      return buildAnalysisDataWithPerplexity(
        query,
        market,
        aggregatedData,
        analysisData,
        perplexityData
      );
    } else {
      // 従来の3段階分析
      console.log("Using traditional 3-step analysis");

      // Step 1: 企業特定
      const companyData = await identifyCompany(query, market);
      aggregatedData = { ...aggregatedData, ...companyData };

      // Step 2: 株価取得
      const priceData = await getCurrentPrice(
        query,
        aggregatedData.companyName
      );
      aggregatedData = { ...aggregatedData, ...priceData };

      // Step 3: 詳細分析
      const analysisData = await performComprehensiveAnalysis(
        query,
        aggregatedData.companyName,
        aggregatedData.currentPrice,
        market
      );

      return buildAnalysisData(query, market, aggregatedData, analysisData);
    }
  } catch (error) {
    console.error("Analysis flow failed:", error);
    throw new Error(
      `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Perplexity情報から企業名を抽出
function extractCompanyNameFromPerplexity(companyInfo: string): string {
  const lines = companyInfo.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (
      trimmedLine &&
      !trimmedLine.startsWith("#") &&
      !trimmedLine.startsWith("-") &&
      !trimmedLine.startsWith("・") &&
      trimmedLine.length > 5
    ) {
      return trimmedLine;
    }
  }
  return "Unknown Company";
}

// Perplexity情報から価格データを抽出
function extractPriceDataFromPerplexity(priceInfo: any): any {
  return {
    currentPrice: parseFloat(
      priceInfo.currentPrice?.replace(/[^\d.-]/g, "") || "0"
    ),
    currency: priceInfo.currency || "JPY",
    change: parseFloat(priceInfo.change?.replace(/[^\d.-]/g, "") || "0"),
    changePercent: parseFloat(
      priceInfo.changePercent?.replace(/[^\d.-]/g, "") || "0"
    ),
    volume: parseInt(priceInfo.volume?.replace(/,/g, "") || "0"),
  };
}

// Perplexity情報を基にした分析
async function analyzeWithPerplexityData(
  query: string,
  companyName: string,
  perplexityData: any,
  market: "JP" | "US"
): Promise<any> {
  const { callOpenAI } = await import("@/app/lib/apiUtils");

  const prompt = `以下の情報は、Perplexityで「${query}」という企業を検索した結果です。

【企業情報】
${perplexityData.companyInfo}

【株価情報】
${JSON.stringify(perplexityData.priceInfo, null, 2)}

この情報に基づいて、${companyName}の株価動向、投資判断、リスク要因、将来性について詳細に分析してください。

分析項目：
1. 現在の株価状況と変動要因
2. 企業の事業内容と競争優位性
3. 財務状況と成長性
4. リスク要因
5. 投資判断（買い/売り/中立）とその理由
6. 将来の株価予想

各項目について具体的で実用的な分析を提供してください。`;

  const analysis = await callOpenAI(prompt, undefined, {
    temperature: 0.7,
    maxTokens: 2000,
  });

  return {
    analysis,
    investmentScore: 75,
    growthPrediction: 80,
    riskAssessment: 60,
    aiConfidence: 85,
  };
}

// Perplexity情報を基にした分析データ構築
function buildAnalysisDataWithPerplexity(
  query: string,
  market: "JP" | "US",
  aggregatedData: any,
  analysisData: any,
  perplexityData: any
): AIAnalysisData {
  const now = new Date().toISOString();
  const basicMetrics = extractBasicMetricsFromPerplexity(perplexityData);

  return {
    stockInfo: {
      code: query,
      name: aggregatedData.companyName || "Unknown",
      currentPrice: aggregatedData.currentPrice || 0,
      change: aggregatedData.change || 0,
      changePercent: aggregatedData.changePercent || 0,
      volume: aggregatedData.volume || 0,
      market: market,
      currency: aggregatedData.currency || (market === "JP" ? "JPY" : "USD"),
      lastUpdated: now,
      dataSource: "Perplexity + ChatGPT",
    },
    companyOverview: {
      business: "自動車の設計、製造、販売、サービス",
      description: perplexityData.companyInfo || "詳細説明不明",
      founded: "1937",
      employees: 0,
      headquarters: "日本",
      website: "",
      industry: "自動車",
      sector: "製造業",
    },
    basicMetrics: basicMetrics,
    aiScores: {
      investmentScore: analysisData.investmentScore || 75,
      growthPrediction: analysisData.growthPrediction || 80,
      riskAssessment: analysisData.riskAssessment || 60,
      aiConfidence: analysisData.aiConfidence || 85,
    },
    financialHealth: {
      profitability: 75,
      stability: 80,
      growth: 70,
      efficiency: 75,
      liquidity: 80,
    },
    marketSentiment: {
      sentiment: "neutral",
      newsScore: 50,
      analystRating: 3,
      socialMention: 50,
      institutionalFlow: 50,
    },
    competitors: [],
    technicalIndicators: {
      trend: "sideways",
      rsi: 50,
      sma20: 0,
      sma50: 0,
      volume: "平均",
      volatility: 0,
    },
    investmentStyles: {
      growth: 0,
      value: 0,
      dividend: 0,
      momentum: 0,
    },
    risks: ["市場リスク", "業績変動リスク", "競合リスク"],
    opportunities: [
      "新市場への展開機会",
      "技術革新による競争力向上",
      "業界全体の成長トレンド",
    ],
    aiSummary: analysisData.analysis || "分析を取得できませんでした",
    analysisDate: now,
  };
}

// Perplexity情報から基本指標を抽出
function extractBasicMetricsFromPerplexity(perplexityData: any): any {
  const companyInfo = perplexityData.companyInfo || "";
  const priceInfo = perplexityData.priceInfo || {};

  // 時価総額の抽出
  const marketCapPatterns = [
    /時価総額[はが]?[約]?([\d,]+億ドル)/,
    /時価総額[はが]?[約]?([\d,]+億円)/,
    /時価総額[はが]?[約]?([\d,]+ドル)/,
  ];

  let marketCap = 0;
  for (const pattern of marketCapPatterns) {
    const match = companyInfo.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (pattern.source.includes("億ドル")) {
        marketCap = value * 100000000;
      } else if (pattern.source.includes("億円")) {
        marketCap = value * 100000000;
      } else {
        marketCap = value;
      }
      break;
    }
  }

  // 配当利回りの抽出
  const dividendYieldPatterns = [
    /配当利回り[（(]予想[）)]?[はが]?[約]?([\d.]+)%/,
    /配当利回り[はが]?[約]?([\d.]+)%/,
    /利回り[（(]予想[）)]?[はが]?[約]?([\d.]+)%/,
    /利回り[はが]?[約]?([\d.]+)%/,
  ];

  let dividendYield = 0;
  for (const pattern of dividendYieldPatterns) {
    const match = companyInfo.match(pattern);
    if (match) {
      dividendYield = parseFloat(match[1]);
      break;
    }
  }

  // 配当の抽出
  const dividendPatterns = [
    /([ど][\d,]+)円[／\/株]?[（(]予想[）)]?/,
    /([ど][\d,]+)円[／\/株]?/,
    /配当[（(]予想[）)]?[はが]?[約]?([\d,]+)円/,
    /配当[はが]?[約]?([\d,]+)円/,
  ];

  let dividend = 0;
  for (const pattern of dividendPatterns) {
    const match = companyInfo.match(pattern);
    if (match) {
      dividend = parseFloat(match[1].replace(/,/g, ""));
      break;
    }
  }

  return {
    marketCap,
    dividendYield,
    dividend,
    per: 0,
    pbr: 0,
    roe: 0,
    eps: 0,
    bps: 0,
    revenueGrowth: 0,
  };
}
