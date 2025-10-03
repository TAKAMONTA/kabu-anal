/**
 * 入力検証ユーティリティ
 */

/**
 * 株式コードの検証
 * - 日本株: 4桁の数字 (例: 7203)
 * - 米国株: 1-5文字の英字 (例: AAPL, GOOGL)
 */
export function validateStockCode(code: string): {
  isValid: boolean;
  error?: string;
  normalizedCode?: string;
} {
  if (!code || typeof code !== "string") {
    return { isValid: false, error: "証券コードが必要です" };
  }

  const trimmed = code.trim().toUpperCase();

  if (trimmed.length === 0) {
    return { isValid: false, error: "証券コードが空です" };
  }

  // 日本株パターン: 4桁の数字
  const japaneseStockPattern = /^[0-9]{4}$/;
  if (japaneseStockPattern.test(trimmed)) {
    return { isValid: true, normalizedCode: trimmed };
  }

  // 米国株パターン: 1-5文字の英字（ドット含む場合もあり: BRK.B）
  const usStockPattern = /^[A-Z]{1,5}(\.[A-Z])?$/;
  if (usStockPattern.test(trimmed)) {
    return { isValid: true, normalizedCode: trimmed };
  }

  return {
    isValid: false,
    error: "無効な証券コード形式です（日本株: 4桁数字、米国株: 1-5文字の英字）",
  };
}

/**
 * 安全な文字列サニタイズ
 */
export function sanitizeString(input: string, maxLength = 100): string {
  return input.trim().slice(0, maxLength).replace(/[<>]/g, ""); // XSS防止の基本的なサニタイズ
}
