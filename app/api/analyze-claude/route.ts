import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { logger, logApiError } from "@/app/lib/logger";
import {
  createClaudeSystemPrompt,
  createClaudeUserPrompt,
} from "@/app/lib/prompts/three-sages";

interface ClaudeAnalysisResult {
  AI名: string;
  専門分野: string;
  推奨の見立て: "買い" | "売り" | "保留";
  信頼度: number;
  分析内容: {
    株価情報: {
      現在値: number;
      注: string;
    };
    財務健全性: string;
    収益性評価: string;
    バリュエーション: string;
    配当政策: string;
    成長性分析: string;
    投資価値: string;
  };
  リスク要因: string[];
  目標株価: {
    下限: number | null;
    上限: number | null;
  };
  投資期間: string;
}

export async function POST(request: NextRequest) {
  try {
    const { unifiedData } = await request.json();

    if (!unifiedData) {
      return NextResponse.json(
        { error: "統一データが必要です" },
        { status: 400 }
      );
    }

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY が設定されていません");
    }

    const anthropic = new Anthropic({ apiKey });

    // Claude用プロンプト（プロンプトモジュールから取得）
    const systemPrompt = createClaudeSystemPrompt();
    const userPrompt = createClaudeUserPrompt(unifiedData);

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: systemPrompt + "\n\n" + userPrompt,
        },
      ],
    });

    const content =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    if (!content) {
      throw new Error("Claudeからのレスポンスが空です");
    }

    // JSONを抽出
    const jsonMatch =
      content.match(/```json\s*([\s\S]*?)\s*```/) ||
      content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      logger.error({ contentLength: content.length }, "Claude JSON抽出失敗");
      throw new Error("JSONデータの抽出に失敗しました");
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const analysisResult: ClaudeAnalysisResult = JSON.parse(jsonString);

    return NextResponse.json({
      success: true,
      result: analysisResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logApiError("POST", "/api/analyze-claude", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      {
        error: "Claude分析中にエラーが発生しました",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
