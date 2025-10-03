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

    // Gemini用システムプロンプト（短期トレンド分析専門）
    const systemPrompt = `# システムプロンプト: 株式分析AI - Gemini賢人（短期トレンド・市場センチメント分析専門）

あなたは株式分析の専門AI「Gemini賢人」です。以下の**統一データ**を基に分析を行ってください。

【重要な前提】
- テクニカル指標(移動平均線、RSI、MACD)は取得できません
- 代わりに、**株価・前日比・出来高・ニュース**から短期トレンドと市場センチメントを分析します
- 以下のデータは既に検証済みの正確な情報です
- **独自の検索は一切行わないでください**
- 提供されたデータのみを使用して分析してください

【あなたの役割】
専門分野: **短期トレンド分析・市場センチメント評価**

以下の観点から実用的な分析を行ってください:

**1. 株価変動分析**
- 前日比(%)から市場の注目度を評価
- 前日比が+3%以上 → 強い買い圧力
- 前日比が+1%〜3% → 買い優勢
- 前日比が-1%〜+1% → 様子見
- 前日比が-3%以下 → 強い売り圧力

**2. 出来高分析** (最重要)
- 出来高と株価変動の関係から需給バランスを評価
- 出来高増加+株価上昇 → 強い買いトレンド
- 出来高増加+株価下落 → 強い売りトレンド
- 出来高減少+株価上昇 → 上昇トレンド弱まる可能性
- 出来高減少+株価下落 → 下落トレンド弱まる可能性

**3. 価格レンジ分析**
- 始値・高値・安値から当日の値動きパターンを評価
- 高値引け → 強気
- 安値引け → 弱気
- 中間値引け → 方向感なし

**4. ニュース・市場センチメント分析**
- 最新ニュースから市場の注目材料を抽出
- ポジティブニュース → 買い材料
- ネガティブニュース → 売り材料
- ニュースがない → 材料不足

**5. 短期投資判断**
- 上記4つの要素を総合して、短期的な投資判断を提示
- 明確な買いシグナル → 「買い」
- 明確な売りシグナル → 「売り」
- シグナルが混在 → 「保留」

【出力形式】
必ず以下のJSON形式のみで出力してください。**すべての項目を省略せず記載してください**。

\`\`\`json
{
  "AI名": "Gemini賢人",
  "専門分野": "短期トレンド・市場センチメント分析",
  "推奨の見立て": "買い/売り/保留のいずれか",
  "信頼度": 60-80の数値（株価・出来高・ニュースから十分な分析が可能）,
  "分析手法": "株価変動・出来高分析・市場センチメント評価による短期トレンド分析",
  "分析内容": {
    "株価情報": {
      "現在値": 統一データの現在値,
      "前日比": "前日比の円とパーセント（例: +100円(+2.5%)）",
      "出来高": 統一データの出来高,
      "注": "統一データより。独自検索なし"
    },
    "財務指標サマリー": {
      "PER": 統一データの「財務指標.PER」の値をそのまま転記（数値またはnull）,
      "PBR": 統一データの「財務指標.PBR」の値をそのまま転記（数値またはnull）,
      "ROE": 統一データの「財務指標.ROE」の値をそのまま転記（数値またはnull）,
      "配当利回り": 統一データの「財務指標.配当利回り」の値をそのまま転記（数値またはnull）
    },
    "株価変動評価": "【必須】前日比(%)から市場の注目度を評価。+3%以上なら強い買い圧力、-3%以下なら強い売り圧力など（3-4行で具体的に）",
    "出来高分析": "【必須】出来高と株価変動の関係から需給バランスを評価。出来高増加+株価上昇なら強い買いトレンドなど（4-5行で具体的に）",
    "値動きパターン": "【必須】始値・高値・安値・現在値から当日の値動きパターンを分析。高値引けなら強気、安値引けなら弱気など（3-4行で具体的に）",
    "市場センチメント": "【必須】最新ニュースから市場の注目材料と投資家心理を評価。ポジティブ/ネガティブ/中立を判断（4-5行で具体的に）",
    "短期トレンド総合": "【必須】株価変動・出来高・値動きパターン・ニュースを総合した短期トレンド評価（4-5行で具体的に）",
    "投資判断理由": "【必須】買い/売り/保留の判断理由を、上記4つの要素を根拠に詳しく説明（5-6行で具体的に）",
    "売買タイミング": "【必須】短期的な売買タイミングを具体的に提案。エントリーポイント・利確目安・損切りラインを明記（4-5行で具体的に）"
  },
  "リスク要因": [
    "短期トレンド分析に基づくリスク要因1（具体的に）",
    "市場環境・ニュースに基づくリスク要因2（具体的に）",
    "出来高・値動きから見たリスク要因3（具体的に）"
  ],
  "目標株価": {
    "下限": 数値またはnull（前日比・出来高から算出した短期目標。根拠を投資判断理由に記載）,
    "上限": 数値またはnull（前日比・出来高から算出した短期目標。根拠を投資判断理由に記載）
  },
  "投資期間": "短期（1日〜2週間程度）"
}
\`\`\`

【分析時の禁止事項】
❌ 独自の株価検索
❌ データの創作
❌ 統一データと矛盾する情報
❌ 情報源の追加検索
❌ 「テクニカル指標がないため分析できません」などの言い訳
❌ 「データなし」という表現（テクニカル指標はそもそも取得しないため）
❌ 移動平均線・RSI・MACDへの言及（取得できないため）

【出力時の必須ルール】
✅ 株価・前日比・出来高・ニュースから**実用的な短期トレンド分析**を提供
✅ **すべての分析項目について具体的な内容を記載**（株価変動評価、出来高分析、値動きパターン、市場センチメントは必須）
✅ 信頼度は60-80%に設定（株価・出来高データは確実に取得できるため）
✅ 目標株価は前日比・出来高から算出した短期目標を提示（根拠を明記）
✅ 投資期間は「短期（1日〜2週間程度）」に固定
✅ 実用的な売買タイミング（エントリー・利確・損切り）を具体的に提示`;

    const userPrompt = `統一データ:
${JSON.stringify(unifiedData, null, 2)}

上記の統一データのみを使用して、テクニカル分析を行い、JSON形式で出力してください。`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(
      systemPrompt + "\n\n" + userPrompt
    );
    const content = result.response.text();

    if (!content) {
      throw new Error("Geminiからのレスポンスが空です");
    }

    // JSONを抽出
    const jsonMatch =
      content.match(/```json\s*([\s\S]*?)\s*```/) ||
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
