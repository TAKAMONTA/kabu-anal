// ユーザー関連の型定義
export type UserPlan = "free" | "premium";
export type Theme = "light" | "dark";
export type Language = "ja" | "en";
export type Market = "JP" | "US";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: UserPlan;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  subscription?: UserSubscription;
}

export interface UserPreferences {
  theme: Theme;
  language: Language;
  notifications: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface UserSubscription {
  plan: UserPlan;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  paymentMethod?: string;
}

// API関連の型定義
export interface StockAnalysisRequest {
  stockCode: string;
  market: Market;
  step: 1 | 2 | 3;
  previousData?: Partial<StockAnalysisData>;
}

export interface AnalysisRequest {
  query: string;
  market?: Market;
  perplexityData?: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data: AIAnalysisData;
  error?: string;
}

export interface StockAnalysisData {
  companyName: string;
  currentPrice: number;
  changePercent: number;
  analysis: any;
}

export interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

// 分析データの型定義
export interface AIAnalysisData {
  stockInfo: StockInfo;
  companyOverview: CompanyOverview;
  basicMetrics: BasicMetrics;
  aiScores: AIScores;
  financialHealth: FinancialHealth;
  marketSentiment: MarketSentiment;
  competitors: Competitor[];
  technicalIndicators: TechnicalIndicators;
  investmentStyles: InvestmentStyles;
  risks: string[];
  opportunities: string[];
  aiSummary: string;
  analysisDate: string;
}

export interface StockInfo {
  code: string;
  name: string;
  price?: number;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  market: Market;
  currency: string;
  lastUpdated: string;
  dataSource: string;
}

export interface CompanyOverview {
  business: string;
  description: string;
  founded: string;
  employees: number;
  headquarters: string;
  website: string;
  industry: string;
  sector: string;
}

export interface BasicMetrics {
  dividend: number;
  dividendYield: number;
  per: number;
  pbr: number;
  roe: number;
  eps: number;
  bps: number;
  marketCap: number;
  revenueGrowth?: number;
}

export interface AIScores {
  investmentScore: number;
  growthPrediction: number;
  riskAssessment: number;
  aiConfidence: number;
  totalScore?: number;
  growthPotential?: number;
  profitability?: number;
  stability?: number;
  value?: number;
}

export interface FinancialHealth {
  profitability: number;
  stability: number;
  growth: number;
  efficiency: number;
  liquidity: number;
}

export interface MarketSentiment {
  sentiment: "positive" | "negative" | "neutral";
  newsScore: number;
  analystRating: number | string;
  socialMention: number;
  institutionalFlow: number;
  targetPrice?: number;
  consensus?: string;
  newsSentiment?: string;
}

export interface Competitor {
  name: string;
  score: number;
  change: number;
}

export interface TechnicalIndicators {
  trend: "up" | "down" | "sideways";
  rsi: number;
  sma20: number;
  sma50: number;
  volume: string;
  volatility: number;
  support?: number;
  resistance?: number;
  momentum?: string;
}

export interface InvestmentStyles {
  growth: number | boolean;
  value: number | boolean;
  dividend: number | boolean;
  momentum: number | boolean;
  quality?: number | boolean;
}

export interface Analysis {
  id: string;
  userId: string;
  stockCode: string;
  stockName: string;
  market: Market;
  analysisData: AIAnalysisData;
  createdAt: Date;
  isPublic: boolean;
  tags?: string[];
}

export interface Favorite {
  id: string;
  userId: string;
  stockCode: string;
  stockName: string;
  market: Market;
  addedAt: Date;
  notes?: string;
}

export interface UserStats {
  userId: string;
  totalAnalyses: number;
  favoriteCount: number;
  lastAnalysisAt: Date | null;
  monthlyUsage: {
    [yearMonth: string]: {
      analyses: number;
      favorites: number;
    };
  };
  streakDays: number;
  achievements: string[];
}

// 分析ステップの型定義
export interface AnalysisStep {
  step: number;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  startTime?: string;
  endTime?: string;
  error?: string;
}

export interface AnalysisProgress {
  steps: AnalysisStep[];
  currentStep: number;
  isComplete: boolean;
  error?: string;
}

// エラー関連の型定義
export interface FirebaseError {
  code: string;
  message: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

// レート制限関連の型定義
export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  limit: number;
  windowMs: number;
}

// 検索関連の型定義
export interface SearchResult {
  query: string;
  companyInfo: string;
  priceInfo: any;
  content?: string;
}

export interface TrendingStock {
  code: string;
  name: string;
  reason: string;
  market: Market;
  price?: number;
  change?: number;
}

// 環境変数の型定義
export interface EnvironmentConfig {
  OPENAI_API_KEY: string;
  CLAUDE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ALPHA_VANTAGE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;
}

// バリデーション関連の型定義
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// レスポンスヘッダーの型定義
export interface ResponseHeaders {
  [key: string]: string | number;
}
