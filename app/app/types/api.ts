// 株価データ API レスポンス
export interface StockApiResponse {
  symbol: string; // 銘柄コード (例: "7203.T")
  price: number; // 現在株価
  currency: string; // 通貨 (例: "JPY" or "USD")
  labels: string[]; // 日付ラベル配列
  prices: (number | null)[]; // 株価データ配列 (null の場合あり)
}

// 財務データポイント
export interface FinanceDataPoint {
  year: string;
  revenue: number;
  operating: number;
  net: number;
  roe: number;
  per: number;
  pbr: number;
  dividend: number;
}

// 財務データ API レスポンス
export interface FinanceApiResponse {
  symbol: string; // 銘柄コード
  price: number; // 現在株価
  currency: string; // 通貨
  labels: string[]; // 日付ラベル配列
  prices: (number | null)[]; // 株価データ配列
  volumes: (number | null)[]; // 出来高データ配列
  financeHistory: FinanceDataPoint[]; // 年度ごとの財務データ
}

// AI分析 API レスポンス
export interface AnalysisApiResponse {
  result: string; // AI分析結果のテキスト
}

// エラーレスポンス
export interface ApiError {
  error: string;
}
