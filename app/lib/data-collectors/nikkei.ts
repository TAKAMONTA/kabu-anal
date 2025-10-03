import { CollectorResult, DataSource, StockData } from "./types";

interface NewsItem {
  タイトル: string;
  要約: string;
  日時: string;
  URL: string;
  信頼度?: "高" | "中" | "低";
}

export class NikkeiCollector {
  private readonly source: DataSource = {
    name: "日経電子版",
    url: "https://www.nikkei.com",
    priority: 2,
    reliability: "高",
    supportedMarkets: ["JP"],
  };

  async collectStockData(stockCode: string): Promise<CollectorResult> {
    const errors: string[] = [];
    const data: Partial<StockData> = {};

    try {
      // 日経電子版の企業ページURL
      const url = `https://www.nikkei.com/nkd/company/?scode=${stockCode}`;

      // 日経電子版は直接スクレイピングが困難なため、Perplexity APIを使用
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        throw new Error("PERPLEXITY_API_KEY が設定されていません");
      }

      const prompt = `【重要指示】
あなたはリアルタイムWeb検索機能を持つAIです。日本株の最新情報を取得してください。

【検索対象】
- 銘柄: 日本株 証券コード${stockCode}
- 情報源: 日経電子版 (${url}) を優先的に参照
- 取得時刻: 2025年10月3日時点の最新データ

【必須取得項目】
1. **企業名**: 正式な企業名（必須）
2. **株価情報**（必須）:
   - 現在値、前日比（円・パーセント）、出来高、時価総額、始値、高値、安値
3. **財務指標**（重要）:
   - PER、PBR、ROE、EPS、配当利回り
4. **テクニカル指標**（可能な限り取得）:
   - MA25、MA75、MA200、RSI、MACD
5. **最新ニュース**（上位3件）

【データ品質要件】
- 株価情報: **必須** - 取得できない場合はエラー
- 財務指標: 80%以上取得が望ましい
- テクニカル指標: 取得できない場合は null でも可

【出力形式】
JSON形式で以下の構造で**正確に**出力してください：

\`\`\`json
{
  "企業名": "正式な企業名",
  "株価情報": {
    "現在値": 1234,
    "前日比": {
      "円": 12,
      "パーセント": 0.98
    },
    "出来高": 1500000,
    "時価総額": "1兆2000億円",
    "始値": 1220,
    "高値": 1250,
    "安値": 1215
  },
  "財務指標": {
    "PER": 15.2,
    "PBR": 1.8,
    "ROE": 12.5,
    "EPS": 85.2,
    "配当利回り": 2.1
  },
  "テクニカル指標": {
    "MA25": 1200,
    "MA75": 1180,
    "MA200": 1150,
    "RSI": 58,
    "MACD": {
      "値": 5.2,
      "シグナル": 3.8,
      "ヒストグラム": 1.4
    }
  },
  "最新ニュース": [
    {
      "タイトル": "ニュースタイトル",
      "要約": "要約文",
      "日時": "2025-01-01T15:00:00+09:00",
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
      const nikkeiData = JSON.parse(jsonString);

      // データの構造化
      if (nikkeiData.株価情報) {
        data.株価情報 = {
          ...nikkeiData.株価情報,
          情報源: url,
        };
      }

      if (nikkeiData.財務指標) {
        data.財務指標 = {
          ...nikkeiData.財務指標,
          情報源: url,
        };
      }

      if (nikkeiData.テクニカル指標) {
        data.テクニカル指標 = {
          ...nikkeiData.テクニカル指標,
          情報源: url,
        };
      }

      if (nikkeiData.最新ニュース) {
        data.最新ニュース = nikkeiData.最新ニュース.map((news: NewsItem) => ({
          ...news,
          信頼度: "高" as const,
        }));
      }

      data.metadata = {
        証券コード: stockCode,
        企業名: nikkeiData.企業名 || "不明",
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
        confidence: 85,
      };
    } catch (error) {
      errors.push(
        `日経電子版: ${error instanceof Error ? error.message : "不明なエラー"}`
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
