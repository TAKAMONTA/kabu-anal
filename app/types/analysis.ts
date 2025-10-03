// 統一データ型定義
export interface UnifiedStockData {
  metadata: {
    証券コード: string;
    企業名: string;
    収集日時: string;
    データ信頼度: "高" | "中" | "低";
    データソース?: string[];
  };
  株価情報: {
    現在値: number;
    前日比: {
      円?: number;
      ドル?: number;
      パーセント: number;
    };
    出来高: number;
    時価総額: string;
    始値?: number;
    高値?: number;
    安値?: number;
    情報源: string;
  };
  財務指標: {
    PER: number | null;
    PBR: number | null;
    ROE: number | null;
    配当利回り: number | null;
    直近決算: string | null;
    EPS?: number | null;
    情報源: string;
  };
  テクニカル指標: {
    MA25: number | null;
    MA75: number | null;
    MA200: number | null;
    RSI: number | null;
    MACD: {
      値: number | null;
      シグナル: number | null;
      ヒストグラム: number | null;
    };
    情報源: string;
  };
  最新ニュース: Array<{
    タイトル: string;
    要約: string;
    日時: string;
    URL: string;
    信頼度?: "高" | "中" | "低";
  }>;
  市場センチメント: {
    総合評価: string;
    理由: string;
    信頼度?: "高" | "中" | "低";
  };
}

// AI分析結果型定義
export interface AIAnalysisResult {
  AI名: string;
  専門分野: string;
  推奨の見立て: "買い" | "売り" | "保留";
  信頼度: number;
  分析内容: {
    株価情報?: string;
    テクニカル分析?: string;
    ファンダメンタル分析?: string;
    市場環境?: string;
    リスク評価?: string;
    [key: string]: string | undefined;
  };
  目標株価: {
    下限: number | null;
    上限: number | null;
  };
  リスク要因: string[];
}

// 総合判断型定義
export interface OverallJudgement {
  判断: "買い" | "売り" | "保留";
  信頼度: number;
  理由: string;
  詳細: {
    買い推奨: number;
    売り推奨: number;
    保留推奨: number;
  };
  目標株価統合: {
    下限: number;
    上限: number;
    平均下限: number;
    平均上限: number;
  } | null;
  各AI信頼度: {
    Gemini: number;
    Claude: number;
    OpenAI: number;
  };
}

// 分析フェーズ型定義
export interface AnalysisPhase {
  phase: string;
  status: "pending" | "processing" | "completed" | "error";
  message: string;
}

// 最終レポート型定義
export interface FinalAnalysisReport {
  証券コード: string;
  企業名: string;
  統一データ: UnifiedStockData;
  分析結果: {
    Gemini: AIAnalysisResult;
    Claude: AIAnalysisResult;
    OpenAI: AIAnalysisResult;
  };
  総合判断: OverallJudgement;
  生成日時: string;
  phases: AnalysisPhase[];
}
