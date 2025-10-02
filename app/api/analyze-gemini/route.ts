import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger, logApiError } from "@/app/lib/logger";

interface GeminiAnalysisResult {
  AI名: string;
  専門分野: string;
  推奨の見立て: "買い" | "売り" | "保留";
  信頼度: number;
  分析内容: {
    株価情報: {
      現在値: number;
      注: string;
    };
    トレンド分析: string;
    オシレーター: string;
    サポートライン: string;
    レジスタンスライン: string;
    売買タイミング: string;
  };
  リスク要因: string[];
  目標株価: {
    下限: number | null;
    上限: number | null;
  };
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY が設定されていません");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Gemini用システムプロンプト（テクニカル分析専門）
    const systemPrompt = `# システムプロンプト: 株式分析AI

あなたは株式分析の専門AIです。以下の**統一データ**を基に分析を行ってください。

【重要】
- 以下のデータは既に検証済みの正確な情報です
- **独自の検索や推測は一切行わないでください**
- 提供されたデータのみを使用して分析してください
- データに含まれない情報については「データなし」と記載してください

【あなたの役割】
専門分野: テクニカル分析
以下の観点から分析してください:
- チャートパターンの識別
- 移動平均線との位置関係
- RSI・MACDなどのオシレーター分析
- サポート・レジスタンスライン
- トレンドの強さと持続性
- 短期的な売買タイミング

【出力形式】
必ず以下のJSON形式のみで出力してください。説明文や前後のコメントは一切不要です。
\`\`\`json
{
  "AI名": "Gemini賢人",
  "専門分野": "テクニカル分析",
  "推奨の見立て": "買い/売り/保留のいずれか",
  "信頼度": 0-100の数値,
  "分析内容": {
    "株価情報": {
      "現在値": 統一データの現在値,
      "注": "統一データより。独自検索なし"
    },
    "トレンド分析": "実際の分析内容",
    "オシレーター": "実際の分析内容",
    "サポートライン": "実際の分析内容",
    "レジスタンスライン": "実際の分析内容",
    "売買タイミング": "実際の分析内容"
  },
  "リスク要因": [
    "実際のリスク要因"
  ],
  "目標株価": {
    "下限": 数値またはnull,
    "上限": 数値またはnull
  }
}
\`\`\`

【分析時の禁止事項】
❌ 独自の株価検索
❌ データの推測・創作
❌ 統一データと矛盾する情報
❌ 情報源の追加検索
❌ 「最新情報を調べると...」といった表現

【出力時の注意】
- 株価などの数値は必ず統一データの値を使用
- データ取得日時を明記: 「${unifiedData.metadata?.収集日時}時点のデータに基づく分析」
- 分析の根拠を明確に記載
- 信頼度は客観的に評価（データの質・量・分析の確実性）`;

    const userPrompt = `統一データ:
${JSON.stringify(unifiedData, null, 2)}

上記の統一データのみを使用して、テクニカル分析を行い、JSON形式で出力してください。`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt);
    const content = result.response.text();

    if (!content) {
      throw new Error("Geminiからのレスポンスが空です");
    }

    // JSONを抽出
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                     content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      logger.error({ contentLength: content.length }, "Gemini JSON抽出失敗");
      throw new Error("JSONデータの抽出に失敗しました");
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const analysisResult: GeminiAnalysisResult = JSON.parse(jsonString);

    return NextResponse.json({
      success: true,
      result: analysisResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logApiError("POST", "/api/analyze-gemini", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      {
        error: "Gemini分析中にエラーが発生しました",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
