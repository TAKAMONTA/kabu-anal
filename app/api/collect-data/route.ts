import { NextRequest, NextResponse } from "next/server";
import { logger, logApiError } from "@/app/lib/logger";

interface UnifiedStockData {
  metadata: {
    証券コード: string;
    企業名: string;
    収集日時: string;
    データ信頼度: "高" | "中" | "低";
  };
  株価情報: {
    現在値: number;
    前日比: {
      円?: number;
      ドル?: number;
      パーセント: number;
    };
    出来高: number;
    時価総額: string;
    始値?: number;
    高値?: number;
    安値?: number;
    情報源: string;
  };
  財務指標: {
    PER: number | null;
    PBR: number | null;
    ROE: number | null;
    配当利回り: number | null;
    直近決算: string | null;
    EPS?: number | null;
    情報源: string;
  };
  テクニカル指標: {
    MA25: number | null;
    MA75: number | null;
    MA200: number | null;
    RSI: number | null;
    MACD: {
      値: number | null;
      シグナル: number | null;
      ヒストグラム: number | null;
    };
    情報源: string;
  };
  最新ニュース: Array<{
    タイトル: string;
    要約: string;
    日時: string;
    URL: string;
  }>;
  市場センチメント: {
    総合評価: string;
    理由: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { stockCode } = await request.json();

    if (!stockCode || typeof stockCode !== "string") {
      return NextResponse.json(
        { error: "証券コードが必要です" },
        { status: 400 }
      );
    }

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY が設定されていません");
    }

    // 日本株か米国株かを判定（数字のみ=日本株、アルファベット含む=米国株）
    const isJapaneseStock = /^\d+$/.test(stockCode);
    const stockSymbol = isJapaneseStock ? `${stockCode}.T` : stockCode;

