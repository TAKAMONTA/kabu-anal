import { NextRequest, NextResponse } from "next/server";
import { getPerplexityClient } from "@/app/lib/perplexity";
import OpenAI from "openai";

// 段階的な株式分析APIエンドポイント
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, step = 1, previousData } = body;

    // 入力検証
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "分析対象の銘柄コードまたは企業名が必要です" 
        },
        { status: 400 }
      );
    }

    // APIキーのチェック
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { 
          success: false,
          error: "Perplexity APIキーが設定されていません" 
        },
        { status: 500 }
      );
    }

    const perplexity = getPerplexityClient();

    // クエリが証券コードかティッカーシンボルかを判定
    const isJapaneseCode = /^\d{4}$/.test(query);
    const isUSSymbol = /^[A-Z]{1,5}$/.test(query);

    console.log(`分析ステップ ${step} を実行中: ${query}`);

    switch(step) {
      case 1: {
        // ステップ1: 基本情報の取得
        let basicInfoQuery: string;
        if (isJapaneseCode) {
          basicInfoQuery = `日本株 証券コード ${query} の企業概要、事業内容、業界内での位置づけを教えてください`;
        } else if (isUSSymbol) {
          basicInfoQuery = `米国株 ティッカーシンボル ${query} の企業概要、事業内容、業界内での位置づけを教えてください`;
        } else {
          basicInfoQuery = `企業「${query}」の概要、事業内容、業界内での位置づけを教えてください`;
        }

        const response = await perplexity.search(basicInfoQuery);
        const content = response.choices[0]?.message?.content || '';

        return NextResponse.json({
          success: true,
          step: 1,
          stepName: "基本情報取得",
          data: {
            companyOverview: content
          },
          nextStep: 2,
          message: "基本情報を取得しました。次は最新ニュースを検索します。"
        });
      }

      case 2: {
        // ステップ2: 最新ニュースと動向
        let newsQuery: string;
        if (isJapaneseCode) {
          newsQuery = `日本株 証券コード ${query} の最新ニュース、決算情報、アナリスト評価を教えてください`;
        } else if (isUSSymbol) {
          newsQuery = `米国株 ティッカーシンボル ${query} の最新ニュース、決算情報、アナリスト評価を教えてください`;
        } else {
          newsQuery = `企業「${query}」の最新ニュース、決算情報、アナリスト評価を教えてください`;
        }

        const response = await perplexity.search(newsQuery);
        const content = response.choices[0]?.message?.content || '';

        return NextResponse.json({
          success: true,
          step: 2,
          stepName: "最新ニュース取得",
          data: {
            latestNews: content
          },
          nextStep: 3,
          message: "最新ニュースを取得しました。次は財務データを分析します。"
        });
      }

      case 3: {
        // ステップ3: 財務データと業績
        let financialQuery: string;
        if (isJapaneseCode) {
          financialQuery = `日本株 証券コード ${query} の売上高、利益率、ROE、PER、PBR、配当利回りなどの財務指標を教えてください`;
        } else if (isUSSymbol) {
          financialQuery = `米国株 ティッカーシンボル ${query} の売上高、利益率、ROE、PER、PBR、配当利回りなどの財務指標を教えてください`;
        } else {
          financialQuery = `企業「${query}」の売上高、利益率、ROE、PER、PBR、配当利回りなどの財務指標を教えてください`;
        }

        const response = await perplexity.search(financialQuery);
        const content = response.choices[0]?.message?.content || '';

        return NextResponse.json({
          success: true,
          step: 3,
          stepName: "財務データ分析",
          data: {
            financialData: content
          },
          nextStep: 4,
          message: "財務データを分析しました。次は競合比較を行います。"
        });
      }

      case 4: {
        // ステップ4: 競合他社との比較
        let competitorQuery: string;
        if (isJapaneseCode) {
          competitorQuery = `日本株 証券コード ${query} の主要競合他社とその比較、業界内でのシェアや強みを教えてください`;
        } else if (isUSSymbol) {
          competitorQuery = `米国株 ティッカーシンボル ${query} の主要競合他社とその比較、業界内でのシェアや強みを教えてください`;
        } else {
          competitorQuery = `企業「${query}」の主要競合他社とその比較、業界内でのシェアや強みを教えてください`;
        }

        const response = await perplexity.search(competitorQuery);
        const content = response.choices[0]?.message?.content || '';

        return NextResponse.json({
          success: true,
          step: 4,
          stepName: "競合比較",
          data: {
            competitorAnalysis: content
          },
          nextStep: 5,
          message: "競合比較を完了しました。最後にAI総合分析を行います。"
        });
      }

      case 5: {
        // ステップ5: OpenAIによる総合分析
        if (!process.env.OPENAI_API_KEY) {
          return NextResponse.json({
            success: true,
            step: 5,
            stepName: "AI総合分析",
            data: {
              analysis: "OpenAI APIキーが設定されていないため、総合分析をスキップしました。"
            },
            nextStep: null,
            message: "分析が完了しました。"
          });
        }

        // previousDataは既に取得済み
        
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const analysisPrompt = `
以下の情報を基に、${query}の投資判断に関する総合的な分析を行ってください。
必ず以下の全ての項目について分析し、JSONフォーマットで回答してください：

{
  "investmentScore": 数値（0-100）,
  "recommendation": "BUY" | "HOLD" | "SELL",
  "summary": "総合評価サマリー（200文字程度）",
  
  "swotAnalysis": {
    "strengths": ["強み1", "強み2", "強み3"],
    "weaknesses": ["弱み1", "弱み2", "弱み3"],
    "opportunities": ["機会1", "機会2", "機会3"],
    "threats": ["脅威1", "脅威2", "脅威3"]
  },
  
  "financialHealth": {
    "profitability": "高い/中程度/低い",
    "growthRate": "成長率の評価",
    "debtLevel": "負債水準の評価",
    "cashFlow": "キャッシュフローの評価"
  },
  
  "riskAnalysis": {
    "marketRisk": "市場リスクの説明",
    "businessRisk": "事業リスクの説明",
    "financialRisk": "財務リスクの説明",
    "overallRiskLevel": "高/中/低"
  },
  
  "technicalIndicators": {
    "trend": "上昇/横ばい/下降",
    "momentum": "強い/中立/弱い",
    "support": "サポートレベル",
    "resistance": "レジスタンスレベル"
  },
  
  "valuation": {
    "currentValuation": "割高/適正/割安",
    "targetPrice": "目標株価",
    "upside": "上昇余地（%）"
  },
  
  "investmentHorizon": {
    "shortTerm": "短期（1-3ヶ月）の見通し",
    "mediumTerm": "中期（3-12ヶ月）の見通し",
    "longTerm": "長期（1年以上）の見通し"
  },
  
  "keyPoints": [
    "重要ポイント1",
    "重要ポイント2",
    "重要ポイント3"
  ]
}

【提供された情報】
${previousData ? JSON.stringify(previousData, null, 2) : '情報なし'}

必ずJSONフォーマットで、全ての項目を含めて回答してください。
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "あなたは経験豊富な株式アナリストです。客観的で実用的な分析を提供してください。必ずJSONフォーマットで回答してください。"
            },
            {
              role: "user",
              content: analysisPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        });

        const analysisText = completion.choices[0]?.message?.content || '{}';
        let analysis;
        
        try {
          analysis = JSON.parse(analysisText);
        } catch (e) {
          // JSONパースに失敗した場合は、テキストをそのまま使用
          analysis = { comprehensiveAnalysis: analysisText };
        }

        return NextResponse.json({
          success: true,
          step: 5,
          stepName: "AI総合分析",
          data: analysis,
          nextStep: null,
          message: "全ての分析が完了しました。"
        });
      }

      default:
        return NextResponse.json(
          { 
            success: false,
            error: "無効なステップ番号です" 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "分析中にエラーが発生しました",
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}