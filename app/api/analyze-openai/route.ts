import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { logger, logApiError } from "@/app/lib/logger";

interface OpenAIAnalysisResult {
  AI名: string;
  専門分野: string;
  推奨の見立て: "買い" | "売り" | "保留";
  信頼度: number;
  分析内容: {
    株価情報: {
      現在値: number;
      注: string;
    };
    市場環境: string;
    テクニカル総合: string;
    ファンダメンタル総合: string;
    センチメント分析: string;
    短期見通し: string;
    中期見通し: string;
    長期見通し: string;
    投資判断理由: string;
  };
  リスク要因: string[];
  目標株価: {
    下限: number | null;
    上限: number | null;
  };
  推奨投資家タイプ: string;
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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY が設定されていません");
    }

    const openai = new OpenAI({ apiKey });

    // OpenAI用システムプロンプト（総合判断専門）
    const systemPrompt = `# システムプロンプト: 株式分析AI

あなたは株式分析の専門AIです。以下の**統一データ**を基に分析を行ってください。

【重要】
- 以下のデータは既に検証済みの正確な情報です
- **独自の検索や推測は一切行わないでください**
- 提供されたデータのみを使用して分析してください
- データに含まれない情報については「データなし」と記載してください

【あなたの役割】
専門分野: 総合判断
以下の観点から分析してください:
- テクニカル×ファンダメンタルの統合
- 市場センチメントの評価
- ニュースインパクトの分析
- リスク・リターンバランス
- 投資家タイプ別の推奨
- 総合的な投資判断

【出力形式】
必ず以下のJSON形式のみで出力してください。説明文や前後のコメントは一切不要です。
\`\`\`json
{
  "AI名": "OpenAI賢人",
  "専門分野": "総合判断",
  "推奨の見立て": "買い/売り/保留のいずれか",
  "信頼度": 0-100の数値,
  "分析内容": {
    "株価情報": {
      "現在値": 統一データの現在値,
      "注": "統一データより。独自検索なし"
    },
    "市場環境": "実際の分析内容",
    "テクニカル総合": "実際の分析内容",
    "ファンダメンタル総合": "実際の分析内容",
    "センチメント分析": "実際の分析内容",
    "短期見通し": "実際の分析内容",
    "中期見通し": "実際の分析内容",
    "長期見通し": "実際の分析内容",
    "投資判断理由": "実際の分析内容"
  },
  "リスク要因": [
    "実際のリスク要因"
  ],
  "目標株価": {
    "下限": 数値またはnull,
    "上限": 数値またはnull
  },
  "推奨投資家タイプ": "実際の推奨内容"
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
- データ取得日時を明記
- 分析の根拠を明確に記載
- 信頼度は客観的に評価（データの質・量・分析の確実性）`;

    const userPrompt = `統一データ:
${JSON.stringify(unifiedData, null, 2)}

データ取得日時: ${unifiedData.metadata?.収集日時}

上記の統一データのみを使用して、総合的な投資判断を行い、JSON形式で出力してください。`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: systemPrompt + "\n\n" + userPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAIからのレスポンスが空です");
    }

    // JSONを抽出
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                     content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      logger.error({ contentLength: content.length }, "OpenAI JSON抽出失敗");
      throw new Error("JSONデータの抽出に失敗しました");
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const analysisResult: OpenAIAnalysisResult = JSON.parse(jsonString);

    return NextResponse.json({
      success: true,
      result: analysisResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logApiError("POST", "/api/analyze-openai", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      {
        error: "OpenAI分析中にエラーが発生しました",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
