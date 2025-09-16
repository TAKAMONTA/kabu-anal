import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "query パラメータが必要です" },
      { status: 400 }
    );
  }

  try {
    const prompt = `
    あなたは経験豊富な株式アナリストです。
    投資初心者にもわかりやすく、かつ中級者にも価値のある分析を提供してください。
    平易な言葉を使いながらも、背景や理由も含めて1〜2文で説明してください。

    ${query} について以下の5つの観点で詳細に分析してください：

    ### 1. 企業概要
    この企業のビジネスモデルと市場での位置づけを説明してください：
    - 主力事業とその特徴
    - 業界での競争優位性
    - 私たちの生活への影響

    ### 2. 良いところ
    この企業の競争力の源泉となる強みを分析してください：
    - 技術力や特許などの無形資産
    - ブランド力や顧客基盤
    - 財務体質や収益性
    - 成長性や将来性

    ### 3. 注意点
    投資する際に注意すべきリスクや課題を説明してください：
    - 業界特有のリスク
    - 競合他社との比較での弱み
    - 経営上の課題
    - 外部環境の影響

    ### 4. 株価が動く理由
    株価に影響を与える主要な要因を分析してください：
    - 業績発表や決算内容
    - 業界トレンドや市場環境
    - 経営方針や新規事業
    - 経済指標や金利動向

    ### 5. 投資を考える時のポイント
    この銘柄への投資を検討する際の具体的なアドバイスをしてください：
    - 投資タイミングの考え方
    - リスク管理のポイント
    - 長期・短期それぞれの視点
    - 他の投資選択肢との比較
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    const result = completion.choices[0].message?.content ?? "";

    return NextResponse.json({ result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "AI分析に失敗しました" },
      { status: 500 }
    );
  }
}
