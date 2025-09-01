import { NextRequest, NextResponse } from "next/server";

// APIルートハンドラー（段階的分析）
export async function POST(request: NextRequest) {
  try {
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
      ? `証券コード${stockCode}の企業はどこですか？正式な企業名を教えてください。`
      : `ティッカーシンボル${stockCode}の企業はどこですか？正式な企業名を教えてください。`;

  // OpenAI APIを使用
  try {
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 100,
        }),
      }
    );

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const companyName = data.choices[0].message.content;
    return NextResponse.json({ companyName, step: 1 });
  } catch (error) {
    console.error("OpenAI API error:", error);

    // エラー時はモックデータを使用
    const mockCompanies: Record<string, string> = {
      "7203": "トヨタ自動車株式会社",
      "6758": "ソニーグループ株式会社",
      AAPL: "Apple Inc.",
      MSFT: "Microsoft Corporation",
    };

    return NextResponse.json({
      companyName: mockCompanies[stockCode] || "不明な企業",
      step: 1,
    });
  }
}

// ステップ2: 現在の株価を取得
async function getCurrentPrice(stockCode: string, companyName: string) {
  const prompt = `${companyName}（${stockCode}）の現在の株価を教えてください。前日比の変動率も含めて教えてください。数値のみで回答してください。例：現在株価は3,285円、前日比+2.1%`;

  // OpenAI APIを使用
  try {
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 150,
        }),
      }
    );

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    // レスポンスから株価と変動率を抽出
    const priceInfo = extractPriceFromText(data.choices[0].message.content);
    return NextResponse.json({ ...priceInfo, step: 2 });
  } catch (error) {
    console.error("OpenAI API error:", error);

    // エラー時はモックデータを使用
    const mockPrices: Record<
      string,
      { currentPrice: number; changePercent: number }
    > = {
      "7203": { currentPrice: 3285, changePercent: 2.1 },
      "6758": { currentPrice: 12950, changePercent: 3.8 },
      AAPL: { currentPrice: 27000, changePercent: -1.2 },
      MSFT: { currentPrice: 56000, changePercent: 0.8 },
    };

    return NextResponse.json({
      ...(mockPrices[stockCode] || { currentPrice: 0, changePercent: 0 }),
      step: 2,
    });
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
あなたは株式投資の専門アナリストです。以下の銘柄について、個人投資家向けの詳細な分析カルテを作成してください。

【分析対象】
銘柄コード: ${stockCode}
企業名: ${companyName}
現在株価: ${currentPrice}円
市場: ${market === "JP" ? "日本株" : "米国株"}

【分析項目と出力形式】
以下のJSON形式で厳密に出力してください。

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

  // OpenAI APIを使用 (JSON mode)
  try {
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "あなたは株式投資の専門アナリストです。JSON形式で正確に回答してください。",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
          max_tokens: 4000,
        }),
      }
    );

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const analysisResult = JSON.parse(data.choices[0].message.content);
    return NextResponse.json({ ...analysisResult, step: 3 });
  } catch (error) {
    console.error("OpenAI API error:", error);

    // エラー時はモックデータを使用
    const { mockToyotaData, mockAppleData, mockSonyData } = await import(
      "@/app/components/MockKarteData"
    );
    const mockDataList = [mockToyotaData, mockAppleData, mockSonyData];
    const randomData =
      mockDataList[Math.floor(Math.random() * mockDataList.length)];

    // 入力された企業情報で上書き
    randomData.stockInfo.code = stockCode;
    randomData.stockInfo.name = companyName;
    randomData.stockInfo.price = currentPrice;
    randomData.stockInfo.market = market;

    return NextResponse.json({ ...randomData, step: 3 });
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

// オプション: リアルタイムデータ取得用の補助関数
async function fetchRealTimeStockData(stockCode: string, market: string) {
  // Yahoo Finance API, Alpha Vantage API などから
  // リアルタイムの株価データを取得

  // 例: Yahoo Finance API
  /*
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${stockCode}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }
  );
  
  const data = await response.json();
  return {
    price: data.chart.result[0].meta.regularMarketPrice,
    previousClose: data.chart.result[0].meta.previousClose,
    volume: data.chart.result[0].meta.regularMarketVolume
  };
  */

  return null;
}

// 財務データ取得用の補助関数
async function fetchFinancialData(stockCode: string, market: string) {
  // 財務データAPIから詳細な財務情報を取得
  // 例: EDGAR API (米国株), EDINET API (日本株)

  return null;
}
