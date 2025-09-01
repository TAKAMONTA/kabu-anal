import { NextRequest, NextResponse } from "next/server";
import { getPerplexityClient } from "@/app/lib/perplexity";
import { checkRateLimit } from "@/app/lib/rateLimiter";

// 銘柄検索APIエンドポイント
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

    const { query, searchType = 'stock' } = await request.json();

    // 入力検証
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "検索クエリが必要です" },
        { status: 400 }
      );
    }

    // Perplexity APIキーのチェック
    if (!process.env.PERPLEXITY_API_KEY) {
      console.warn('Perplexity API key not configured, using fallback search');
      return fallbackSearch(query);
    }

    try {
      const perplexity = getPerplexityClient();
      
      // 検索クエリの構築
      let searchQuery = '';
      if (searchType === 'stock') {
        searchQuery = `日本または米国の株式市場で「${query}」に関連する企業を検索してください。証券コード、企業名、業種、最新の株価情報を含めてください。`;
      } else {
        searchQuery = query;
      }

      // Perplexity APIで検索
      const response = await perplexity.search(searchQuery, {
        search_recency_filter: 'month',
        return_citations: true,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // 検索結果から銘柄情報を抽出
      const stocks = extractStockInfo(content);
      
      return NextResponse.json({
        results: stocks,
        rawContent: content,
        citations: response.citations || [],
        searchType,
        query
      });

    } catch (perplexityError) {
      console.error('Perplexity API error:', perplexityError);
      // Perplexity APIエラー時はフォールバックを使用
      return fallbackSearch(query);
    }

  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { error: "銘柄検索中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// フォールバック検索（Perplexity APIが利用できない場合）
function fallbackSearch(query: string) {
  const lowerQuery = query.toLowerCase();
  
  // 基本的な銘柄データ（Perplexity APIが使えない時用）
  const stockDatabase = [
    // 日本株
    { code: '7203', name: 'トヨタ自動車', market: 'JP', industry: '自動車' },
    { code: '6758', name: 'ソニーグループ', market: 'JP', industry: 'エレクトロニクス' },
    { code: '9432', name: '日本電信電話', market: 'JP', industry: '通信' },
    { code: '6861', name: 'キーエンス', market: 'JP', industry: 'センサー・計測機器' },
    { code: '9983', name: 'ファーストリテイリング', market: 'JP', industry: 'アパレル' },
    { code: '8306', name: '三菱UFJフィナンシャル・グループ', market: 'JP', industry: '銀行' },
    { code: '4063', name: '信越化学工業', market: 'JP', industry: '化学' },
    { code: '9984', name: 'ソフトバンクグループ', market: 'JP', industry: '通信・投資' },
    { code: '7267', name: 'ホンダ', market: 'JP', industry: '自動車' },
    { code: '6902', name: 'デンソー', market: 'JP', industry: '自動車部品' },
    
    // 米国株
    { code: 'AAPL', name: 'Apple Inc.', market: 'US', industry: 'Technology' },
    { code: 'MSFT', name: 'Microsoft Corporation', market: 'US', industry: 'Software' },
    { code: 'GOOGL', name: 'Alphabet Inc.', market: 'US', industry: 'Internet' },
    { code: 'AMZN', name: 'Amazon.com Inc.', market: 'US', industry: 'E-commerce' },
    { code: 'NVDA', name: 'NVIDIA Corporation', market: 'US', industry: 'Semiconductors' },
    { code: 'TSLA', name: 'Tesla Inc.', market: 'US', industry: 'Electric Vehicles' },
    { code: 'META', name: 'Meta Platforms Inc.', market: 'US', industry: 'Social Media' },
    { code: 'BRK.B', name: 'Berkshire Hathaway Inc.', market: 'US', industry: 'Conglomerate' },
    { code: 'JPM', name: 'JPMorgan Chase & Co.', market: 'US', industry: 'Banking' },
    { code: 'V', name: 'Visa Inc.', market: 'US', industry: 'Payment Processing' },
  ];

  // 検索ロジック
  const results = stockDatabase.filter(stock => 
    stock.code.toLowerCase().includes(lowerQuery) ||
    stock.name.toLowerCase().includes(lowerQuery) ||
    stock.industry.toLowerCase().includes(lowerQuery)
  );

  return NextResponse.json({
    results: results.map(stock => ({
      ...stock,
      description: `${stock.name}は${stock.industry}セクターの企業です。`,
      source: 'local'
    })),
    searchType: 'fallback',
    query,
    message: 'Perplexity APIが利用できないため、ローカルデータベースから検索しました'
  });
}

// 検索結果から銘柄情報を抽出
function extractStockInfo(content: string): Array<{
  code: string;
  name: string;
  market: string;
  price?: string;
  change?: string;
  description?: string;
}> {
  const stocks: Array<any> = [];
  
  // 証券コードパターン（日本株: 4桁数字、米国株: 1-5文字の大文字）
  const jpPattern = /\b(\d{4})\b/g;
  const usPattern = /\b([A-Z]{1,5})\b/g;
  
  // 簡易的な抽出ロジック（実際はより高度な自然言語処理が必要）
  const lines = content.split('\n');
  
  lines.forEach(line => {
    // 日本株の検出
    const jpMatches = line.match(jpPattern);
    if (jpMatches) {
      jpMatches.forEach(code => {
        // コードの前後から企業名を推測
        const nameMatch = line.match(new RegExp(`(\\S+(?:\\s+\\S+)*?)\\s*[（(]?${code}[）)]?`));
        if (nameMatch) {
          stocks.push({
            code,
            name: nameMatch[1],
            market: 'JP',
            description: line
          });
        }
      });
    }
    
    // 米国株の検出
    const usMatches = line.match(usPattern);
    if (usMatches) {
      usMatches.forEach(code => {
        // ティッカーシンボルとして妥当なものだけ
        if (code.length >= 1 && code.length <= 5 && !['THE', 'AND', 'FOR', 'NYSE', 'NASDAQ'].includes(code)) {
          stocks.push({
            code,
            name: code, // 名前は後で補完
            market: 'US',
            description: line
          });
        }
      });
    }
  });
  
  // 重複を除去
  const uniqueStocks = stocks.filter((stock, index, self) =>
    index === self.findIndex(s => s.code === stock.code)
  );
  
  return uniqueStocks.slice(0, 10); // 最大10件まで
}