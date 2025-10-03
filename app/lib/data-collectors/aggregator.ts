import { StockData, CollectorResult, DataCollectionConfig } from "./types";
import { DataValidator } from "./validator";

export class DataAggregator {
  private validator: DataValidator;

  constructor(_config: DataCollectionConfig) {
    this.validator = new DataValidator();
  }

  async aggregateData(
    results: CollectorResult[],
    stockCode: string
  ): Promise<{
    success: boolean;
    data: StockData;
    errors: string[];
    warnings: string[];
    sources: string[];
    confidence: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sources: string[] = [];

    try {
      // 成功した結果のみをフィルタリング
      const successfulResults = results.filter(r => r.success);

      if (successfulResults.length === 0) {
        return {
          success: false,
          data: this.createEmptyData(stockCode),
          errors: ["すべてのデータソースからデータ取得に失敗しました"],
          warnings: [],
          sources: [],
          confidence: 0,
        };
      }

      // 最適なデータを選択
      const bestDataSelection =
        this.validator.selectBestData(successfulResults);
      sources.push(bestDataSelection.selectedSource);

      // データの統合
      const aggregatedData = this.mergeDataSources(
        successfulResults,
        bestDataSelection.selectedData,
        stockCode
      );

      // データの検証
      const validation = this.validator.validateStockData(aggregatedData);

      if (!validation.isValid) {
        errors.push(...validation.errors);
      }

      warnings.push(...validation.warnings);

      // 信頼度の計算
      const confidence = this.calculateOverallConfidence(
        successfulResults,
        validation.score
      );

      return {
        success: errors.length === 0,
        data: aggregatedData as StockData,
        errors,
        warnings,
        sources,
        confidence,
      };
    } catch (error) {
      errors.push(
        `データ統合エラー: ${error instanceof Error ? error.message : "不明なエラー"}`
      );

      return {
        success: false,
        data: this.createEmptyData(stockCode),
        errors,
        warnings,
        sources,
        confidence: 0,
      };
    }
  }

  private mergeDataSources(
    results: CollectorResult[],
    primaryData: Partial<StockData>,
    stockCode: string
  ): Partial<StockData> {
    const merged: Partial<StockData> = { ...primaryData };

    // メタデータの統合
    if (!merged.metadata) {
      merged.metadata = {
        証券コード: stockCode,
        企業名: "不明",
        収集日時: new Date().toISOString(),
        データ信頼度: "低",
        データソース: [],
      };
    }

    // 証券コードを確実に設定
    merged.metadata.証券コード = stockCode;

    // データソース一覧の更新
    const allSources = [...new Set(results.map(r => r.source))];
    merged.metadata.データソース = allSources;

    // 株価情報の統合（最も信頼度の高いデータを優先）
    const stockPriceResults = results.filter(r => r.data.株価情報);
    if (stockPriceResults.length > 0) {
      const bestStockPrice = stockPriceResults.sort(
        (a, b) => b.confidence - a.confidence
      )[0];
      merged.株価情報 = bestStockPrice.data.株価情報;
    } else if (!merged.株価情報) {
      // デフォルト値を設定
      merged.株価情報 = {
        現在値: null,
        前日比: { パーセント: null },
        出来高: null,
        時価総額: null,
        情報源: "",
      };
    }

    // 財務指標の統合
    const financialResults = results.filter(r => r.data.財務指標);
    if (financialResults.length > 0) {
      const bestFinancial = financialResults.sort(
        (a, b) => b.confidence - a.confidence
      )[0];
      merged.財務指標 = bestFinancial.data.財務指標;
    } else if (!merged.財務指標) {
      merged.財務指標 = {
        PER: null,
        PBR: null,
        ROE: null,
        配当利回り: null,
        直近決算: null,
        情報源: "",
      };
    }

    // テクニカル指標の統合
    const technicalResults = results.filter(r => r.data.テクニカル指標);
    if (technicalResults.length > 0) {
      const bestTechnical = technicalResults.sort(
        (a, b) => b.confidence - a.confidence
      )[0];
      merged.テクニカル指標 = bestTechnical.data.テクニカル指標;
    } else if (!merged.テクニカル指標) {
      merged.テクニカル指標 = {
        MA25: null,
        MA75: null,
        MA200: null,
        RSI: null,
        MACD: { 値: null, シグナル: null, ヒストグラム: null },
        情報源: "",
      };
    }

    // ニュースの統合（複数ソースから収集）
    const allNews: any[] = [];
    results.forEach(result => {
      if (result.data.最新ニュース && result.data.最新ニュース.length > 0) {
        allNews.push(...result.data.最新ニュース);
      }
    });

    // 重複ニュースの除去とソート
    const uniqueNews = this.deduplicateNews(allNews);
    merged.最新ニュース = uniqueNews.slice(0, 5); // 最新5件

    // ニュースがない場合は空配列を設定
    if (!merged.最新ニュース) {
      merged.最新ニュース = [];
    }

    // 市場センチメントの統合
    const sentimentResults = results.filter(r => r.data.市場センチメント);
    if (sentimentResults.length > 0) {
      const bestSentiment = sentimentResults.sort(
        (a, b) => b.confidence - a.confidence
      )[0];
      merged.市場センチメント = bestSentiment.data.市場センチメント;
    } else if (!merged.市場センチメント) {
      merged.市場センチメント = {
        総合評価: "不明",
        理由: "データ不足",
      };
    }

    return merged;
  }

  private deduplicateNews(newsList: any[]): any[] {
    const seen = new Set<string>();
    return newsList
      .filter(news => {
        if (!news.タイトル || typeof news.タイトル !== "string") {
          return false;
        }
        const key = news.タイトル.toLowerCase().trim();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.日時).getTime() - new Date(a.日時).getTime());
  }

  private calculateOverallConfidence(
    results: CollectorResult[],
    dataQualityScore: number
  ): number {
    if (results.length === 0) return 0;

    // データソースの信頼度の平均
    const avgSourceConfidence =
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // データソースの数による信頼度向上
    const sourceCountBonus = Math.min(results.length * 5, 20);

    // 最終的な信頼度計算
    const finalConfidence =
      (avgSourceConfidence + dataQualityScore) / 2 + sourceCountBonus;

    return Math.min(100, Math.max(0, Math.round(finalConfidence)));
  }

  private createEmptyData(stockCode: string): StockData {
    return {
      metadata: {
        証券コード: stockCode,
        企業名: "不明",
        収集日時: new Date().toISOString(),
        データ信頼度: "低",
        データソース: [],
      },
      株価情報: {
        現在値: null,
        前日比: {
          パーセント: null,
        },
        出来高: null,
        時価総額: null,
        始値: null,
        高値: null,
        安値: null,
        情報源: "",
      },
      財務指標: {
        PER: null,
        PBR: null,
        ROE: null,
        配当利回り: null,
        直近決算: null,
        EPS: null,
        情報源: "",
      },
      テクニカル指標: {
        MA25: null,
        MA75: null,
        MA200: null,
        RSI: null,
        MACD: {
          値: null,
          シグナル: null,
          ヒストグラム: null,
        },
        情報源: "",
      },
      最新ニュース: [],
      市場センチメント: {
        総合評価: "不明",
        理由: "データ不足",
        信頼度: "低",
      },
    };
  }
}
