import { NextRequest, NextResponse } from "next/server";
import openai from "@/app/lib/openai";
import { checkRateLimit } from "@/app/lib/rateLimiter";

// OpenAIを使った本格的な銘柄分析
export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = checkRateLimit(clientId);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "リクエスト制限に達しました",
          message: `${rateLimit.resetIn}秒後に再試行してください`,
          resetIn: rateLimit.resetIn 
        },
        { status: 429 }
      );
    }

    const { stockCode, companyInfo, priceInfo } = await request.json();

    // 入力検証
    if (!stockCode || !companyInfo) {
      return NextResponse.json(
        { error: "銘柄コードと企業情報が必要です" },
        { status: 400 }
      );
    }

    console.log('Analyzing stock with OpenAI:', stockCode);

    // OpenAI APIで詳細分析
    const analysisPrompt = `
あなたは経験豊富な株式アナリストです。以下の情報を基に、${stockCode}の詳細な投資分析を行ってください。

【企業情報】
${companyInfo}

【現在の株価情報】
${JSON.stringify(priceInfo, null, 2)}

【分析項目】
以下のJSON形式で分析結果を提供してください：

{
  "summary": "総合評価サマリー（100文字程度）",
  "investmentScore": 75,  // 投資魅力度スコア（0-100）
  "recommendation": "BUY/HOLD/SELL",
  "analysis": {
    "strengths": ["強み1", "強み2", "強み3"],
    "weaknesses": ["弱み1", "弱み2"],
    "opportunities": ["機会1", "機会2"],
    "threats": ["脅威1", "脅威2"]
  },
  "technicalAnalysis": {
    "trend": "上昇トレンド/横ばい/下降トレンド",
    "support": "サポートライン価格",
    "resistance": "レジスタンスライン価格",
    "momentum": "強い/普通/弱い"
  },
  "fundamentalAnalysis": {
    "valuation": "割安/適正/割高",
    "growthPotential": "高い/中程度/低い",
    "profitability": "優良/普通/懸念あり",
    "financialHealth": "健全/普通/要注意"
  },
  "risks": [
    {
      "type": "市場リスク",
      "level": "高/中/低",
      "description": "説明"
    }
  ],
  "targetPrice": {
    "sixMonths": "6ヶ月後の目標株価",
    "oneYear": "1年後の目標株価",
    "upside": "上昇余地（％）"
  },
  "keyMetrics": {
    "per": "PER値",
    "pbr": "PBR値",
    "roe": "ROE値",
    "dividendYield": "配当利回り"
  },
  "recentNews": [
    "最新ニュース1",
    "最新ニュース2"
  ],
  "analystNote": "アナリストからの特記事項"
}

重要：必ずJSON形式で回答してください。`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは経験豊富な株式アナリストです。データに基づいた客観的な分析を提供します。"
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.3,  // より正確で一貫性のある分析のため低めに設定
      response_format: { type: "json_object" },
      max_tokens: 4000,  // より詳細な分析のため増加
    });

    const analysisResult = completion.choices[0].message.content;
    if (!analysisResult) {
      throw new Error("分析結果の生成に失敗しました");
    }

    const analysis = JSON.parse(analysisResult);

    console.log('Analysis completed:', analysis.summary);

    return NextResponse.json({
      stockCode,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stock analysis error:', error);
    return NextResponse.json(
      { error: "分析に失敗しました" },
      { status: 500 }
    );
  }
}