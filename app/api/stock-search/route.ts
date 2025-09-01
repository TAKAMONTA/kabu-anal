import { NextRequest, NextResponse } from "next/server";
import { getPerplexityClient } from "@/app/lib/perplexity";
import { checkRateLimit } from "@/app/lib/rateLimiter";

// 銘柄検索APIエンドポイント - Perplexity APIのみ使用
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

    const { query } = await request.json();

    // 入力検証
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "検索クエリが必要です" },
        { status: 400 }
      );
    }

    // Perplexity APIキーのチェック
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: "Perplexity APIキーが設定されていません" },
        { status: 500 }
      );
    }

    const perplexity = getPerplexityClient();
    
    // ステップ1: 銘柄情報を検索
    const searchQuery = `株式銘柄「${query}」について、企業名と証券コードまたはティッカーシンボルを教えてください`;

    console.log('Step 1 - Searching with Perplexity:', searchQuery);

    // Perplexity APIで検索
    const searchResponse = await perplexity.search(searchQuery);
    const searchContent = searchResponse.choices[0]?.message?.content || '';
    console.log('Step 1 Response:', searchContent);
    
    // ステップ2: 株価情報を取得
    const priceQuery = `株式銘柄「${query}」の現在の株価、終値、前日比、出来高を教えてください。数値のみを簡潔に答えてください。`;
    
    console.log('Step 2 - Getting stock price:', priceQuery);
    
    const priceResponse = await perplexity.search(priceQuery);
    const priceContent = priceResponse.choices[0]?.message?.content || '';
    console.log('Step 2 Response:', priceContent);
    
    // 株価情報を抽出
    const priceInfo = extractPriceInfo(priceContent);
    
    // 結果を統合して返す
    return NextResponse.json({
      results: [{
        query: query,
        companyInfo: searchContent,
        priceInfo: priceInfo,
        rawPriceContent: priceContent
      }],
      rawContent: searchContent
    });

  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { error: "検索に失敗しました" },
      { status: 500 }
    );
  }
}

// 株価情報を抽出する関数
function extractPriceInfo(content: string) {
  const priceInfo: any = {
    currentPrice: null,
    previousClose: null,
    change: null,
    changePercent: null,
    volume: null
  };
  
  // 株価を抽出（例: "59.03ドル", "1,234円", "$59.03"）
  const pricePatterns = [
    /([\d,]+\.?\d*)\s*円/,
    /([\d,]+\.?\d*)\s*ドル/,
    /\$([\d,]+\.?\d*)/,
    /現在\s*[:：]?\s*([\d,]+\.?\d*)/,
    /終値\s*[:：]?\s*([\d,]+\.?\d*)/,
  ];
  
  for (const pattern of pricePatterns) {
    const match = content.match(pattern);
    if (match && !priceInfo.currentPrice) {
      priceInfo.currentPrice = match[1].replace(/,/g, '');
      break;
    }
  }
  
  // 前日比を抽出
  const changePatterns = [
    /([+-]?[\d,]+\.?\d*)\s*\(([+-]?[\d.]+)%\)/,
    /前日比\s*[:：]?\s*([+-]?[\d,]+\.?\d*)/,
    /([+-]?[\d.]+)%/
  ];
  
  for (const pattern of changePatterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[1] && match[1].includes('%')) {
        priceInfo.changePercent = match[1].replace('%', '');
      } else if (match[2]) {
        priceInfo.change = match[1].replace(/,/g, '');
        priceInfo.changePercent = match[2];
      } else if (match[1]) {
        priceInfo.change = match[1].replace(/,/g, '');
      }
      break;
    }
  }
  
  // 出来高を抽出
  const volumePatterns = [
    /出来高\s*[:：]?\s*([\d,]+)/,
    /取引量\s*[:：]?\s*([\d,]+)/,
    /[Vv]olume\s*[:：]?\s*([\d,]+)/
  ];
  
  for (const pattern of volumePatterns) {
    const match = content.match(pattern);
    if (match) {
      priceInfo.volume = match[1].replace(/,/g, '');
      break;
    }
  }
  
  console.log('Extracted price info:', priceInfo);
  return priceInfo;
}