    // Perplexityプロンプト
    const prompt = `あなたは${isJapaneseStock ? '日本' : '米国'}株式市場のリアルタイムデータ収集専門AIです。

【重要指示】
${isJapaneseStock ? '証券コード' : 'ティッカーシンボル'} ${stockCode} について、以下の金融情報サイトから**現在のリアルタイムデータを直接スクレイピング**してください：

${isJapaneseStock ? `推奨データソース（優先順位順）:
1. Yahoo!ファイナンス日本: https://finance.yahoo.co.jp/quote/${stockSymbol}
2. 日経電子版 株価: https://www.nikkei.com/nkd/company/?scode=${stockCode}
3. Bloomberg Japan: https://www.bloomberg.co.jp/quote/${stockCode}:JP
4. Investing.com日本: https://jp.investing.com/` : `推奨データソース（優先順位順）:
1. Yahoo Finance US: https://finance.yahoo.com/quote/${stockCode}
2. Google Finance: https://www.google.com/finance/quote/${stockCode}
3. Bloomberg: https://www.bloomberg.com/quote/${stockCode}:US
4. MarketWatch: https://www.marketwatch.com/investing/stock/${stockCode}`}

【必須収集項目】

1. **株価情報（最優先・必須）**
   - 現在値${isJapaneseStock ? '（円）' : '（ドル）'} ※必ず最新のリアルタイム価格
   - 前日比${isJapaneseStock ? '（円' : '（ドル'}・パーセント）
   - 出来高（株数）
   - 時価総額${isJapaneseStock ? '（円または億円表記）' : '（ドルまたはB/M表記）'}
   - 始値・高値・安値
   - データ取得元URL

2. **財務指標**
   - PER（株価収益率）
   - PBR（株価純資産倍率）
   - ROE（自己資本利益率）%
   - 配当利回り（%）
   - 直近決算期
   - EPS（1株当たり利益）${isJapaneseStock ? '円' : 'ドル'}

3. **テクニカル指標**
   - 25日移動平均線
   - 75日移動平均線
   - 200日移動平均線
   - RSI（14日）
   - MACD（値・シグナル・ヒストグラム）

4. **最新ニュース（上位3件）**
   - タイトル${isJapaneseStock ? '（日本語）' : '（英語または日本語）'}
   - 要約（50文字以内）
   - 公開日時
   - ソースURL

5. **市場センチメント**
   - 総合評価（強気/弱気/中立）
   - 評価理由

【出力形式】
必ず以下のJSON形式のみで出力してください。説明文・コメント・マークダウン記法は一切不要です。

\`\`\`json
{
  "metadata": {
    "証券コード": "${stockCode}",
    "企業名": "${isJapaneseStock ? '正式な企業名（日本語）' : '正式な企業名（英語）'}",
    "収集日時": "${isJapaneseStock ? '2025-10-01T15:30:00+09:00' : '2025-10-01T09:30:00-04:00'}",
    "データ信頼度": "高"
  },
  "株価情報": {
    "現在値": ${isJapaneseStock ? '1234' : '150.25'},
    "前日比": {
      "${isJapaneseStock ? '円' : 'ドル'}": ${isJapaneseStock ? '12' : '2.5'},
      "パーセント": ${isJapaneseStock ? '0.98' : '1.69'}
    },
    "出来高": ${isJapaneseStock ? '1500000' : '25000000'},
    "時価総額": "${isJapaneseStock ? '1兆2000億円' : '2.5T'}",
    "始値": ${isJapaneseStock ? '1220' : '148.75'},
    "高値": ${isJapaneseStock ? '1250' : '151.00'},
    "安値": ${isJapaneseStock ? '1215' : '148.50'},
    "情報源": "${isJapaneseStock ? `https://finance.yahoo.co.jp/quote/${stockSymbol}` : `https://finance.yahoo.com/quote/${stockCode}`}"
  },
  "財務指標": {
    "PER": ${isJapaneseStock ? '15.2' : '28.5'},
    "PBR": ${isJapaneseStock ? '1.3' : '8.2'},
    "ROE": ${isJapaneseStock ? '8.5' : '45.2'},
    "配当利回り": ${isJapaneseStock ? '2.1' : '0.5'},
    "直近決算": "${isJapaneseStock ? '2024年12月期' : 'Q4 2024'}",
    "EPS": ${isJapaneseStock ? '80.5' : '5.25'},
    "情報源": "${isJapaneseStock ? `https://finance.yahoo.co.jp/quote/${stockSymbol}` : `https://finance.yahoo.com/quote/${stockCode}`}"
  },
  "テクニカル指標": {
    "MA25": ${isJapaneseStock ? '1200' : '145.50'},
    "MA75": ${isJapaneseStock ? '1180' : '140.25'},
    "MA200": ${isJapaneseStock ? '1150' : '135.80'},
    "RSI": 58,
    "MACD": {
      "値": ${isJapaneseStock ? '5.2' : '2.8'},
      "シグナル": ${isJapaneseStock ? '3.8' : '2.1'},
      "ヒストグラム": ${isJapaneseStock ? '1.4' : '0.7'}
    },
    "情報源": "${isJapaneseStock ? `https://finance.yahoo.co.jp/quote/${stockSymbol}` : `https://finance.yahoo.com/quote/${stockCode}`}"
  },
  "最新ニュース": [
    {
      "タイトル": "実際のニュースタイトル",
      "要約": "ニュース内容の要約50文字以内",
      "日時": "${isJapaneseStock ? '2025-10-01T14:00:00+09:00' : '2025-10-01T08:00:00-04:00'}",
      "URL": "https://..."
    }
  ],
  "市場センチメント": {
    "総合評価": "強気",
    "理由": "最新の市場動向とアナリスト評価に基づく判断"
  }
}
\`\`\`

【データ収集の注意事項】
✅ リアルタイム株価は必ず${isJapaneseStock ? 'Yahoo!ファイナンス日本版または日経電子版' : 'Yahoo Finance US、Google Finance、またはBloomberg'}から取得
✅ 数値は必ず数値型（整数または小数）で出力（文字列・カンマ区切り禁止）
✅ 取得できないデータは null を設定（空文字列禁止）
✅ 日時は必ずISO 8601形式${isJapaneseStock ? '（例: 2025-10-01T15:30:00+09:00 JST）' : '（例: 2025-10-01T09:30:00-04:00 EDT）'}
✅ 推測・予想は含めず、実際のデータのみ記載
✅ 情報源URLは実在する正確なURLを記載
${isJapaneseStock ? '✅ 企業名は日本語で記載' : '✅ 企業名は正式な英語名で記載（例: Apple Inc., Microsoft Corporation）'}
${isJapaneseStock ? '' : '✅ 時価総額はT（兆ドル）、B（億ドル）、M（百万ドル）表記を使用'}`;

    // Perplexity API呼び出し
    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          return_citations: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, "Perplexity API error");
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Perplexityからのレスポンスが空です");
    }

    // JSONを抽出
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                     content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      logger.error({ contentLength: content.length }, "JSON抽出失敗");
      throw new Error("JSONデータの抽出に失敗しました");
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const unifiedData: UnifiedStockData = JSON.parse(jsonString);

    // データ検証
    if (!unifiedData.metadata || !unifiedData.株価情報) {
      throw new Error("必須データが不足しています");
    }

    // 収集日時を現在時刻で上書き（より正確に）
    unifiedData.metadata.収集日時 = new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: unifiedData,
      citations: data.citations || [],
    });
  } catch (error) {
    logApiError("POST", "/api/collect-data", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      {
        error: "データ収集中にエラーが発生しました",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
