// モックデータファイル - AI分析結果のサンプルデータ

export const mockToyotaData = {
  stockInfo: {
    code: '7203',
    name: 'トヨタ自動車',
    price: 3285,
    changePercent: 2.1,
    market: 'JP',
    lastUpdated: '2025-08-31 15:30:00'
  },
  companyOverview: {
    business: '世界最大級の自動車メーカー',
    description: 'ハイブリッド車のパイオニアであり、電気自動車、水素自動車など次世代モビリティをリード。「カイゼン」「ジャストインタイム」などの生産方式で製造業界を革新。レクサスブランドで高級車市場でも存在感を示す。',
    founded: '1937年',
    employees: 375000,
    headquarters: '愛知県豊田市',
    website: 'https://www.toyota.co.jp',
    industry: '自動車製造',
    sector: '製造業'
  },
  basicMetrics: {
    dividend: 250,
    dividendYield: 2.5,
    per: 12.3,
    pbr: 1.2,
    roe: 8.7,
    eps: 267,
    bps: 2745,
    marketCap: 52000000000000
  },
  aiScores: {
    investmentScore: 8.2,
    growthPrediction: 7.4,
    riskAssessment: 3.8,
    aiConfidence: 0.89
  },
  financialHealth: {
    profitability: 8.5,
    stability: 9.2,
    growth: 6.8,
    efficiency: 7.9,
    liquidity: 8.8
  },
  marketSentiment: {
    sentiment: 'bullish' as const,
    newsScore: 7.8,
    analystRating: 4.2,
    socialMention: 6.5,
    institutionalFlow: 3.2
  },
  competitors: [
    { name: 'ホンダ', score: 7.1, change: -0.8 },
    { name: '日産自動車', score: 6.3, change: 1.2 },
    { name: 'スズキ', score: 6.9, change: -0.3 },
    { name: 'マツダ', score: 5.8, change: 0.7 }
  ],
  technicalIndicators: {
    trend: 'uptrend' as const,
    rsi: 62.4,
    sma20: 3180,
    sma50: 3050,
    volume: '高水準',
    volatility: 15.2
  },
  investmentStyles: {
    growth: 3.8,
    value: 4.2,
    dividend: 4.5,
    momentum: 3.5,
    quality: 4.7
  },
  risks: [
    '半導体不足による生産影響',
    '電気自動車への移行コスト',
    '中国市場での競争激化',
    '円安による原材料コスト上昇',
    '自動運転技術開発の遅れ'
  ],
  opportunities: [
    'ハイブリッド技術での優位性',
    '新興国市場での拡大余地',
    '水素燃料電池車の先行投資',
    'モビリティサービス事業の成長',
    '脱炭素社会への技術貢献'
  ],
  aiSummary: '世界最大級の自動車メーカーとして強固な財務基盤を持ち、ハイブリッド技術での競争優位性を活かしながら電気自動車分野でも着実に展開しています。配当性向も安定しており、長期投資に適した銘柄と評価されます。ただし、EV市場での競争激化や半導体不足などの短期的なリスクには注意が必要です。'
};

export const mockAppleData = {
  stockInfo: {
    code: 'AAPL',
    name: 'Apple Inc.',
    price: 52800,  // 円換算価格（$180 x 150円）
    changePercent: -1.2,
    market: 'US',
    lastUpdated: '2025-08-31 22:00:00 EST'
  },
  companyOverview: {
    business: '世界最大のテクノロジー企業',
    description: 'iPhone、iPad、Mac、Apple Watchなどの革新的なハードウェアと、iOS、macOSなどのソフトウェア、App Store、Apple Music、iCloudなどのサービスを統合的に提供。高いブランド力とエコシステムでユーザーを囲い込み、安定した収益を確保。',
    founded: '1976年',
    employees: 164000,
    headquarters: 'カリフォルニア州クパチーノ',
    website: 'https://www.apple.com',
    industry: 'コンシューマーエレクトロニクス',
    sector: 'テクノロジー'
  },
  basicMetrics: {
    dividend: 1320,  // 円換算（$0.24 x 4回 x 150円）
    dividendYield: 0.5,
    per: 28.5,
    pbr: 42.1,
    roe: 147.4,
    eps: 1850,  // 円換算
    bps: 1250,  // 円換算
    marketCap: 427500000000000  // 2.85兆ドル x 150円
  },
  aiScores: {
    investmentScore: 9.1,
    growthPrediction: 8.7,
    riskAssessment: 4.2,
    aiConfidence: 0.94
  },
  financialHealth: {
    profitability: 9.8,
    stability: 8.9,
    growth: 8.2,
    efficiency: 9.5,
    liquidity: 9.3
  },
  marketSentiment: {
    sentiment: 'neutral' as const,
    newsScore: 8.5,
    analystRating: 4.6,
    socialMention: 9.2,
    institutionalFlow: -1.8
  },
  competitors: [
    { name: 'Microsoft', score: 8.9, change: 0.3 },
    { name: 'Google', score: 8.2, change: -0.5 },
    { name: 'Samsung', score: 7.8, change: 1.1 },
    { name: 'Amazon', score: 8.1, change: 0.8 }
  ],
  technicalIndicators: {
    trend: 'sideways' as const,
    rsi: 45.2,
    sma20: 54150,
    sma50: 53200,
    volume: '平均的',
    volatility: 22.8
  },
  investmentStyles: {
    growth: 4.8,
    value: 2.1,
    dividend: 1.5,
    momentum: 3.2,
    quality: 4.9
  },
  risks: [
    'iPhone販売の頭打ち懸念',
    '中国市場でのリスク',
    '規制当局からの圧力',
    'サプライチェーンの脆弱性',
    '新興市場での競争激化'
  ],
  opportunities: [
    'サービス事業の高成長',
    'AR/VR分野への参入',
    '自動運転車開発の可能性',
    'ヘルスケア事業の拡大',
    'インドなど新興市場開拓'
  ],
  aiSummary: 'テクノロジー業界のリーディングカンパニーとして、iPhone を中心とした強力なエコシステムと高い収益性を誇ります。サービス事業の成長と現金創出力の高さが魅力的です。PER は高めですが、ブランド力と技術革新力を考慮すると妥当な水準と判断されます。ただし、iPhone 依存度の高さと中国市場リスクは継続的な監視が必要です。'
};

