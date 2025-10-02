import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { logger, logApiError } from "@/app/lib/logger";

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

    // Claude用システムプロンプト（ファンダメンタル分析専門）
    const systemPrompt = `# システムプロンプト: 株式分析AI

あなたは株式分析の専門AIです。以下の**統一データ**を基に分析を行ってください。

【重要】
- 以下のデータは既に検証済みの正確な情報です
- **独自の検索や推測は一切行わないでください**
- 提供されたデータのみを使用して分析してください
- データに含まれない情報については「データなし」と記載してください

【あなたの役割】
専門分野: ファンダメンタル分析
以下の観点から分析してください:
- 企業の財務健全性（PER・PBR・ROE）
- 収益性と成長性
- 配当政策
- 業界内ポジション
- 経営戦略の評価
- 中長期的な投資価値

【出力形式】
必ず以下のJSON形式のみで出力してください。説明文や前後のコメントは一切不要です。
\`\`\`json
{
  "AI名": "Claude賢人",
  "専門分野": "ファンダメンタル分析",
  "推奨の見立て": "買い/売り/保留のいずれか",
  "信頼度": 0-100の数値,
  "分析内容": {
    "株価情報": {
      "現在値": 統一データの現在値,
      "注": "統一データより。独自検索なし"
    },
    "財務健全性": "実際の分析内容",
    "収益性評価": "実際の分析内容",
    "バリュエーション": "実際の分析内容",
    "配当政策": "実際の分析内容",
    "成長性分析": "実際の分析内容",
    "投資価値": "実際の分析内容"
  },
  "リスク要因": [
    "実際のリスク要因"
  ],
  "目標株価": {
    "下限": 数値またはnull,
    "上限": 数値またはnull
  },
  "投資期間": "実際の投資期間"
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

上記の統一データのみを使用して、ファンダメンタル分析を行い、JSON形式で出力してください。`;

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
      message.content[0]?.type === "text"
        ? message.content[0].text
        : "";

    if (!content) {
      throw new Error("Claudeからのレスポンスが空です");
    }

    // JSONを抽出
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
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
