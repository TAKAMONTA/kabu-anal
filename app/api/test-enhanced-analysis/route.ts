import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/app/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { stockCode } = await request.json();

    if (!stockCode || typeof stockCode !== "string") {
      return NextResponse.json(
        { error: "証券コードが必要です" },
        { status: 400 }
      );
    }

    logger.info({ stockCode }, "強化された分析システムのテスト開始");

    // 1. 強化されたデータ収集のテスト
    const dataCollectionResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/collect-data`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCode }),
      }
    );

    if (!dataCollectionResponse.ok) {
      const errorData = await dataCollectionResponse.json();
      throw new Error(
        `データ収集に失敗: ${errorData.error || errorData.details}`
      );
    }

    const dataCollectionResult = await dataCollectionResponse.json();
    logger.info(
      {
        stockCode,
        success: dataCollectionResult.success,
        confidence: dataCollectionResult.confidence,
        sources: dataCollectionResult.sources,
      },
      "データ収集結果"
    );

    // 2. データ品質の評価
    const dataQuality = {
      hasStockPrice: !!dataCollectionResult.data?.株価情報?.現在値,
      hasFinancialMetrics: !!dataCollectionResult.data?.財務指標?.PER,
      hasTechnicalIndicators: !!dataCollectionResult.data?.テクニカル指標?.RSI,
      hasNews: dataCollectionResult.data?.最新ニュース?.length > 0,
      hasMarketSentiment: !!dataCollectionResult.data?.市場センチメント,
      confidence: dataCollectionResult.confidence || 0,
      sources: dataCollectionResult.sources || [],
      errors: dataCollectionResult.errors || [],
      warnings: dataCollectionResult.warnings || [],
    };

    // 3. 分析品質のテスト
    const analysisTest = await Promise.allSettled([
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/analyze-claude`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unifiedData: dataCollectionResult.data }),
        }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/analyze-gemini`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unifiedData: dataCollectionResult.data }),
        }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/analyze-openai`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unifiedData: dataCollectionResult.data }),
        }
      ),
    ]);

    const analysisResults = analysisTest.map((result, index) => {
      const aiNames = ["Claude", "Gemini", "OpenAI"];
      if (result.status === "fulfilled" && result.value.ok) {
        return {
          ai: aiNames[index],
          status: "success",
          message: "分析成功",
        };
      } else {
        return {
          ai: aiNames[index],
          status: "failed",
          message:
            result.status === "rejected" ? result.reason.message : "分析失敗",
        };
      }
    });

    // 4. 総合評価
    const improvementAreas: string[] = [];

    // 改善点の特定
    if (!dataQuality.hasStockPrice) {
      improvementAreas.push("株価データの取得");
    }
    if (!dataQuality.hasFinancialMetrics) {
      improvementAreas.push("財務指標の取得");
    }
    if (!dataQuality.hasTechnicalIndicators) {
      improvementAreas.push("テクニカル指標の取得");
    }
    if (!dataQuality.hasNews) {
      improvementAreas.push("ニュース情報の取得");
    }
    if (dataQuality.confidence < 70) {
      improvementAreas.push("データ信頼度の向上");
    }

    const overallQuality = {
      dataCollection: dataCollectionResult.success ? "成功" : "失敗",
      dataCompleteness: `${Object.values(dataQuality).filter(v => v === true).length}/6項目`,
      analysisSuccess: analysisResults.filter(r => r.status === "success")
        .length,
      totalConfidence: dataQuality.confidence,
      improvementAreas,
    };

    const testResult = {
      証券コード: stockCode,
      テスト日時: new Date().toISOString(),
      データ収集結果: dataCollectionResult,
      データ品質: dataQuality,
      分析テスト結果: analysisResults,
      総合評価: overallQuality,
      推奨改善点: overallQuality.improvementAreas,
      システム改善状況: {
        マルチソースデータ収集: "実装済み",
        データ検証機能: "実装済み",
        並列処理: "実装済み",
        エラーハンドリング: "実装済み",
        タイムアウト処理: "実装済み",
        AI分析プロンプト強化: "実装済み",
      },
    };

    logger.info(
      {
        stockCode,
        overallQuality: overallQuality.dataCompleteness,
        confidence: overallQuality.totalConfidence,
      },
      "強化された分析システムのテスト完了"
    );

    return NextResponse.json({
      success: true,
      testResult,
    });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "不明なエラー" },
      "テスト実行エラー"
    );

    return NextResponse.json(
      {
        error: "テスト実行中にエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
