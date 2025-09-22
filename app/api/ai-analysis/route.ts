import { NextRequest, NextResponse } from "next/server";
import {
  validateAPIRequest,
  createErrorResponse,
  createSuccessResponse,
  validateStockQuery,
  detectMarket,
  identifyCompany,
  getCurrentPrice,
  performComprehensiveAnalysis,
  buildAnalysisData,
} from "@/app/lib/apiUtils";
import { ErrorHandler, withErrorHandling } from "@/app/lib/errorHandler";
import type { StockAnalysisRequest, APIResponse } from "@/app/types";

// 統一されたエラーハンドリングを使用したAPI
export const POST = withErrorHandling(async (request: NextRequest) => {
  // リクエストの検証
  const validation = await validateAPIRequest(request, [
    "stockCode",
    "market",
    "step",
  ]);
  if (!validation.valid) {
    return createErrorResponse(
      validation.error!.error,
      400,
      validation.error!.code
    );
  }

  const { stockCode, market, step, previousData } =
    validation.data as StockAnalysisRequest;

  // 銘柄コードの検証
  if (!validateStockQuery(stockCode)) {
    return createErrorResponse(
      "Invalid stock code format",
      400,
      "INVALID_INPUT"
    );
  }

  // 市場の検証
  if (!["JP", "US"].includes(market)) {
    return createErrorResponse(
      "Invalid market. Must be JP or US",
      400,
      "INVALID_INPUT"
    );
  }

  // ステップの検証
  if (![1, 2, 3].includes(step)) {
    return createErrorResponse(
      "Invalid step. Must be 1, 2, or 3",
      400,
      "INVALID_INPUT"
    );
  }

  // Step-based processing
  switch (step) {
    case 1: // Company identification
      const companyData = await identifyCompany(stockCode, market);
      return createSuccessResponse({ ...companyData, step: 1 });

    case 2: // Current price retrieval
      if (!previousData?.companyName) {
        return createErrorResponse(
          "Company name is missing",
          400,
          "MISSING_REQUIRED_FIELD"
        );
      }
      const priceData = await getCurrentPrice(
        stockCode,
        previousData.companyName
      );
      return createSuccessResponse({ ...priceData, step: 2 });

    case 3: // Stock analysis
      if (!previousData?.companyName || !previousData?.currentPrice) {
        return createErrorResponse(
          "Company name or current price is missing",
          400,
          "MISSING_REQUIRED_FIELD"
        );
      }
      const analysisData = await performComprehensiveAnalysis(
        stockCode,
        previousData.companyName,
        previousData.currentPrice,
        market
      );
      return createSuccessResponse({ ...analysisData, step: 3 });

    default:
      return createErrorResponse("Invalid step number", 400, "INVALID_INPUT");
  }
});

// このファイルは統一されたAPIユーティリティを使用するように更新されました
// 古い関数は apiUtils.ts に移動されています
