// AI分析用プロンプトテンプレート

// ステップ1: 企業の特定
export const identifyCompanyPrompt = (stockCode: string, market: 'JP' | 'US') => {
  if (market === 'JP') {
    return `証券コード${stockCode}の企業はどこですか？正式な企業名を教えてください。`;
  } else {
    return `ティッカーシンボル${stockCode}の企業はどこですか？正式な企業名を教えてください。`;
  }
};

// ステップ2: 株価の取得
export const getCurrentPricePrompt = (companyName: string, stockCode: string) => {
  return `${companyName}（${stockCode}）の現在の株価を教えてください。前日比の変動率も含めて教えてください。`;
};

// ステップ3: 詳細分析
export const generateKartePrompt = (stockCode: string, stockName: string, currentPrice: number, market: 'JP' | 'US') => {
  return `
あなたは株式投資の専門アナリストです。以下の銘柄について、個人投資家向けの詳細な分析カルテを作成してください。

【分析対象】
銘柄コード: ${stockCode}
企業名: ${stockName}
現在株価: ${currentPrice}円
市場: ${market === 'JP' ? '日本株' : '米国株'}

【分析項目と出力形式】
以下のJSON形式で厳密に出力してください。数値は必ず数値型で、文字列は文字列型で返してください。

{
  "stockInfo": {
    "code": "${stockCode}",
    "name": "${stockName}",
    "price": [現在の株価を数値で],
    "changePercent": [前日比変動率を数値で],
    "market": "${market}",
    "lastUpdated": "[YYYY-MM-DD HH:mm:ss形式]"
  },
  "companyOverview": {
    "business": "[事業内容を30文字以内で要約]",
    "description": "[企業の特徴、強み、ビジネスモデルを150文字以内で説明]",
    "founded": "[設立年]",
    "employees": [従業員数を数値で],
    "headquarters": "[本社所在地]",
    "website": "[公式ウェブサイトURL]",
    "industry": "[業種]",
    "sector": "[セクター]"
  },
  "basicMetrics": {
    "dividend": [1株配当金を数値で],
    "dividendYield": [配当利回り％を数値で],
    "per": [PERを数値で],
    "pbr": [PBRを数値で],
    "roe": [ROE％を数値で],
    "eps": [EPSを数値で],
    "bps": [BPSを数値で],
    "marketCap": [時価総額を数値で]
  },
  "aiScores": {
    "investmentScore": [総合投資スコアを0-10の数値で],
    "growthPrediction": [成長予測スコアを0-10の数値で],
    "riskAssessment": [リスク評価を0-10の数値で。0が低リスク、10が高リスク],
    "aiConfidence": [分析の信頼度を0-1の数値で]
  },
  "financialHealth": {
    "profitability": [収益性を0-10の数値で],
    "stability": [安定性を0-10の数値で],
    "growth": [成長性を0-10の数値で],
    "efficiency": [効率性を0-10の数値で],
    "liquidity": [流動性を0-10の数値で]
  },
  "marketSentiment": {
    "sentiment": "[bullish/neutral/bearishのいずれか]",
    "newsScore": [ニュース評価を0-10の数値で],
    "analystRating": [アナリスト評価を1-5の数値で],
    "socialMention": [SNS言及度を0-10の数値で],
    "institutionalFlow": [機関投資家フローを-10から10の数値で]
  },
  "competitors": [
    {
      "name": "[競合企業名]",
      "score": [競合スコアを0-10の数値で],
      "change": [前期比変動を-100から100の数値で]
    }
  ],
  "technicalIndicators": {
    "trend": "[uptrend/sideways/downtrendのいずれか]",
    "rsi": [RSI値を0-100の数値で],
    "sma20": [20日移動平均を数値で],
    "sma50": [50日移動平均を数値で],
    "volume": "[高水準/平均的/低水準のいずれか]",
    "volatility": [ボラティリティ％を数値で]
  },
  "investmentStyles": {
    "growth": [グロース投資適性を1-5の数値で],
    "value": [バリュー投資適性を1-5の数値で],
    "dividend": [配当投資適性を1-5の数値で],
    "momentum": [モメンタム投資適性を1-5の数値で],
    "quality": [クオリティ投資適性を1-5の数値で]
  },
  "risks": [
    "[主要リスク1]",
    "[主要リスク2]",
    "[主要リスク3]",
    "[主要リスク4]",
    "[主要リスク5]"
  ],
  "opportunities": [
    "[成長機会1]",
    "[成長機会2]",
    "[成長機会3]",
    "[成長機会4]",
    "[成長機会5]"
  ],
  "aiSummary": "[投資判断の総合的なサマリーを200文字以内で。買い/様子見/売りの判断と理由を含める]"
}

【分析の注意点】
1. 最新の市場データと財務情報を基に分析
2. 個人投資家が理解しやすい表現を使用
3. リスクと機会をバランスよく評価
4. 日本の投資家向けに円建てで表示（米国株も円換算）
5. 具体的で実用的なアドバイスを提供

必ずJSON形式で返答し、コメントや説明文は含めないでください。
`;
};

