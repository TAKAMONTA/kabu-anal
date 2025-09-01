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
    
    // シンプルな検索クエリ
    const searchQuery = `株式銘柄「${query}」について教えてください`;

    console.log('Searching with Perplexity:', searchQuery);

    // Perplexity APIで検索
    const response = await perplexity.search(searchQuery);

    const content = response.choices[0]?.message?.content || '';
    console.log('Perplexity Response:', content);
    
    // 結果をそのまま返す
    return NextResponse.json({
      results: [{
        query: query,
        content: content
      }],
      rawContent: content
    });

  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { error: "検索に失敗しました" },
      { status: 500 }
    );
  }
}