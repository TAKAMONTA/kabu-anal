import { NextRequest, NextResponse } from "next/server";
import openai from "@/app/lib/openai";
import { checkRateLimit } from "@/app/lib/rateLimiter";

// API rate limit check and main function
export async function POST(request: NextRequest) {
  try {
    // Get client IP from headers or use anonymous
    const clientId = request.headers.get("x-forwarded-for") || "anonymous";
    const rateLimit = checkRateLimit(clientId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Please try again in ${rateLimit.resetIn} seconds`,
          resetIn: rateLimit.resetIn,
        },
        { status: 429 }
      );
    }

    const { stockCode, market, step, previousData } = await request.json();

    // Input validation
    if (!stockCode || !market || !step) {
      return NextResponse.json(
        { error: "Required parameters are missing" },
        { status: 400 }
      );
    }

    // Step-based processing
    switch (step) {
      case 1: // Company identification
        return await identifyCompany(stockCode, market);

      case 2: // Current price retrieval
        if (!previousData?.companyName) {
          return NextResponse.json(
            { error: "Company name is missing" },
            { status: 400 }
          );
        }
        return await getCurrentPrice(stockCode, previousData.companyName);

      case 3: // Stock analysis
        if (!previousData?.companyName || !previousData?.currentPrice) {
          return NextResponse.json(
            { error: "Company name or current price is missing" },
            { status: 400 }
          );
        }
        return await analyzeStock(
          stockCode,
          previousData.companyName,
          previousData.currentPrice,
          market
        );

      default:
        return NextResponse.json(
          { error: "Invalid step number" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "AI analysis processing failed" },
      { status: 500 }
    );
  }
}

// Step 1: Company identification
async function identifyCompany(stockCode: string, market: string) {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key is not configured");
    return NextResponse.json(
      { error: "AI service configuration error" },
      { status: 500 }
    );
  }

  const prompt =
    market === "JP"
      ? `日本株コード${stockCode}の会社は何ですか？会社名のみを回答してください。`
      : `米国株コード${stockCode}の会社は何ですか？会社名のみを回答してください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    const companyName =
      completion.choices[0].message.content || "Unknown company";
    return NextResponse.json({ companyName, step: 1 });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "AI analysis service unavailable" },
      { status: 500 }
    );
  }
}

// Step 2: Get current price using ChatGPT
async function getCurrentPrice(stockCode: string, companyName: string) {
  const prompt = `${companyName}（${stockCode}）の現在の株価を教えてください。株価の数値と、前日比の変化率を教えてください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content || "";
    // Extract price and change from response
    const priceInfo = extractPriceFromText(response);
    return NextResponse.json({ ...priceInfo, step: 2 });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Price retrieval failed" },
      { status: 500 }
    );
  }
}

// Step 3: Comprehensive stock analysis
async function analyzeStock(
  stockCode: string,
  companyName: string,
  currentPrice: number,
  market: string
) {
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

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "あなたは株価分析の専門家です。JSON形式で回答し、適切な数値範囲で設定してください。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const analysisResult = JSON.parse(content);
    return NextResponse.json({ ...analysisResult, step: 3 });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}

// Helper function to extract price information from text
function extractPriceFromText(text: string): {
  currentPrice: number;
  changePercent: number;
} {
  // Simple regex to extract price and change percentage
  const priceMatch = text.match(/([0-9,]+(?:\.[0-9]+)?)\s*円/);
  const changeMatch = text.match(/([+-]?[0-9]+(?:\.[0-9]+)?)\s*%/);

  return {
    currentPrice: priceMatch ? parseFloat(priceMatch[1].replace(",", "")) : 0,
    changePercent: changeMatch ? parseFloat(changeMatch[1]) : 0,
  };
}
