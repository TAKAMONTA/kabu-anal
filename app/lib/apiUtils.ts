import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./rateLimiter";
import {
  validateRequestBody,
  validateStockCode,
  rateLimitHeaders,
} from "./validation";
import { validateEnvironmentKeys } from "./apiValidation";
import openai from "./openai";

// 共通のAPIエラーレスポンス
export interface APIErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// 共通のAPI成功レスポンス
export interface APISuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

// 統一されたAPIレスポンス型
export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse;

// 共通のリクエスト検証
export async function validateAPIRequest(
  request: NextRequest,
  requiredFields: string[] = []
): Promise<{ valid: boolean; data?: any; error?: APIErrorResponse }> {
  try {
    const body = await request.json();

    // リクエストボディの検証
    const validation = validateRequestBody(body, requiredFields);
    if (!validation.valid) {
      return {
        valid: false,
        error: {
          success: false,
          error: validation.errors.join(", "),
          code: "VALIDATION_ERROR",
        },
      };
    }

    // レート制限チェック
    const clientIP = request.ip || "unknown";
    const rateLimit = checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
      return {
        valid: false,
        error: {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
      };
    }

    // 環境変数チェック
    const envValidation = validateEnvironmentKeys();
    if (!envValidation.valid) {
      return {
        valid: false,
        error: {
          success: false,
          error: "Server configuration error",
          code: "CONFIG_ERROR",
        },
      };
    }

    return { valid: true, data: body };
  } catch (error) {
    return {
      valid: false,
      error: {
        success: false,
        error: "Invalid request format",
        code: "INVALID_REQUEST",
      },
    };
  }
}

// 統一されたエラーレスポンス作成
export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: any
): NextResponse<APIErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details,
    },
    { status }
  );
}

// 統一された成功レスポンス作成
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<APISuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// 銘柄コードの検証（統一版）
export function validateStockQuery(query: string): boolean {
  if (!query || typeof query !== "string") {
    return false;
  }

  const trimmed = query.trim();

  // 4桁の数字（日本株）
  if (/^\d{4}$/.test(trimmed)) {
    return true;
  }

  // 1-5文字のアルファベット（米国株）
  if (/^[A-Z]{1,5}$/i.test(trimmed)) {
    return true;
  }

  // 企業名での検索も許可（日本語、英語、数字、スペース、ハイフン）
  if (
    /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s\-\.]{1,50}$/.test(trimmed)
  ) {
    return true;
  }

  return false;
}

// 市場の自動判定
export function detectMarket(query: string): "JP" | "US" {
  // 4桁の数字なら日本株
  if (/^\d{4}$/.test(query)) {
    return "JP";
  }
  // アルファベットのみなら米国株
  if (/^[A-Z]+$/.test(query.toUpperCase())) {
    return "US";
  }
  // デフォルトは日本株
  return "JP";
}

// OpenAI API呼び出しの統一関数
export async function callOpenAI(
  prompt: string,
  systemPrompt?: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: "json_object" | "text";
  } = {}
): Promise<string> {
  const {
    model = "gpt-4o-mini",
    temperature = 0.3,
    maxTokens = 2000,
    responseFormat = "text",
  } = options;

  const messages: any[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(responseFormat === "json_object" && {
      response_format: { type: "json_object" },
    }),
  });

  return completion.choices[0].message.content || "";
}

// 企業特定の統一関数
export async function identifyCompany(
  query: string,
  market: "JP" | "US"
): Promise<{ companyName: string }> {
  const prompt =
    market === "JP"
      ? `日本株コード${query}の会社は何ですか？会社名のみを回答してください。`
      : `米国株コード${query}の会社は何ですか？会社名のみを回答してください。`;

  const companyName = await callOpenAI(prompt, undefined, { maxTokens: 100 });
  return { companyName: companyName || "Unknown company" };
}

// 株価取得の統一関数
export async function getCurrentPrice(
  query: string,
  companyName: string
): Promise<{ currentPrice: number }> {
  const prompt = `${companyName}（${query}）の現在の株価を教えてください。株価の数値と、前日比の変化率を教えてください。`;

  const response = await callOpenAI(prompt, undefined, { maxTokens: 200 });

  // 価格情報を抽出
  const priceInfo = extractPriceFromText(response);
  return priceInfo;
}

// テキストから価格情報を抽出するヘルパー関数
function extractPriceFromText(text: string): {
  currentPrice: number;
  changePercent: number;
} {
  const priceMatch = text.match(/([0-9,]+(?:\.[0-9]+)?)\s*円/);
  const changeMatch = text.match(/([+-]?[0-9]+(?:\.[0-9]+)?)\s*%/);

  return {
    currentPrice: priceMatch ? parseFloat(priceMatch[1].replace(",", "")) : 0,
    changePercent: changeMatch ? parseFloat(changeMatch[1]) : 0,
  };
}