// 段階的なAPI呼び出し用の関数
export const callAIAnalysisStepByStep = async (stockCode: string, market: 'JP' | 'US') => {
  try {
    // ステップ1: 企業を特定
    const companyPrompt = identifyCompanyPrompt(stockCode, market);
    console.log('ステップ1 - 企業特定:', companyPrompt);
    
    // const companyResponse = await callAPI(companyPrompt);
    // const companyName = extractCompanyName(companyResponse);
    const companyName = ""; // APIレスポンスから取得
    
    // ステップ2: 現在の株価を取得
    const pricePrompt = getCurrentPricePrompt(companyName, stockCode);
    console.log('ステップ2 - 株価取得:', pricePrompt);
    
    // const priceResponse = await callAPI(pricePrompt);
    // const { currentPrice, changePercent } = extractPriceInfo(priceResponse);
    const currentPrice = 0; // APIレスポンスから取得
    
    // ステップ3: 詳細な分析を実行
    const analysisPrompt = generateKartePrompt(stockCode, companyName, currentPrice, market);
    console.log('ステップ3 - 詳細分析:', analysisPrompt);
    
    // const analysisResponse = await callAPI(analysisPrompt);
    // return parseAnalysisResponse(analysisResponse);
    
    return null; // 実際のAPIレスポンスに置き換える
  } catch (error) {
    console.error('段階的AI分析エラー:', error);
    throw error;
  }
};

// 汎用API呼び出し関数
const callAPI = async (prompt: string) => {
  // OpenAI/Claude/Gemini APIの呼び出し
  // const response = await fetch(API_ENDPOINT, {
  //   method: 'POST',
  //   headers: { ... },
  //   body: JSON.stringify({ prompt })
  // });
  // return await response.json();
  return null;
};

// 企業名を抽出する補助関数
const extractCompanyName = (response: any): string => {
  // APIレスポンスから企業名を抽出
  // 例: "トヨタ自動車株式会社" や "Apple Inc." など
  return response.companyName || '';
};

// 株価情報を抽出する補助関数
const extractPriceInfo = (response: any): { currentPrice: number; changePercent: number } => {
  // APIレスポンスから株価と変動率を抽出
  return {
    currentPrice: response.price || 0,
    changePercent: response.change || 0
  };
};

// 分析結果をパースする補助関数
const parseAnalysisResponse = (response: any) => {
  // JSON形式の分析結果をパース
  try {
    if (typeof response === 'string') {
      return JSON.parse(response);
    }
    return response;
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
};

// レスポンス検証用の関数
export const validateAIResponse = (response: any): boolean => {
  // 必須フィールドの存在確認
  const requiredFields = [
    'stockInfo', 'companyOverview', 'basicMetrics', 'aiScores',
    'financialHealth', 'marketSentiment', 'competitors',
    'technicalIndicators', 'investmentStyles', 'risks',
    'opportunities', 'aiSummary'
  ];
  
  for (const field of requiredFields) {
    if (!response[field]) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }
  
  // 数値型の検証
  if (typeof response.aiScores.investmentScore !== 'number' ||
      response.aiScores.investmentScore < 0 ||
      response.aiScores.investmentScore > 10) {
    console.error('Invalid investmentScore');
    return false;
  }
  
  // センチメントの検証
  const validSentiments = ['bullish', 'neutral', 'bearish'];
  if (!validSentiments.includes(response.marketSentiment.sentiment)) {
    console.error('Invalid sentiment value');
    return false;
  }
  
  // トレンドの検証
  const validTrends = ['uptrend', 'sideways', 'downtrend'];
  if (!validTrends.includes(response.technicalIndicators.trend)) {
    console.error('Invalid trend value');
    return false;
  }
  
  return true;
};

// エラーハンドリング用のフォールバック
export const getErrorFallback = (stockCode: string, stockName: string) => {
  return {
    stockInfo: {
      code: stockCode,
      name: stockName,
      price: 0,
      changePercent: 0,
      market: 'JP',
      lastUpdated: new Date().toISOString()
    },
    error: true,
    message: 'AI分析に失敗しました。しばらく経ってから再度お試しください。'
  };
};