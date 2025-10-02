import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger, logAIRequest, logAIResponse, logApiError } from "@/app/lib/logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface AIResponse {
  analysis: string;
  recommendation: Decision;
  confidence: number;
  structured?: StructuredAnalysis;
}

type Decision = "買い" | "売り" | "保留";

interface StructuredAnalysis {
  summary?: string;
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

export async function POST(request: NextRequest) {
  try {
    const { stockCode } = await request.json();

    if (!stockCode || typeof stockCode !== "string") {
      return NextResponse.json(
        { error: "銘柄コードが必要です" },
        { status: 400 }
      );
    }

    // 各AIに専門的な役割を割り当て
    const geminiPrompt = createPrompt({
      role: "テクニカル分析担当",
      stockCode,
      focus: [
        "現在のトレンド（上昇/下降/横ばい）",
        "移動平均線との位置関係（25日、75日、200日線）",
        "サポート/レジスタンスライン",
        "出来高トレンド",
        "テクニカル指標（RSI、MACD等)",
      ],
    });

    const claudePrompt = createPrompt({
      role: "ファンダメンタル分析担当",
      stockCode,
      focus: [
        "最新決算の状況（売上、利益、成長率）",
        "財務健全性（自己資本比率、ROE、ROA）",
        "バリュエーション（PER、PBR、配当利回り）",
        "業界動向と競合比較",
        "将来性とリスク要因",
      ],
    });

    const openaiPrompt = createPrompt({
      role: "総合分析担当",
      stockCode,
      focus: [
        "市場全体の環境",
        "企業の強み・弱み",
        "短期/中期/長期の見通し",
        "投資判断（買い/売り/保留）とその根拠",
        "推奨価格レンジ",
        "注意すべきリスク",
      ],
    });

    // 並列でAI分析を実行
    const [openaiResult, claudeResult, geminiResult] = await Promise.all([
      analyzeWithOpenAI(openaiPrompt),
      analyzeWithClaude(claudePrompt),
      analyzeWithGemini(geminiPrompt),
    ]);

    // 最終判断を生成
    const finalJudgement = generateFinalJudgement(
      openaiResult,
      claudeResult,
      geminiResult
    );

    return NextResponse.json({
      stockCode,
      timestamp: new Date().toISOString(),
      openai: openaiResult,
      claude: claudeResult,
      gemini: geminiResult,
      finalJudgement,
    });
  } catch (error) {
    logApiError("POST", "/api/orchestrator", error);
    return NextResponse.json(
      { error: "分析中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

async function analyzeWithOpenAI(prompt: string): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    logAIRequest("OpenAI", "chat.completions", { model: "gpt-4o-mini" });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content =
      completion.choices[0]?.message?.content || "分析できませんでした";

    const duration = Date.now() - startTime;
    logAIResponse("OpenAI", "chat.completions", true, duration);
    return createAIResponse(content, 0.8);
  } catch {
    const duration = Date.now() - startTime;
    logAIResponse("OpenAI", "chat.completions", false, duration);
    return {
      analysis: "OpenAI分析でエラーが発生しました",
      recommendation: "保留",
      confidence: 0,
    };
  }
}

async function analyzeWithClaude(prompt: string): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    logAIRequest("Claude", "messages.create", { model: "claude-3-5-sonnet-20241022" });
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const content =
      message.content[0]?.type === "text"
        ? message.content[0].text
        : "分析できませんでした";

    const duration = Date.now() - startTime;
    logAIResponse("Claude", "messages.create", true, duration);
    return createAIResponse(content, 0.85);
  } catch {
    const duration = Date.now() - startTime;
    logAIResponse("Claude", "messages.create", false, duration);
    return {
      analysis: "Claude分析でエラーが発生しました",
      recommendation: "保留",
      confidence: 0,
    };
  }
}

async function analyzeWithGemini(prompt: string): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    logAIRequest("Gemini", "generateContent", { model: "gemini-2.5-flash" });
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const content = result.response.text() || "分析できませんでした";

    const duration = Date.now() - startTime;
    logAIResponse("Gemini", "generateContent", true, duration);
    return createAIResponse(content, 0.75);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logAIResponse("Gemini", "generateContent", false, duration);
    return {
      analysis: `Gemini分析でエラーが発生しました: ${errorMessage}`,
      recommendation: "保留",
      confidence: 0,
    };
  }
}

function extractRecommendation(text: string): Decision {
  if (text.includes("買い") || text.includes("購入")) return "買い";
  if (text.includes("売り") || text.includes("売却")) return "売り";
  if (text.includes("保留") || text.includes("中立") || text.includes("様子見"))
    return "保留";
  return "保留";
}