// 包括的株価分析の統一関数
export async function performComprehensiveAnalysis(
  stockCode: string,
  companyName: string,
  currentPrice: number,
  market: "JP" | "US"
): Promise<any> {
  const prompt = `
以下の株価情報を基に、ChatGPTの分析能力を活用して包括的な投資判断の分析を行ってください。

株コード: ${stockCode}
会社名: ${companyName}
現在価格: ${currentPrice}円
市場: ${market === "JP" ? "日本株" : "米国株"}

分析項目:
1. 会社の基本情報と事業内容を分析してください
2. 業界動向と競合状況を踏まえて評価してください
3. 財務指標と成長性を分析してください
4. 投資リスクと機会を特定してください
5. 投資判断の総合評価を数値化してください

回答形式:
以下のJSON形式で回答してください。数値は適切な範囲で設定してください。
{
  "stockInfo": {
    "code": "${stockCode}",
    "name": "${companyName}",
    "price": ${currentPrice},
    "changePercent": 0,
    "market": "${market}",
    "lastUpdated": "${new Date().toLocaleString("ja-JP")}"
  },
  "companyOverview": {
    "business": "会社の事業内容",
    "description": "会社の詳細説明",
    "founded": "設立年",
    "employees": 0,
    "headquarters": "本社所在地",
    "website": "会社URL",
    "industry": "業界",
    "sector": "セクター"
  },
  "basicMetrics": {
    "dividend": 0,
    "dividendYield": 0,
    "per": 0,
    "pbr": 0,
    "roe": 0,
    "eps": 0,
    "bps": 0,
    "marketCap": 0
  },
  "aiScores": {
    "investmentScore": 0,
    "growthPrediction": 0,
    "riskAssessment": 0,
    "aiConfidence": 0
  },
  "financialHealth": {
    "profitability": 0,
    "stability": 0,
    "growth": 0,
    "efficiency": 0,
    "liquidity": 0
  },
  "marketSentiment": {
    "sentiment": "neutral",
    "newsScore": 0,
    "analystRating": 0,
    "socialMention": 0,
    "institutionalFlow": 0
  },
  "competitors": [
    {
      "name": "競合会社名",
      "score": 0,
      "change": 0
    }
  ],
  "technicalIndicators": {
    "trend": "sideways",
    "rsi": 0,
    "sma20": 0,
    "sma50": 0,
    "volume": "平均",
    "volatility": 0
  },
  "investmentStyles": {
    "growth": 0,
    "value": 0,
    "dividend": 0,
    "momentum": 0,
    "quality": 0
  },
  "risks": ["リスク要因1", "リスク要因2"],
  "opportunities": ["機会要因1", "機会要因2"],
  "aiSummary": "AIによる包括的な投資判断の分析"
}
`;

  const systemPrompt =
    "あなたは株価分析の専門家です。JSON形式で回答し、適切な数値範囲で設定してください。";

  const response = await callOpenAI(prompt, systemPrompt, {
    temperature: 0.7,
    maxTokens: 4000,
    responseFormat: "json_object",
  });

  return JSON.parse(response);
}

// 分析データの構築
export function buildAnalysisData(
  query: string,
  market: "JP" | "US",
  aggregatedData: any,
  analysisData: any
): any {
  const now = new Date().toISOString();

  return {
    stockInfo: {
      code: query,
      name: aggregatedData.companyName || "Unknown",
      price: aggregatedData.currentPrice || 0,
      change: 0,
      changePercent: aggregatedData.changePercent || 0,
      market: market,
      currency: market === "JP" ? "JPY" : "USD",
      lastUpdated: now,
      dataSource: "AI Analysis",
    },
    companyOverview: analysisData.companyOverview || {
      business: "事業内容不明",
      description: "詳細説明不明",
      founded: "不明",
      employees: 0,
      headquarters: "不明",
      website: "",
      industry: "不明",
      sector: "不明",
    },
    basicMetrics: analysisData.basicMetrics || {
      dividend: 0,
      dividendYield: 0,
      per: 0,
      pbr: 0,
      roe: 0,
      eps: 0,
      bps: 0,
      marketCap: 0,
    },
    aiScores: analysisData.aiScores || {
      investmentScore: 0,
      growthPrediction: 0,
      riskAssessment: 0,
      aiConfidence: 0,
    },
    financialHealth: analysisData.financialHealth || {
      profitability: 0,
      stability: 0,
      growth: 0,
      efficiency: 0,
      liquidity: 0,
    },
    marketSentiment: analysisData.marketSentiment || {
      sentiment: "neutral",
      newsScore: 0,
      analystRating: 0,
      socialMention: 0,
      institutionalFlow: 0,
    },
    competitors: analysisData.competitors || [],
    technicalIndicators: analysisData.technicalIndicators || {
      trend: "sideways",
      rsi: 0,
      sma20: 0,
      sma50: 0,
      volume: "平均",
      volatility: 0,
    },
    investmentStyles: analysisData.investmentStyles || {
      growth: 0,
      value: 0,
      dividend: 0,
      momentum: 0,
      quality: 0,
    },
    risks: analysisData.risks || [],
    opportunities: analysisData.opportunities || [],
    aiSummary: analysisData.aiSummary || "分析データが不足しています",
    analysisDate: now,
  };
}
