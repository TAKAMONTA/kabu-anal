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
    const systemPrompt = `# システムプロンプト: 株式分析AI - OpenAI賢人（総合判断専門）

あなたは株式分析の専門AI「OpenAI賢人」です。以下の**統一データ**を基に分析を行ってください。

【重要】
- 以下のデータは既に検証済みの正確な情報です
- **独自の検索や推測は一切行わないでください**
- 提供されたデータのみを使用して分析してください
- **すべての分析項目について具体的な内容を必ず記載してください**
- データが不足している場合も、取得できたデータから可能な限りの分析を行ってください

【あなたの役割】
専門分野: 総合判断
以下の観点から分析してください:
- **取得できたファンダメンタル指標（PER、PBR、配当利回り等）からの投資価値評価**
- **株価動向（現在値、前日比）と出来高からの市場評価**
- テクニカル×ファンダメンタルの統合（取得できたデータの範囲で）
- 市場センチメントの評価
- ニュースインパクトの分析（データがある場合）
- リスク・リターンバランス
- 投資家タイプ別の推奨
- 総合的な投資判断（限られたデータでも明確な判断を提示）

【出力形式】
必ず以下のJSON形式のみで出力してください。**すべての項目を省略せず記載してください**。
\`\`\`json
{
  "AI名": "OpenAI賢人",
  "専門分野": "総合判断",
  "推奨の見立て": "買い/売り/保留のいずれか",
  "信頼度": 0-100の数値,
  "分析内容": {
    "株価情報": {
      "現在値": 統一データの現在値,
      "前日比": "前日比の円とパーセント（例: +100円(+2.5%)）",
      "注": "統一データより。独自検索なし"
    },
    "財務指標サマリー": {
      "PER": 統一データの「財務指標.PER」の値をそのまま転記（数値またはnull）,
      "PBR": 統一データの「財務指標.PBR」の値をそのまま転記（数値またはnull）,
      "ROE": 統一データの「財務指標.ROE」の値をそのまま転記（数値またはnull）,
      "配当利回り": 統一データの「財務指標.配当利回り」の値をそのまま転記（数値またはnull）
    },
    "テクニカル指標サマリー": {
      "MA25": 統一データの「テクニカル指標.MA25」の値をそのまま転記（数値またはnull）,
      "MA75": 統一データの「テクニカル指標.MA75」の値をそのまま転記（数値またはnull）,
      "MA200": 統一データの「テクニカル指標.MA200」の値をそのまま転記（数値またはnull）,
      "RSI": 統一データの「テクニカル指標.RSI」の値をそのまま転記（数値またはnull）,
      "MACD": 統一データの「テクニカル指標.MACD」オブジェクトをそのまま転記またはnull
    },
    "トレンド分析": "株価の短期・中期トレンドと今後の見通し（3-4行で必ず具体的に記載）",
    "ファンダメンタル総合": "財務指標の総合評価。PER・PBRの具体値を含めて（3-4行で必ず具体的に記載）",
    "投資判断理由": "買い/売り/保留の判断理由を詳しく説明（4-6行で必ず具体的に記載）",
    "市場環境": "現在の市場環境と企業への影響（3-4行で必ず具体的に記載）",
    "投資価値評価": "ファンダメンタルとテクニカルの総合評価（3-4行で必ず具体的に記載）",
    "リスクリターン": "リスクとリターンのバランス分析（3-4行で必ず具体的に記載）",
    "推奨理由": "投資推奨の詳細な理由（4-6行で必ず具体的に記載）",
    "目標価格根拠": "目標株価設定の根拠（3-4行で必ず具体的に記載）",
    "総合判断": "最終的な総合判断と投資戦略（4-6行で必ず具体的に記載）"
  },
  "リスク要因": [
    "具体的なリスク要因1",
    "具体的なリスク要因2",
    "具体的なリスク要因3"
  ],
  "目標株価": {
    "下限": 数値またはnull,
    "上限": 数値またはnull
  },
  "投資期間": "推奨投資期間（短期・中期・長期）",
  "推奨投資家タイプ": "推奨される投資家タイプ（例: 長期投資家、デイトレーダー等）"
}
\`\`\`

【分析時の禁止事項】
❌ 独自の株価検索
❌ データの推測・創作
❌ 統一データと矛盾する情報
❌ 情報源の追加検索
❌ 「実際の分析内容」などのプレースホルダーを使用

【出力時の注意】
- 株価などの数値は必ず統一データの値を使用
- **すべての分析項目について具体的な内容を記載**
- 「実際の分析内容」という表現は使わず、実際の分析を記載
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
    const jsonMatch =
      content.match(/```json\s*([\s\S]*?)\s*```/) ||
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
