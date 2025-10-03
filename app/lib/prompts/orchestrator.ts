/**
 * Orchestrator API用プロンプトテンプレート
 * 各AIに専門的な役割を割り当てた分析プロンプト
 */

export interface PromptConfig {
  role: string;
  stockCode: string;
  focus: string[];
}

/**
 * Gemini用プロンプト（テクニカル分析担当）
 */
export function createGeminiPrompt(stockCode: string): string {
  return createPrompt({
    role: "テクニカル分析担当",
    stockCode,
    focus: [
      "現在のトレンド（上昇/下降/横ばい）",
      "移動平均線との位置関係（25日、75日、200日線）",
      "サポート/レジスタンスライン",
      "出来高トレンド",
      "テクニカル指標（RSI、MACD等）",
    ],
  });
}

/**
 * Claude用プロンプト（ファンダメンタル分析担当）
 */
export function createClaudePrompt(stockCode: string): string {
  return createPrompt({
    role: "ファンダメンタル分析担当",
    stockCode,
    focus: [
      "最新決算の状況（売上、利益、成長率）",
      "財務健全性（自己資本比率、ROE、ROA）",
      "バリュエーション（PER、PBR、配当利回り）",
      "業界動向と競合比較",
      "将来性とリスク要因",
    ],
  });
}

/**
 * OpenAI用プロンプト（総合分析担当）
 */
export function createOpenAIPrompt(stockCode: string): string {
  return createPrompt({
    role: "総合分析担当",
    stockCode,
    focus: [
      "市場全体の環境",
      "企業の強み・弱み",
      "短期/中期/長期の見通し",
      "投資判断（買い/売り/保留）とその根拠",
      "推奨価格レンジ",
      "注意すべきリスク",
    ],
  });
}

/**
 * 共通プロンプト生成関数
 */
function createPrompt({ role, stockCode, focus }: PromptConfig): string {
  return `あなたは${role}の専門家です。日本株式銘柄コード${stockCode}について、以下の観点を考慮して分析してください。

${focus.map((item, index) => `${index + 1}. ${item}`).join("\n")}

以下のJSON形式のみで日本語で出力してください。説明文や前後のコメントは一切不要です。
{
  "summary": "主要な結論を120文字以内で要約",
  "recommendation": "買い/売り/保留のいずれか",
  "confidence": 0から1の小数 (0.0〜1.0),
  "price": {
    "current": "現在値（例: 3,750円）",
    "range": "目標価格レンジ（例: 3,450円〜3,900円）"
  },
  "trend": "トレンドや移動平均・出来高の要約",
  "fundamentals": "財務・バリュエーション等の要約",
  "rationale": "推奨の根拠 (80文字以内)",
  "risks": "主要なリスク (80文字以内)",
  "targetRange": "目標株価レンジ",
  "horizon": "想定する投資期間（短期/中期/長期など）"
}

未知の項目はnullではなく空文字列で記載してください。`;
}
