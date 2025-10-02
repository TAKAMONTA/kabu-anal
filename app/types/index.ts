export interface AIAnalysis {
  analysis: string;
  recommendation: string;
  confidence: number;
}

export interface StockAnalysis {
  stockCode: string;
  timestamp: string;
  openai: AIAnalysis;
  claude: AIAnalysis;
  gemini: AIAnalysis;
  finalJudgement: {
    decision: '買い' | '売り' | '保留';
    reasoning: string;
    confidence: number;
  };
}

export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
}
