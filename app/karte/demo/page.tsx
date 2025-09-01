'use client';

import { useState } from 'react';
import AIKarteDisplay from '../../components/AIKarteDisplay';
import { mockToyotaData, mockAppleData, mockSonyData } from '../../components/MockKarteData';

export default function KarteDemo() {
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  
  const demoOptions = [
    {
      id: 'toyota',
      title: 'トヨタ自動車 (7203)',
      description: '日本の代表的な自動車メーカーのAI分析',
      data: mockToyotaData
    },
    {
      id: 'apple',
      title: 'Apple Inc. (AAPL)',
      description: '世界最大のテクノロジー企業のAI分析',
      data: mockAppleData
    },
    {
      id: 'sony',
      title: 'ソニーグループ (6758)',
      description: 'エンタメ・テクノロジー複合企業のAI分析',
      data: mockSonyData
    }
  ];

  const handleDemoSelect = (demoId: string) => {
    setSelectedDemo(demoId);
  };

  const closeDemoKarte = () => {
    setSelectedDemo(null);
  };

  const getCurrentData = () => {
    return demoOptions.find(option => option.id === selectedDemo)?.data || null;
  };

  return (
    <main>
      <h1>🎭 AIカルテデモ</h1>
      <p className="subtitle">AI株式分析カルテのデモンストレーション</p>

      <div className="demo-notice">
        <div className="dev-badge">デモ版</div>
        <h2>AI分析カルテのプレビュー</h2>
        <p>実際のAI分析機能の動作をご体験いただけます。下記の銘柄から選択してAIカルテをご覧ください。</p>
      </div>

      <div className="demo-section">
        <h2>📊 デモ銘柄</h2>
        <div className="demo-cards">
          {demoOptions.map((option) => (
            <div 
              key={option.id}
              className="demo-card"
              onClick={() => handleDemoSelect(option.id)}
            >
              <h3>{option.title}</h3>
              <p>{option.description}</p>
              <button className="demo-button">
                📋 AIカルテを表示
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-features">
        <h3>🔍 カルテに含まれる分析項目</h3>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <div className="feature-content">
              <h4>基本投資指標</h4>
              <p>PER、PBR、配当利回りなど</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🤖</div>
            <div className="feature-content">
              <h4>AI分析スコア</h4>
              <p>投資、成長、リスクの総合評価</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">💰</div>
            <div className="feature-content">
              <h4>財務健全性</h4>
              <p>収益性、安定性、成長性の分析</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📰</div>
            <div className="feature-content">
              <h4>マーケット情勢</h4>
              <p>市場センチメントとニュース分析</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🏆</div>
            <div className="feature-content">
              <h4>競合比較</h4>
              <p>同業他社との相対的な位置づけ</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📈</div>
            <div className="feature-content">
              <h4>テクニカル指標</h4>
              <p>トレンド、RSI、移動平均線等</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">⭐</div>
            <div className="feature-content">
              <h4>投資スタイル適性</h4>
              <p>グロース、バリュー、配当投資等</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">⚖️</div>
            <div className="feature-content">
              <h4>リスク&機会</h4>
              <p>投資における注意点と成長期待</p>
            </div>
          </div>
        </div>
      </div>

      <div className="back-link">
        <a href="/karte">← カルテページに戻る</a>
      </div>

      {/* AI Karte Display */}
      {selectedDemo && getCurrentData() && (
        <AIKarteDisplay
          analysisData={getCurrentData()!}
          onClose={closeDemoKarte}
        />
      )}
    </main>
  );
}