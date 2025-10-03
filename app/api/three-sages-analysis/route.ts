import { NextRequest, NextResponse } from "next/server";
import {
  AIAnalysisResult,
  OverallJudgement,
  AnalysisPhase,
} from "@/app/types/analysis";
import { logger, logDataCollection, logApiError } from "@/app/lib/logger";
import { validateStockCode } from "@/app/lib/validation";

export async function POST(request: NextRequest) {
  const phases: AnalysisPhase[] = [
    { phase: "Phase 1", status: "pending", message: "データ収集中..." },
    { phase: "Phase 2", status: "pending", message: "AI分析中..." },
    { phase: "Phase 3", status: "pending", message: "結果統合中..." },
  ];

  let stockCode: string = "";

  try {
    const requestBody = await request.json();
    stockCode = requestBody.stockCode;

    // 入力検証
    const validation = validateStockCode(stockCode);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 正規化されたコードを使用
    stockCode = validation.normalizedCode || stockCode;

    // Phase 1: データ収集（Perplexity）
    phases[0].status = "processing";
    logDataCollection(stockCode, "Phase 1", "start", {
      message: "データ収集開始",
    });

    const collectResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/collect-data`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCode }),
      }
    );

    if (!collectResponse.ok) {
      const errorData = await collectResponse.json();
      throw new Error(
        `データ収集に失敗: ${errorData.error || errorData.details}`
      );
    }

    const { data: unifiedData } = await collectResponse.json();
    phases[0].status = "completed";
    phases[0].message = `データ取得完了: ${unifiedData.metadata.収集日時}`;
    logDataCollection(stockCode, "Phase 1", "success", {
      timestamp: unifiedData.metadata.収集日時,
    });

    // Phase 2: 並列AI分析
    phases[1].status = "processing";
    logDataCollection(stockCode, "Phase 2", "start", { message: "AI分析開始" });

    const [geminiResponse, claudeResponse, openaiResponse] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/analyze-gemini`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unifiedData }),
        }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/analyze-claude`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unifiedData }),
        }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/analyze-openai`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unifiedData }),
        }
      ),
    ]);

    // エラーチェック
    const responses = [
      { name: "Gemini", response: geminiResponse },
      { name: "Claude", response: claudeResponse },
      { name: "OpenAI", response: openaiResponse },
    ];

    for (const { name, response } of responses) {
      if (!response.ok) {
        const errorData = await response.json();
        logger.error({ ai: name, error: errorData }, `${name}分析エラー`);
        throw new Error(`${name}分析に失敗: ${errorData.error}`);
      }
    }

    const geminiData = await geminiResponse.json();
    const claudeData = await claudeResponse.json();
    const openaiData = await openaiResponse.json();

    phases[1].status = "completed";
    phases[1].message = "3つのAI分析完了";
    logDataCollection(stockCode, "Phase 2", "success", {
      message: "3つのAI分析完了",
    });

    // Phase 3: 結果統合
    phases[2].status = "processing";
    logDataCollection(stockCode, "Phase 3", "start", { message: "結果統合中" });

    const finalJudgement = calculateOverallJudgment(
      geminiData.result,
      claudeData.result,
      openaiData.result
    );

    phases[2].status = "completed";
    phases[2].message = "分析完了";
    logDataCollection(stockCode, "Phase 3", "success", {
      message: "分析完了",
      judgement: finalJudgement.判断,
      confidence: finalJudgement.信頼度,
    });

    // 最終レポート
    const finalReport = {
      証券コード: stockCode,
      企業名: unifiedData.metadata.企業名,
      統一データ: unifiedData,
      分析結果: {
        Gemini: geminiData.result,
        Claude: claudeData.result,
        OpenAI: openaiData.result,
      },
      総合判断: finalJudgement,
      生成日時: new Date().toISOString(),
      phases,
    };

    return NextResponse.json({
      success: true,
      data: finalReport,
    });
  } catch (error) {
    logApiError("POST", "/api/three-sages-analysis", error, { stockCode });
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";

    // エラー発生したフェーズを特定
    const currentPhase = phases.findIndex(p => p.status === "processing");
    if (currentPhase !== -1) {
      phases[currentPhase].status = "error";
      phases[currentPhase].message = errorMessage;
    }

    return NextResponse.json(
      {
        error: "分析中にエラーが発生しました",
        details: errorMessage,
        phases,
      },
      { status: 500 }
    );
  }
}

// 総合判断を計算
function calculateOverallJudgment(
  geminiResult: AIAnalysisResult,
  claudeResult: AIAnalysisResult,
  openaiResult: AIAnalysisResult
): OverallJudgement {
  const analyses = [geminiResult, claudeResult, openaiResult];
  const recommendations = analyses.map(a => a.推奨の見立て);
  const confidences = analyses.map(a => a.信頼度);

  // 各判断をカウント
  const buyCount = recommendations.filter(r => r === "買い").length;
  const sellCount = recommendations.filter(r => r === "売り").length;
  const holdCount = recommendations.filter(r => r === "保留").length;

  // 平均信頼度
  const avgConfidence = Math.round(confidences.reduce((a, b) => a + b, 0) / 3);

  // 総合判断を決定
  let overall: "買い" | "売り" | "保留";
  let reasoning: string;

  if (buyCount >= 2) {
    overall = "買い";
    reasoning = `3つのAIのうち${buyCount}つが買いを推奨しています。`;
  } else if (sellCount >= 2) {
    overall = "売り";
    reasoning = `3つのAIのうち${sellCount}つが売りを推奨しています。`;
  } else {
    overall = "保留";
    reasoning = `AI間で意見が分かれています（買い:${buyCount}、売り:${sellCount}、保留:${holdCount}）。慎重な判断が必要です。`;
  }

  // 目標株価の統合
  const targetPrices = analyses
    .map(a => a.目標株価)
    .filter(t => t.下限 !== null && t.上限 !== null);

  let integratedTarget: OverallJudgement["目標株価統合"] = null;
  if (targetPrices.length > 0) {
    const lowerBounds = targetPrices
      .map(t => t.下限)
      .filter((v): v is number => v !== null);
    const upperBounds = targetPrices
      .map(t => t.上限)
      .filter((v): v is number => v !== null);

    if (lowerBounds.length > 0 && upperBounds.length > 0) {
      integratedTarget = {
        下限: Math.min(...lowerBounds),
        上限: Math.max(...upperBounds),
        平均下限: Math.round(
          lowerBounds.reduce((a, b) => a + b, 0) / lowerBounds.length
        ),
        平均上限: Math.round(
          upperBounds.reduce((a, b) => a + b, 0) / upperBounds.length
        ),
      };
    }
  }

  return {
    判断: overall,
    信頼度: avgConfidence,
    理由: reasoning,
    詳細: {
      買い推奨: buyCount,
      売り推奨: sellCount,
      保留推奨: holdCount,
    },
    目標株価統合: integratedTarget,
    各AI信頼度: {
      Gemini: geminiResult.信頼度,
      Claude: claudeResult.信頼度,
      OpenAI: openaiResult.信頼度,
    },
  };
}
