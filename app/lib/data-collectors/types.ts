// データ収集器の型定義

export interface StockData {
  metadata: {
    証券コード: string;
    企業名: string;
    収集日時: string;
    データ信頼度: "高" | "中" | "低";
    データソース?: string[];
  };
  株価情報: {
    現在値: number | null;
    前日比: {
      円?: number | null;
      ドル?: number | null;
      パーセント: number | null;
    };
    出来高: number | null;
    時価総額: string | null;
    始値?: number | null;
    高値?: number | null;
    安値?: number | null;
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

export interface CollectorResult {
  success: boolean;
  data: Partial<StockData>;
  errors: string[];
  source: string;
  timestamp: string;
  confidence: number; // 0-100
}

export interface DataSource {
  name: string;
  url: string;
  priority: number;
  reliability: "高" | "中" | "低";
  supportedMarkets: ("JP" | "US")[];
}

export interface DataCollectionConfig {
  maxRetries: number;
  timeout: number;
  enableFallback: boolean;
  validateData: boolean;
  requiredFields: string[];
}
