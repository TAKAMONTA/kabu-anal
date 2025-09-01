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
        searchQuery = `株式銘柄「${query}」について、証券コードと企業名を教えてください。日本株なら4桁の証券コード、米国株ならティッカーシンボルを含めてください。`;
      } else {
        searchQuery = query;
      }

      console.log('Searching with Perplexity API:', searchQuery);

      // Perplexity APIで検索
      const response = await perplexity.search(searchQuery, {
        return_citations: true,
      });

      const content = response.choices[0]?.message?.content || '';
      console.log('Perplexity API response received, content length:', content.length);
      
      // 検索結果から銘柄情報を抽出
      const stocks = extractStockInfo(content);
      
      // 結果が空の場合はフォールバックも試す
      if (stocks.length === 0) {
        console.log('No stocks extracted from Perplexity response, trying fallback');
        return fallbackSearch(query);
      }
      
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
    // 日本株 - 主要銘柄
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
    { code: '6501', name: '日立製作所', market: 'JP', industry: '総合電機' },
    { code: '6702', name: '富士通', market: 'JP', industry: 'IT・通信' },
    { code: '7751', name: 'キヤノン', market: 'JP', industry: '精密機器' },
    { code: '6981', name: '村田製作所', market: 'JP', industry: '電子部品' },
    { code: '4661', name: 'オリエンタルランド', market: 'JP', industry: 'レジャー' },
    { code: '9433', name: 'KDDI', market: 'JP', industry: '通信' },
    { code: '8035', name: '東京エレクトロン', market: 'JP', industry: '半導体製造装置' },
    { code: '4502', name: '武田薬品工業', market: 'JP', industry: '医薬品' },
    { code: '7974', name: '任天堂', market: 'JP', industry: 'ゲーム' },
    { code: '8058', name: '三菱商事', market: 'JP', industry: '商社' },
    
    // 米国株 - 主要銘柄
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
    { code: 'JNJ', name: 'Johnson & Johnson', market: 'US', industry: 'Healthcare' },
    { code: 'WMT', name: 'Walmart Inc.', market: 'US', industry: 'Retail' },
    { code: 'PG', name: 'Procter & Gamble', market: 'US', industry: 'Consumer Goods' },
    { code: 'MA', name: 'Mastercard Inc.', market: 'US', industry: 'Payment Processing' },
    { code: 'DIS', name: 'Walt Disney Co.', market: 'US', industry: 'Entertainment' },
    { code: 'NFLX', name: 'Netflix Inc.', market: 'US', industry: 'Streaming' },
    { code: 'ADBE', name: 'Adobe Inc.', market: 'US', industry: 'Software' },
    { code: 'CRM', name: 'Salesforce Inc.', market: 'US', industry: 'Cloud Software' },
    { code: 'ORCL', name: 'Oracle Corporation', market: 'US', industry: 'Enterprise Software' },
    { code: 'IBM', name: 'IBM Corporation', market: 'US', industry: 'Technology Services' },
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
  // AIの回答から銘柄情報を構造化して抽出を試みる
  const stocks: Array<any> = [];
  
  // Perplexityの回答をデバッグ出力
  console.log('Perplexity response content:', content.substring(0, 500));
  
  // パターン1: 「企業名（証券コード）」形式
  const pattern1 = /([^（\(]+)[（\(](\d{4}|[A-Z]{1,5})[）\)]/g;
  let match;
  while ((match = pattern1.exec(content)) !== null) {
    const name = match[1].trim();
    const code = match[2];
    const market = /^\d{4}$/.test(code) ? 'JP' : 'US';
    
    stocks.push({
      code,
      name,
      market,
      description: `${name}の株式情報`
    });
  }
  
  // パターン2: 証券コードまたはティッカーシンボル単独
  const jpPattern = /\b(\d{4})\b/g;
  const usPattern = /\b([A-Z]{2,5})\b/g;
  
  // 日本株コード検索
  const jpMatches = content.match(jpPattern);
  if (jpMatches) {
    jpMatches.forEach(code => {
      // 既に追加済みでなければ追加
      if (!stocks.find(s => s.code === code)) {
        // 前後のテキストから企業名を推定
        const regex = new RegExp(`([^。、\\n]+?)\\s*[（(]?${code}[）)]?`, 'g');
        const nameMatch = regex.exec(content);
        stocks.push({
          code,
          name: nameMatch ? nameMatch[1].trim() : `銘柄 ${code}`,
          market: 'JP',
          description: `証券コード: ${code}`
        });
      }
    });
  }
  
  // 米国株ティッカー検索（一般的な単語を除外）
  const excludeWords = ['AI', 'API', 'NYSE', 'NASDAQ', 'ETF', 'IPO', 'CEO', 'CFO', 'CTO', 'GDP', 'USA', 'JP'];
  const usMatches = content.match(usPattern);
  if (usMatches) {
    usMatches.forEach(code => {
      if (!excludeWords.includes(code) && !stocks.find(s => s.code === code)) {
        // ティッカーシンボルとして妥当そうなものだけ
        if (content.includes(`${code}株`) || content.includes(`${code}の`) || content.includes(`(${code})`)) {
          stocks.push({
            code,
            name: code,
            market: 'US',
            description: `ティッカー: ${code}`
          });
        }
      }
    });
  }
  
  // 重複を除去
  const uniqueStocks = stocks.filter((stock, index, self) =>
    index === self.findIndex(s => s.code === stock.code)
  );
  
  console.log('Extracted stocks:', uniqueStocks);
  
  return uniqueStocks.slice(0, 10); // 最大10件まで
}