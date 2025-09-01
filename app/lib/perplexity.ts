// Perplexity API クライアント設定

interface PerplexitySearchRequest {
  query: string;
  return_citations?: boolean;
  return_images?: boolean;
  return_related_questions?: boolean;
}

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
}

class PerplexityClient {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, options?: Partial<PerplexitySearchRequest>): Promise<PerplexityResponse> {
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: 'あなたは株式投資の専門家です。最新の株式市場情報と企業情報を提供してください。'
      },
      {
        role: 'user',
        content: query
      }
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online', // リアルタイム検索対応モデル
        messages,
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        return_citations: options?.return_citations !== false,
        return_images: options?.return_images || false,
        return_related_questions: options?.return_related_questions || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Perplexity API error: ${response.status} - ${error.message || 'Unknown error'}`);
    }

    return response.json();
  }

  async searchStockInfo(stockCode: string, companyName?: string): Promise<{
    companyInfo: any;
    latestNews: string[];
    stockPrice?: string;
    marketTrend?: string;
  }> {
    const searchQuery = companyName 
      ? `${companyName} (${stockCode}) の最新の株価情報、企業ニュース、業績、市場動向を教えてください。`
      : `証券コード ${stockCode} の企業について、最新の株価情報、企業ニュース、業績、市場動向を教えてください。`;

    try {
      const response = await this.search(searchQuery, {
        return_citations: true,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // レスポンスから情報を抽出（実際の実装では構造化されたデータを返すように調整）
      return {
        companyInfo: {
          description: content,
          citations: response.citations || []
        },
        latestNews: response.citations || [],
        stockPrice: this.extractStockPrice(content),
        marketTrend: this.extractMarketTrend(content)
      };
    } catch (error) {
      console.error('Perplexity search error:', error);
      throw error;
    }
  }

  private extractStockPrice(content: string): string | undefined {
    // 株価情報を抽出するロジック（正規表現など）
    const priceMatch = content.match(/([0-9,]+\.?[0-9]*)\s*円/);
    return priceMatch ? priceMatch[1] : undefined;
  }

  private extractMarketTrend(content: string): string | undefined {
    // 市場トレンドを抽出するロジック
    if (content.includes('上昇') || content.includes('好調')) return 'bullish';
    if (content.includes('下落') || content.includes('低迷')) return 'bearish';
    return 'neutral';
  }
}

// シングルトンインスタンス
let perplexityClient: PerplexityClient | null = null;

export function getPerplexityClient(): PerplexityClient {
  if (!perplexityClient) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY is not set in environment variables');
    }
    perplexityClient = new PerplexityClient(apiKey);
  }
  return perplexityClient;
}

export { PerplexityClient, type PerplexitySearchRequest, type PerplexityResponse };