export const mockSonyData = {
  stockInfo: {
    code: '6758',
    name: 'ソニーグループ',
    price: 12950,
    changePercent: 3.8,
    market: 'JP',
    lastUpdated: '2025-08-31 15:30:00'
  },
  companyOverview: {
    business: 'エンターテインメント・テクノロジー・金融の総合企業',
    description: 'PlayStationを中心としたゲーム事業、音楽、映画などのエンターテインメント事業、イメージセンサーや半導体などのエレクトロニクス事業、そして金融サービス事業を幅広く展開。特にゲーム事業とイメージセンサー事業で世界トップクラスのシェアを誇る。',
    founded: '1946年',
    employees: 113000,
    headquarters: '東京都港区',
    website: 'https://www.sony.com',
    industry: 'コングロマリット（多角的企業）',
    sector: 'テクノロジー・エンターテインメント'
  },
  basicMetrics: {
    dividend: 70,
    dividendYield: 0.5,
    per: 13.2,
    pbr: 2.1,
    roe: 15.9,
    eps: 981,
    bps: 6167,
    marketCap: 15800000000000
  },
  aiScores: {
    investmentScore: 8.7,
    growthPrediction: 8.9,
    riskAssessment: 4.5,
    aiConfidence: 0.91
  },
  financialHealth: {
    profitability: 9.1,
    stability: 7.8,
    growth: 8.7,
    efficiency: 8.4,
    liquidity: 8.2
  },
  marketSentiment: {
    sentiment: 'bullish' as const,
    newsScore: 8.9,
    analystRating: 4.8,
    socialMention: 8.1,
    institutionalFlow: 5.7
  },
  competitors: [
    { name: '任天堂', score: 8.4, change: -1.2 },
    { name: 'パナソニック', score: 6.7, change: 0.5 },
    { name: 'キヤノン', score: 6.1, change: -0.8 },
    { name: 'Nintendo', score: 8.2, change: 1.3 }
  ],
  technicalIndicators: {
    trend: 'uptrend' as const,
    rsi: 71.8,
    sma20: 12400,
    sma50: 11800,
    volume: '高水準',
    volatility: 25.4
  },
  investmentStyles: {
    growth: 4.5,
    value: 3.2,
    dividend: 1.8,
    momentum: 4.1,
    quality: 4.3
  },
  risks: [
    'エンタメ事業の不確実性',
    '半導体市場の変動',
    '為替リスクの影響',
    'コンテンツ投資の回収リスク',
    'ゲーム市場の競争激化'
  ],
  opportunities: [
    'PlayStation事業の成長',
    '映像コンテンツの需要拡大',
    'イメージセンサー市場拡大',
    'メタバース関連技術',
    '音楽配信サービス成長'
  ],
  aiSummary: '多様な事業ポートフォリオを持つエンターテインメント・テクノロジーコングロマリットです。PlayStation やイメージセンサーなど高収益事業を有し、コンテンツ IP の価値最大化に成功しています。成長性と収益性のバランスが良く、中長期的な投資魅力は高いと評価されます。ただし、事業分野が多岐にわたるため個別事業のリスク管理が重要です。'
};