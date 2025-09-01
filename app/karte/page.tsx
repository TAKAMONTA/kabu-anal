'use client';

import SearchableKarte from './SearchableKarte';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function KartePage() {
  return (
    <ProtectedRoute>
      <main>
      <h1>🔍 銘柄AIカルテ</h1>
      <p className="subtitle">AIが個別銘柄を徹底分析します</p>

      {/* 4コマ漫画風の使い方説明 */}
      <div className="manga-guide">
        <h2>📖 カルテの使い方</h2>
        <div className="manga-panels">
          <div className="manga-panel">
            <div className="panel-number">1</div>
            <div className="panel-icon">🔎</div>
            <div className="panel-content">
              <h3>銘柄を検索</h3>
              <p>気になる企業名や<br/>銘柄コードを入力</p>
              <div className="panel-speech">「トヨタについて知りたい！」</div>
            </div>
          </div>

          <div className="manga-panel">
            <div className="panel-number">2</div>
            <div className="panel-icon">🤖</div>
            <div className="panel-content">
              <h3>AIが分析開始</h3>
              <p>財務データ・ニュース・<br/>市場動向を総合分析</p>
              <div className="panel-speech">「分析中...カタカタ💻」</div>
            </div>
          </div>

          <div className="manga-panel">
            <div className="panel-number">3</div>
            <div className="panel-icon">📊</div>
            <div className="panel-content">
              <h3>カルテ生成</h3>
              <p>わかりやすい<br/>診断結果を表示</p>
              <div className="panel-speech">「診断完了！📋」</div>
            </div>
          </div>

          <div className="manga-panel">
            <div className="panel-number">4</div>
            <div className="panel-icon">💡</div>
            <div className="panel-content">
              <h3>投資判断の参考に</h3>
              <p>強み・リスク・<br/>将来性が一目瞭然</p>
              <div className="panel-speech">「なるほど！これは参考になる！」</div>
            </div>
          </div>
        </div>
      </div>

      {/* 検索機能と銘柄一覧 */}
      <SearchableKarte />

      <div className="back-link">
        <a href="/">← ホームに戻る</a>
      </div>
    </main>
    </ProtectedRoute>
  )
}