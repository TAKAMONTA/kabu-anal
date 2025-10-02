// A8.net広告コード管理
export const A8NET_ADS = {
  // ヘッダー広告 (デスクトップ: 96x64px)
  HEADER_DESKTOP: process.env.NEXT_PUBLIC_A8NET_HEADER_DESKTOP || "",

  // ヘッダー広告 (モバイル: 64x48px)
  HEADER_MOBILE: process.env.NEXT_PUBLIC_A8NET_HEADER_MOBILE || "",

  // メイン広告 (160x300px)
  MAIN: process.env.NEXT_PUBLIC_A8NET_MAIN || "",

  // 分析結果ページ広告 (300x250px)
  ANALYSIS: process.env.NEXT_PUBLIC_A8NET_ANALYSIS || "",
};

// 広告表示の有効/無効設定
export const AD_CONFIG = {
  ENABLE_HEADER_ADS: process.env.NEXT_PUBLIC_ENABLE_HEADER_ADS === "true",
  ENABLE_MAIN_ADS: process.env.NEXT_PUBLIC_ENABLE_MAIN_ADS === "true",
  ENABLE_ANALYSIS_ADS: process.env.NEXT_PUBLIC_ENABLE_ANALYSIS_ADS === "true",
};

// 広告の表示条件
export const shouldShowAd = (adType: keyof typeof AD_CONFIG): boolean => {
  return AD_CONFIG[adType];
};
