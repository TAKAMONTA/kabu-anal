import { NextRequest, NextResponse } from "next/server";
import { logger, logApiError } from "@/app/lib/logger";
import {
  YahooFinanceCollector,
  NikkeiCollector,
  InvestingCollector,
  DataAggregator,
} from "@/app/lib/data-collectors";
import { DataCollectionConfig } from "@/app/lib/data-collectors/types";

export async function POST(request: NextRequest) {
  try {
    const { stockCode } = await request.json();

    if (!stockCode || typeof stockCode !== "string") {
      return NextResponse.json(
        { error: "証券コードが必要です" },
        { status: 400 }
      );
    }

    // 日本株か米国株かを判定
    const isJapaneseStock = /^\d+$/.test(stockCode);

    logger.info({ stockCode, isJapaneseStock }, "データ収集開始");

    // データ収集設定
    const config: DataCollectionConfig = {
      maxRetries: 3,
      timeout: 30000,
      enableFallback: true,
      validateData: true,
      requiredFields: [
        "metadata.証券コード",
        "metadata.企業名",
        "株価情報.現在値",
      ],
    };

    // データ収集器の初期化
    const yahooCollector = new YahooFinanceCollector();
    const nikkeiCollector = new NikkeiCollector();
    const investingCollector = new InvestingCollector();
    const aggregator = new DataAggregator(config);

    // 並列データ収集（タイムアウト付き）
    const collectionPromises = [
      collectWithTimeout(yahooCollector.collectStockData(stockCode), 15000),
    ];

    // 日本株の場合は日経電子版も使用
    if (isJapaneseStock) {
      collectionPromises.push(
        collectWithTimeout(nikkeiCollector.collectStockData(stockCode), 15000)
      );
    }

    // Investing.comは両方の市場で使用
    collectionPromises.push(
      collectWithTimeout(investingCollector.collectStockData(stockCode), 15000)
    );

    logger.info(
      { stockCode, collectors: collectionPromises.length },
      "並列データ収集実行"
    );

    // 並列実行とタイムアウト処理
    const results = await Promise.allSettled(collectionPromises);

    // 結果の処理
    const collectorResults = results
      .map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          logger.warn(
            {
              collector: index,
              error: result.reason,
            },
            "データ収集器でエラー発生"
          );
          return null;
        }
      })
      .filter(
        (result): result is NonNullable<typeof result> => result !== null
      );

    logger.info(
      {
        stockCode,
        totalCollectors: results.length,
        successfulCollectors: collectorResults.length,
      },
      "データ収集完了"
    );

    // データの統合
    const aggregationResult = await aggregator.aggregateData(
      collectorResults,
      stockCode
    );

    if (!aggregationResult.success) {
      logger.error(
        {
          stockCode,
          errors: aggregationResult.errors,
        },
        "データ統合失敗"
      );

      // フォールバック: 最低限のデータでも返す
      return NextResponse.json({
        success: false,
        data: aggregationResult.data,
        citations: [],
        metadata: {
          収集時刻: new Date().toISOString(),
          データソース数: collectorResults.length,
          統合データソース: aggregationResult.sources,
          信頼度: aggregationResult.confidence,
          errors: aggregationResult.errors,
          warnings: aggregationResult.warnings,
          fallback: true,
        },
      });
    }

    logger.info(
      {
        stockCode,
        confidence: aggregationResult.confidence,
        sources: aggregationResult.sources,
      },
      "データ収集成功"
    );

    // 既存のAPIレスポンス形式との互換性を保つ
    return NextResponse.json({
      success: true,
      data: aggregationResult.data,
      citations: [], // 互換性のため
      metadata: {
        収集時刻: new Date().toISOString(),
        データソース数: collectorResults.length,
        統合データソース: aggregationResult.sources,
        信頼度: aggregationResult.confidence,
        errors: aggregationResult.errors,
        warnings: aggregationResult.warnings,
      },
    });
  } catch (error) {
    logApiError("POST", "/api/collect-data", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";

    logger.error({ error: errorMessage }, "データ収集API エラー");

    return NextResponse.json(
      {
        error: "データ収集中にエラーが発生しました",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// タイムアウト付きデータ収集
function collectWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`タイムアウト: ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]);
}
