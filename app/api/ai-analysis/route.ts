import { NextRequest, NextResponse } from "next/server";
import openai from "@/app/lib/openai";
import { checkRateLimit } from "@/app/lib/rateLimiter";

// APIルートハンドラー（段階的分析）
export async function POST(request: NextRequest) {
  try {
    // レート制限チェック（IPアドレスまたはユーザーIDベース）
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = checkRateLimit(clientId);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "リクエスト制限に達しました",
          message: `${rateLimit.resetIn}秒後に再試行してください`,
          resetIn: rateLimit.resetIn 
        },
        { status: 429 }
      );
    }

    const { stockCode, market, step, previousData } = await request.json();

    // 入力検証
    if (!stockCode || !market || !step) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    // ステップに応じた処理
    switch (step) {
      case 1: // 企業特定
        return await identifyCompany(stockCode, market);

      case 2: // 株価取得
        if (!previousData?.companyName) {
          return NextResponse.json(
            { error: "企業名が必要です" },
            { status: 400 }
          );
        }
        return await getCurrentPrice(stockCode, previousData.companyName);

      case 3: // 詳細分析
        if (!previousData?.companyName || !previousData?.currentPrice) {
          return NextResponse.json(
            { error: "企業名と株価が必要です" },
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
          { error: "無効なステップです" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("AI分析エラー:", error);
    return NextResponse.json(
      { error: "AI分析の処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// ステップ1: 企業を特定
async function identifyCompany(stockCode: string, market: string) {
  const prompt =
    market === "JP"
      ? `証券コード${stockCode}の企業はどこですか？正式な企業名を教えてください。簡潔に企業名のみ答えてください。`
      : `ティッカーシンボル${stockCode}の企業はどこですか？正式な企業名を教えてください。簡潔に企業名のみ答えてください。`;

  // OpenAI SDKを使用
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    const companyName = completion.choices[0].message.content || "不明な企業";
    return NextResponse.json({ companyName, step: 1 });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "AI分析サービスに接続できませんでした" },
      { status: 500 }
    );
  }
}

// ステップ2: 現在の株価を取得（ChatGPTに聞く）
async function getCurrentPrice(stockCode: string, companyName: string) {
  const prompt = `${companyName}（${stockCode}）について、投資分析の観点から教えてください。
現在の株価の推定値と、最近の市場動向を簡潔に教えてください。
注意：実際の投資判断には最新の市場データを確認してください。
回答例：推定株価3,285円、最近は上昇傾向`;

  // OpenAI SDKを使用
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content || "";
    // レスポンスから株価と変動率を抽出
    const priceInfo = extractPriceFromText(response);
    return NextResponse.json({ ...priceInfo, step: 2 });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "株価情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// ステップ3: 詳細な分析を実行
async function analyzeStock(
  stockCode: string,
  companyName: string,
  currentPrice: number,
  market: string
) {
  const prompt = `
あなたは株式投資の専門アナリストです。${companyName}（${stockCode}）について、ChatGPTの知識を基に詳細な投資分析を行ってください。

【重要】実際の投資判断には最新の市場データの確認が必要です。この分析は参考情報として提供されます。

【分析対象】
銘柄コード: ${stockCode}
企業名: ${companyName}
参考株価: ${currentPrice}円
市場: ${market === "JP" ? "日本株" : "米国株"}

【分析要求】
1. 企業の事業内容と競争優位性を分析してください
2. 財務健全性について一般的な業界水準と比較して評価してください
3. 成長性と将来性について評価してください
4. 主要なリスクと機会を特定してください
5. 投資判断の参考となる総合評価を提供してください

【分析項目と出力形式】
以下のJSON形式で厳密に出力してください。数値は推定値で構いません。

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
    "business": "企業の主要事業",
    "description": "企業の詳細説明",
    "founded": "設立年",
    "employees": 0,
    "headquarters": "本社所在地",
    "website": "企業サイト",
    "industry": "業種",
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
      "name": "競合企業名",
      "score": 0,
      "change": 0
    }
  ],
  "technicalIndicators": {
    "trend": "sideways",
    "rsi": 0,
    "sma20": 0,
    "sma50": 0,
    "volume": "標準",
    "volatility": 0
  },
  "investmentStyles": {
    "growth": 0,
    "value": 0,
    "dividend": 0,
    "momentum": 0,
    "quality": 0
  },
  "risks": ["リスク項目1", "リスク項目2"],
  "opportunities": ["機会項目1", "機会項目2"],
  "aiSummary": "AIによる総合的な投資判断の要約"
}
`;

  // OpenAI SDKを使用 (JSON mode)
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "あなたは株式投資の専門アナリストです。JSON形式で正確に回答してください。実際の財務データが不明な場合は、業界平均や一般的な推定値を使用してください。",
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
    return NextResponse.json(
      { error: "AI分析の実行に失敗しました" },
      { status: 500 }
    );
  }
}

// 価格情報をテキストから抽出する補助関数
function extractPriceFromText(text: string): {
  currentPrice: number;
  changePercent: number;
} {
  // テキストから数値を抽出する正規表現
  const priceMatch = text.match(/([0-9,]+(?:\.[0-9]+)?)\s*円/);
  const changeMatch = text.match(/([+-]?[0-9]+(?:\.[0-9]+)?)\s*%/);

  return {
    currentPrice: priceMatch ? parseFloat(priceMatch[1].replace(",", "")) : 0,
    changePercent: changeMatch ? parseFloat(changeMatch[1]) : 0,
  };
}

