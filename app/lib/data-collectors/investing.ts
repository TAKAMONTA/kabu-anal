import { CollectorResult, DataSource, StockData } from "./types";

interface NewsItem {
  タイトル: string;
  要約: string;
  日時: string;
  URL: string;
  信頼度?: "高" | "中" | "低";
}

export class InvestingCollector {
  private readonly source: DataSource = {
    name: "Investing.com",
    url: "https://jp.investing.com",
    priority: 3,
    reliability: "中",
    supportedMarkets: ["JP", "US"],
  };

  async collectStockData(stockCode: string): Promise<CollectorResult> {
    const isJapaneseStock = /^\d+$/.test(stockCode);
    const errors: string[] = [];
    const data: Partial<StockData> = {};

    try {
      // Investing.comの企業ページURL
      const url = isJapaneseStock
        ? `https://jp.investing.com/equities/${stockCode}`
        : `https://www.investing.com/equities/${stockCode}`;

      // Perplexity APIを使用してInvesting.comからデータを取得
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        throw new Error("PERPLEXITY_API_KEY が設定されていません");
      }

      const prompt = `【重要指示】
あなたはリアルタイムWeb検索機能を持つAIです。最新の株価情報を取得してください。

【検索対象】
- 銘柄: ${isJapaneseStock ? `日本株 証券コード${stockCode}` : `米国株 ティッカーシンボル${stockCode}`}
- 情報源: Investing.com (${url}) を優先的に参照
- 取得時刻: 2025年10月3日時点の最新データ

【必須取得項目】
1. **企業名**: 正式な企業名（必須）
2. **株価情報**（必須）:
   - 現在値（${isJapaneseStock ? "円" : "ドル"}）
   - 前日比（${isJapaneseStock ? "円" : "ドル"}・パーセント）
   - 出来高、時価総額、始値、高値、安値
3. **テクニカル指標**（可能な限り取得）:
   - MA25、MA75、MA200、RSI、MACD
4. **最新ニュース**（上位3件）

【データ品質要件】
- 株価情報: **必須** - 取得できない場合はエラー
- テクニカル指標: 取得できない場合は null でも可

【出力形式】
JSON形式で以下の構造で**正確に**出力してください：

\`\`\`json
{
  "企業名": "正式な企業名",
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
      "URL": "https://..."
    }
  ]
}
\`\`\`

取得できないデータは null を設定してください。`;

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

      // JSONを抽出
      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("JSONデータの抽出に失敗しました");
      }

      const jsonString = jsonMatch[1] || jsonMatch[0];
      const investingData = JSON.parse(jsonString);

      // データの構造化
      if (investingData.株価情報) {
        data.株価情報 = {
          ...investingData.株価情報,
          情報源: url,
        };
      }

      if (investingData.テクニカル指標) {
        data.テクニカル指標 = {
          ...investingData.テクニカル指標,
          情報源: url,
        };
      }

      if (investingData.最新ニュース) {
        data.最新ニュース = investingData.最新ニュース.map(
          (news: NewsItem) => ({
            ...news,
            信頼度: "中" as const,
          })
        );
      }

      data.metadata = {
        証券コード: stockCode,
        企業名: investingData.企業名 || "不明",
        収集日時: new Date().toISOString(),
        データ信頼度: "中",
        データソース: [this.source.name],
      };

      return {
        success: true,
        data,
        errors,
        source: this.source.name,
        timestamp: new Date().toISOString(),
        confidence: 75,
      };
    } catch (error) {
      errors.push(
        `Investing.com: ${error instanceof Error ? error.message : "不明なエラー"}`
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