function generateFinalJudgement(
  openai: AIResponse,
  claude: AIResponse,
  gemini: AIResponse
): {
  decision: "買い" | "売り" | "保留";
  reasoning: string;
  confidence: number;
} {
  const recommendations = [
    openai.recommendation,
    claude.recommendation,
    gemini.recommendation,
  ];

  const buyCount = recommendations.filter(r => r === "買い").length;
  const sellCount = recommendations.filter(r => r === "売り").length;

  let decision: "買い" | "売り" | "保留";
  let reasoning: string;
  let confidence: number;

  if (buyCount >= 2) {
    decision = "買い";
    reasoning = `3つのAIのうち${buyCount}つが買いを推奨しています。`;
    confidence =
      (openai.confidence + claude.confidence + gemini.confidence) / 3;
  } else if (sellCount >= 2) {
    decision = "売り";
    reasoning = `3つのAIのうち${sellCount}つが売りを推奨しています。`;
    confidence =
      (openai.confidence + claude.confidence + gemini.confidence) / 3;
  } else {
    decision = "保留";
    reasoning = "AI間で意見が分かれています。慎重な判断が必要です。";
    confidence = 0.5;
  }

  return { decision, reasoning, confidence };
}

function createPrompt({
  role,
  stockCode,
  focus,
}: {
  role: string;
  stockCode: string;
  focus: string[];
}) {
  return `あなたは${role}の専門家です。日本株式銘柄コード${stockCode}について、以下の観点を考慮して分析してください。

${focus.map((item, index) => `${index + 1}. ${item}`).join("\n")}

以下のJSON形式のみで日本語で出力してください。説明文や前後のコメントは一切不要です。
{
  "summary": "主要な結論を120文字以内で要約",
  "recommendation": "買い/売り/保留のいずれか",
  "confidence": 0から1の小数 (0.0〜1.0),
  "price": {
    "current": "現在値（例: 3,750円）",
    "range": "目標価格レンジ（例: 3,450円〜3,900円）"
  },
  "trend": "トレンドや移動平均・出来高の要約",
  "fundamentals": "財務・バリュエーション等の要約",
  "rationale": "推奨の根拠 (80文字以内)",
  "risks": "主要なリスク (80文字以内)",
  "targetRange": "目標株価レンジ",
  "horizon": "想定する投資期間（短期/中期/長期など）"
}

未知の項目はnullではなく空文字列で記載してください。`;
}

function createAIResponse(
  content: string,
  fallbackConfidence: number
): AIResponse {
  const parsed = parseStructuredResponse(content, fallbackConfidence);
  if (parsed) {
    return parsed;
  }

  return {
    analysis: content,
    recommendation: extractRecommendation(content),
    confidence: fallbackConfidence,
  };
}

function parseStructuredResponse(
  content: string,
  fallbackConfidence: number
): AIResponse | null {
  const jsonString = extractJsonString(content);
  if (!jsonString) return null;

  try {
    const data = JSON.parse(jsonString);
    const summary =
      typeof data.summary === "string" && data.summary.trim().length > 0
        ? data.summary.trim()
        : content;
    const recommendation = normalizeDecision(data.recommendation, content);
    const confidence = normalizeConfidence(data.confidence, fallbackConfidence);

    const structured: StructuredAnalysis = {
      summary,
      price: {
        current: sanitizeString(data.price?.current),
        range: sanitizeString(data.price?.range ?? data.targetRange),
      },
      trend: sanitizeString(data.trend),
      fundamentals: sanitizeString(data.fundamentals),
      rationale: sanitizeString(data.rationale ?? data.reason),
      risks: sanitizeString(data.risks),
      targetRange: sanitizeString(data.targetRange ?? data.price?.target),
      horizon: sanitizeString(data.horizon ?? data.timeframe),
    };

    return {
      analysis: summary,
      recommendation,
      confidence,
      structured,
    };
  } catch (error) {
    logger.warn({ error: error instanceof Error ? error.message : String(error) }, "Failed to parse structured response");
    return null;
  }
}

function extractJsonString(content: string): string | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return content.slice(start, end + 1).trim();
}

function normalizeDecision(value: unknown, fallbackText: string): Decision {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "買い" || trimmed === "買") return "買い";
    if (trimmed === "売り" || trimmed === "売") return "売り";
    if (trimmed === "保留" || trimmed === "中立" || trimmed === "様子見")
      return "保留";
  }
  return extractRecommendation(
    typeof value === "string" ? value : fallbackText
  );
}

function normalizeConfidence(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampConfidence(value);
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return clampConfidence(parsed);
    }
  }
  return fallback;
}

function clampConfidence(value: number): number {
  if (value > 1 && value <= 100) {
    return Math.min(1, Math.max(0, value / 100));
  }
  return Math.min(1, Math.max(0, value));
}

function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
