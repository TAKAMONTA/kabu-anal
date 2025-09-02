import { NextResponse } from 'next/server';

// AI選定の話題の銘柄（定期的に更新可能）
const TRENDING_STOCKS = {
  japan: [
    { code: '7203', name: 'トヨタ自動車', reason: 'EV戦略の転換と好調な業績' },
    { code: '6758', name: 'ソニーグループ', reason: 'ゲーム事業の成長とエンタメ分野の拡大' },
    { code: '9432', name: 'NTT', reason: 'IOWN構想と6G開発への期待' },
    { code: '6861', name: 'キーエンス', reason: 'FA需要回復と高い利益率' },
    { code: '4755', name: '楽天グループ', reason: 'モバイル事業の改善期待' }
  ],
  us: [
    { code: 'NVDA', name: 'NVIDIA', reason: 'AI半導体の圧倒的需要' },
    { code: 'MSFT', name: 'Microsoft', reason: 'AI統合とクラウド成長' },
    { code: 'AAPL', name: 'Apple', reason: 'Vision Proと新型iPhone期待' },
    { code: 'TSLA', name: 'Tesla', reason: '自動運転技術の進展' },
    { code: 'META', name: 'Meta', reason: 'メタバースとAI投資の成果' }
  ]
};

export async function GET() {
  try {
    // 将来的にはPerplexity APIやOpenAIを使って
    // リアルタイムで話題の銘柄を取得することも可能
    
    return NextResponse.json({
      success: true,
      data: TRENDING_STOCKS,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: '話題の銘柄の取得に失敗しました' 
      },
      { status: 500 }
    );
  }
}