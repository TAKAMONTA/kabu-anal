import { CollectorResult, DataSource, StockData } from "./types";

interface NewsItem {
  タイトル: string;
  要約: string;
  日時: string;
  URL: string;
  信頼度?: "高" | "中" | "低";
}

export class YahooFinanceCollector {
  private readonly source: DataSource = {
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com",
    priority: 1,
    reliability: "高",
    supportedMarkets: ["JP", "US"],
  };

  async collectStockData(stockCode: string): Promise<CollectorResult> {
    const isJapaneseStock = /^\d+$/.test(stockCode);
    const symbol = isJapaneseStock ? `${stockCode}.T` : stockCode;
    const pageUrl = isJapaneseStock
      ? `https://finance.yahoo.co.jp/quote/${symbol}`
      : `https://finance.yahoo.com/quote/${symbol}`;

    const errors: string[] = [];
    const data: Partial<StockData> = {};

    try {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        throw new Error("PERPLEXITY_API_KEY が設定されていません");
      }

      const prompt = `【重要指示】
あなたはリアルタイムWeb検索機能を持つAIです。以下の手順で最新の株価情報を取得してください。

【検索対象】
- 銘柄: ${isJapaneseStock ? `日本株 証券コード${stockCode}` : `米国株 ティッカーシンボル${stockCode}`}
- 情報源: Yahoo Finance (${pageUrl}) を優先的に参照
- 取得時刻: 2025年10月3日時点の最新データ

【必須取得項目】
1. **企業名**: 正式な企業名（必須）
2. **株価情報**（必須）:
   - 現在値: 最新の株価（数値）
   - 前日比: 円/ドル（数値）とパーセント（数値）
   - 出来高: 本日の出来高（数値）
   - 時価総額: 文字列
   - 始値、高値、安値: 本日の値（数値）

3. **財務指標**（重要）:
   - PER（株価収益率）
   - PBR（株価純資産倍率）
   - ROE（自己資本利益率）
   - EPS（1株当たり利益）
   - 配当利回り（パーセント）

4. **テクニカル指標**（可能な限り取得）:
   - MA25（25日移動平均線）
   - MA75（75日移動平均線）
   - MA200（200日移動平均線）
   - RSI（相対力指数）
   - MACD（値、シグナル、ヒストグラム）

5. **最新ニュース**（上位3件）:
   - タイトル
   - 要約（100文字程度）
   - 日時（ISO 8601形式）
   - URL

【取得方法】
1. まず、Yahoo Financeで企業名と現在株価を確認
2. 詳細な財務指標とテクニカル指標を検索
3. 関連する最新ニュースを検索
4. 取得できない項目は null を設定

【データ品質要件】
- 株価情報（現在値、前日比、出来高）: **必須** - 取得できない場合はエラーを報告
- 財務指標: 80%以上取得することが望ましい
- テクニカル指標: 取得できない場合は null でも可
- ニュース: 最低1件は取得すること

【出力形式】
JSONで以下の構造に沿って**正確に**回答してください。

\`\`\`json
{
  "企業名": "正式名称",
  "株価情報": {
    "現在値": ${isJapaneseStock ? "1234" : "150.25"},
    "前日比": {
      "${isJapaneseStock ? "円" : "ドル"}": ${isJapaneseStock ? "12" : "2.5"},
      "パーセント": ${isJapaneseStock ? "0.98" : "1.69"}
    },
    "出来高": ${isJapaneseStock ? "1500000" : "25000000"},
    "時価総額": "${isJapaneseStock ? "1兆2000億円" : "2.5T"}",
    "始値": ${isJapaneseStock ? "1220" : "148.75"},
    "高値": ${isJapaneseStock ? "1250" : "151.00"},
    "安値": ${isJapaneseStock ? "1215" : "148.50"}
  },
  "財務指標": {
    "PER": ${isJapaneseStock ? "15.2" : "18.5"},
    "PBR": ${isJapaneseStock ? "1.8" : "2.1"},
    "ROE": ${isJapaneseStock ? "12.5" : "15.8"},
    "EPS": ${isJapaneseStock ? "85.2" : "8.15"},
    "配当利回り": ${isJapaneseStock ? "2.1" : "1.8"}
  },
  "テクニカル指標": {
    "MA25": ${isJapaneseStock ? "1200" : "145.50"},
    "MA75": ${isJapaneseStock ? "1180" : "140.25"},
    "MA200": ${isJapaneseStock ? "1150" : "135.80"},
    "RSI": 58,
    "MACD": {
      "値": ${isJapaneseStock ? "5.2" : "2.8"},
      "シグナル": ${isJapaneseStock ? "3.8" : "2.1"},
      "ヒストグラム": ${isJapaneseStock ? "1.4" : "0.7"}
    }
  },
  "最新ニュース": [
    {
      "タイトル": "ニュースタイトル",
      "要約": "要約文",
      "日時": "${isJapaneseStock ? "2025-01-01T15:00:00+09:00" : "2025-01-01T09:00:00-04:00"}",
      "URL": "https://example.com"
    }
  ]
}
\`\`\`
`;

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
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            return_citations: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const apiData = await response.json();
      const content = apiData.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Perplexityからのレスポンスが空です");
      }

      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("JSONデータの抽出に失敗しました");
      }

      const jsonString = jsonMatch[1] || jsonMatch[0];
      const yahooData = JSON.parse(jsonString);

      if (yahooData.株価情報) {
        data.株価情報 = {
          ...yahooData.株価情報,
          情報源: pageUrl,
        };
      }

      if (yahooData.財務指標) {
        data.財務指標 = {
          ...yahooData.財務指標,
          情報源: pageUrl,
        };
      }

      if (yahooData.テクニカル指標) {
        data.テクニカル指標 = {
          ...yahooData.テクニカル指標,
          情報源: pageUrl,
        };
      }

      if (yahooData.最新ニュース) {
        data.最新ニュース = yahooData.最新ニュース.map((news: NewsItem) => ({
          ...news,
          信頼度: "高" as const,
        }));
      }

      data.metadata = {
        証券コード: stockCode,
        企業名: yahooData.企業名 || "不明",
        収集日時: new Date().toISOString(),
        データ信頼度: "高",
        データソース: [this.source.name],
      };

      return {
        success: true,
        data,
        errors,
        source: this.source.name,
        timestamp: new Date().toISOString(),
        confidence: 90,
      };
    } catch (error) {
      errors.push(
        `Yahoo Finance: ${error instanceof Error ? error.message : "不明なエラー"}`
      );
      return {
        success: false,
        data: {},
        errors,
        source: this.source.name,
        timestamp: new Date().toISOString(),
        confidence: 0,
      };
    }
  }
}
