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
    
    // ステップ2: 株価情報を取得（通貨を明確に含める）
    const priceQuery = `株式銘柄「${query}」の現在の株価を通貨単位（ドルまたは円）を明記して教えてください。また終値、前日比、出来高も教えてください。`;
    
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
        rawPriceContent: priceContent,
        currency: priceInfo.currency  // 通貨情報を追加
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
    volume: null,
    currency: null  // 通貨情報を追加
  };
  
  // 通貨判別を含む株価抽出パターン（優先順位順）
  const pricePatterns = [
    { pattern: /\$([\d,]+\.?\d*)/, currency: 'USD' },
    { pattern: /([\d,]+\.?\d*)\s*ドル/, currency: 'USD' },
    { pattern: /([\d,]+\.?\d*)\s*USD/, currency: 'USD' },
    { pattern: /([\d,]+\.?\d*)\s*円/, currency: 'JPY' },
    { pattern: /([\d,]+\.?\d*)\s*JPY/, currency: 'JPY' },
    { pattern: /¥([\d,]+\.?\d*)/, currency: 'JPY' },
    { pattern: /現在の?株価\s*[:：]?\s*([\d,]+\.?\d*)\s*ドル/, currency: 'USD' },
    { pattern: /現在の?株価\s*[:：]?\s*([\d,]+\.?\d*)\s*円/, currency: 'JPY' },
    { pattern: /現在\s*[:：]?\s*([\d,]+\.?\d*)/, currency: null },
    { pattern: /終値\s*[:：]?\s*([\d,]+\.?\d*)/, currency: null },
  ];
  
  for (const { pattern, currency } of pricePatterns) {
    const match = content.match(pattern);
    if (match && !priceInfo.currentPrice) {
      priceInfo.currentPrice = match[1].replace(/,/g, '');
      priceInfo.currency = currency;
      
      // 通貨が不明な場合、コンテキストから推測
      if (!currency) {
        if (content.includes('ドル') || content.includes('USD') || content.includes('$') || content.includes('米国株')) {
          priceInfo.currency = 'USD';
        } else if (content.includes('円') || content.includes('JPY') || content.includes('¥') || content.includes('東証')) {
          priceInfo.currency = 'JPY';
        }
      }
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
  
  // 通貨付きで価格を再フォーマット
  if (priceInfo.currentPrice && priceInfo.currency) {
    const formattedPrice = priceInfo.currentPrice;
    priceInfo.currentPrice = priceInfo.currency === 'USD' ? 
      `$${formattedPrice}` : `${formattedPrice}円`;
  }
  return priceInfo;
}