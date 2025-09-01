'use client';

import React from 'react';

// AI分析データの型定義
interface AIAnalysisData {
  stockInfo: {
    code: string;
    name: string;
    price: number;
    changePercent: number;
    market: string;
    lastUpdated: string;
  };
  companyOverview?: {
    business: string;
    description: string;
    founded: string;
    employees: number;
    headquarters: string;
    website: string;
    industry: string;
    sector: string;
  };
  basicMetrics: {
    dividend: number;
    dividendYield: number;
    per: number;
    pbr: number;
    roe: number;
    eps: number;
    bps: number;
    marketCap: number;
  };
  aiScores: {
    investmentScore: number;
    growthPrediction: number;
    riskAssessment: number;
    aiConfidence: number;
  };
  financialHealth: {
    profitability: number;
    stability: number;
    growth: number;
    efficiency: number;
    liquidity: number;
  };
  marketSentiment: {
    sentiment: 'bullish' | 'neutral' | 'bearish';
    newsScore: number;
    analystRating: number;
    socialMention: number;
    institutionalFlow: number;
  };
  competitors: Array<{
    name: string;
    score: number;
    change: number;
  }>;
  technicalIndicators: {
    trend: 'uptrend' | 'sideways' | 'downtrend';
    rsi: number;
    sma20: number;
    sma50: number;
    volume: string;
    volatility: number;
  };
  investmentStyles: {
    growth: number;
    value: number;
    dividend: number;
    momentum: number;
    quality: number;
  };
  risks: string[];
  opportunities: string[];
  aiSummary: string;
}

interface Props {
  analysisData: AIAnalysisData;
  onClose?: () => void;
}

// スコアメーターコンポーネント
const ScoreMeter: React.FC<{ score: number; label: string; color?: string }> = ({ score, label, color = '#4CAF50' }) => {
  const percentage = Math.min(Math.max(score * 10, 0), 100);
  
  return (
    <div className="score-meter">
      <div className="score-label">{label}</div>
      <div className="meter-container">
        <div className="meter-track">
          <div 
            className="meter-fill"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          ></div>
        </div>
        <div className="score-value">{score.toFixed(1)}/10</div>
      </div>
    </div>
  );
};

// プログレスバーコンポーネント
const ProgressBar: React.FC<{ value: number; max: number; label: string; color?: string }> = ({ 
  value, max, label, color = '#2196F3' 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="progress-bar">
      <div className="progress-label">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
};

// スターレーティングコンポーネント
const StarRating: React.FC<{ rating: number; label: string }> = ({ rating, label }) => {
  const stars = Math.round(rating);
  
  return (
    <div className="star-rating">
      <span className="rating-label">{label}</span>
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= stars ? 'star filled' : 'star'}>
            ⭐
          </span>
        ))}
      </div>
      <span className="rating-value">{rating.toFixed(1)}</span>
    </div>
  );
};

// リスク色を取得する関数
const getRiskColor = (risk: number) => {
  if (risk >= 7) return '#f44336'; // 赤
  if (risk >= 4) return '#ff9800'; // オレンジ
  return '#4CAF50'; // 緑
};

// センチメント色を取得する関数
const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'bullish': return '#4CAF50';
    case 'bearish': return '#f44336';
    default: return '#ff9800';
  }
};

// トレンド矢印を取得する関数
const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'uptrend': return '📈';
    case 'downtrend': return '📉';
    default: return '➡️';
  }
};

export default function AIKarteDisplay({ analysisData, onClose }: Props) {
  const { stockInfo, companyOverview, basicMetrics, aiScores, financialHealth, marketSentiment, competitors, technicalIndicators, investmentStyles, risks, opportunities, aiSummary } = analysisData;

  return (
    <div className="ai-karte-overlay">
      <div className="ai-karte-container">
        {/* ヘッダー */}
        <div className="karte-header">
          <div className="header-left">
            <h1 className="stock-title">
              {stockInfo.name} ({stockInfo.code})
              {stockInfo.market === 'US' && <span className="market-flag">🇺🇸</span>}
              {stockInfo.market === 'JP' && <span className="market-flag">🇯🇵</span>}
            </h1>
            <div className="price-info">
              <span className="current-price">¥{stockInfo.price.toLocaleString()}</span>
              <span className={`price-change ${stockInfo.changePercent >= 0 ? 'positive' : 'negative'}`}>
                {stockInfo.changePercent >= 0 ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className="last-updated">最終更新: {stockInfo.lastUpdated}</div>
          </div>
          {onClose && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>

        {/* 会社概要 */}
        {companyOverview && (
          <div className="karte-section company-overview">
            <h2>🏢 会社概要</h2>
            <div className="overview-content">
              <div className="overview-main">
                <h3>{companyOverview.business}</h3>
                <p>{companyOverview.description}</p>
              </div>
              <div className="overview-details">
                <div className="detail-item">
                  <span className="detail-label">業種</span>
                  <span className="detail-value">{companyOverview.industry}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">セクター</span>
                  <span className="detail-value">{companyOverview.sector}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">設立</span>
                  <span className="detail-value">{companyOverview.founded}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">従業員数</span>
                  <span className="detail-value">{companyOverview.employees.toLocaleString()}名</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">本社</span>
                  <span className="detail-value">{companyOverview.headquarters}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">ウェブサイト</span>
                  <span className="detail-value">
                    <a href={companyOverview.website} target="_blank" rel="noopener noreferrer">
                      {companyOverview.website}
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AIサマリー */}
        <div className="karte-section ai-summary">
          <h2>🤖 AI総合判定</h2>
          <div className="summary-content">
            <div className="ai-confidence">
              AI信頼度: {(aiScores.aiConfidence * 10).toFixed(0)}%
            </div>
            <p>{aiSummary}</p>
          </div>
        </div>

        <div className="karte-body">
          {/* 左カラム */}
          <div className="karte-column">
            
            {/* 基本投資指標 */}
            <div className="karte-section">
              <h3>📊 基本投資指標</h3>
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="metric-label">配当</span>
                  <span className="metric-value">¥{basicMetrics.dividend}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">配当利回り</span>
                  <span className="metric-value">{basicMetrics.dividendYield}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">PER</span>
                  <span className="metric-value">{basicMetrics.per}倍</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">PBR</span>
                  <span className="metric-value">{basicMetrics.pbr}倍</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">ROE</span>
                  <span className="metric-value">{basicMetrics.roe}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">時価総額</span>
                  <span className="metric-value">{(basicMetrics.marketCap / 1000000000).toFixed(0)}億円</span>
                </div>
              </div>
            </div>

            {/* AI分析スコア */}
            <div className="karte-section">
              <h3>🎯 AI分析スコア</h3>
              <div className="scores-container">
                <ScoreMeter score={aiScores.investmentScore} label="投資スコア" color="#4CAF50" />
                <ScoreMeter score={aiScores.growthPrediction} label="成長予測" color="#2196F3" />
                <ScoreMeter score={aiScores.riskAssessment} label="リスク評価" color={getRiskColor(aiScores.riskAssessment)} />
              </div>
            </div>

            {/* 財務健全性 */}
            <div className="karte-section">
              <h3>💰 財務健全性</h3>
              <div className="financial-health">
                <ProgressBar value={financialHealth.profitability} max={10} label="収益性" color="#4CAF50" />
                <ProgressBar value={financialHealth.stability} max={10} label="安定性" color="#2196F3" />
                <ProgressBar value={financialHealth.growth} max={10} label="成長性" color="#9C27B0" />
                <ProgressBar value={financialHealth.efficiency} max={10} label="効率性" color="#FF9800" />
                <ProgressBar value={financialHealth.liquidity} max={10} label="流動性" color="#00BCD4" />
              </div>
            </div>

          </div>

          {/* 右カラム */}
          <div className="karte-column">
            
            {/* マーケット情勢 */}
            <div className="karte-section">
              <h3>📰 マーケット情勢</h3>
              <div className="market-sentiment">
                <div className="sentiment-header">
                  <div className="sentiment-badge" style={{ backgroundColor: getSentimentColor(marketSentiment.sentiment) }}>
                    {marketSentiment.sentiment === 'bullish' ? '🐂 強気' : 
                     marketSentiment.sentiment === 'bearish' ? '🐻 弱気' : '😐 中立'}
                  </div>
                  <div className="sentiment-score">{marketSentiment.newsScore}/10</div>
                </div>
                <div className="sentiment-details">
                  <div className="sentiment-item">
                    <span>アナリスト評価</span>
                    <div className="rating-stars">
                      {'★'.repeat(Math.round(marketSentiment.analystRating))}{'☆'.repeat(5 - Math.round(marketSentiment.analystRating))}
                    </div>
                  </div>
                  <div className="sentiment-item">
                    <span>SNS言及度</span>
                    <span className="mention-level">
                      {marketSentiment.socialMention >= 8 ? '🔥 話題沸騰' : 
                       marketSentiment.socialMention >= 5 ? '📢 注目中' : '😴 静か'}
                    </span>
                  </div>
                  <div className="sentiment-item">
                    <span>機関投資家フロー</span>
                    <span className={`flow ${marketSentiment.institutionalFlow >= 0 ? 'inflow' : 'outflow'}`}>
                      {marketSentiment.institutionalFlow >= 0 ? '📈 流入' : '📉 流出'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 競合比較 */}
            <div className="karte-section">
              <h3>🏆 競合比較</h3>
              <div className="competitors-list">
                {competitors.map((competitor, index) => (
                  <div key={index} className="competitor-item">
                    <span className="competitor-name">{competitor.name}</span>
                    <div className="competitor-score">
                      <div className="score-bar">
                        <div 
                          className="score-fill"
                          style={{ width: `${competitor.score * 10}%` }}
                        ></div>
                      </div>
                      <span className="score-text">{competitor.score.toFixed(1)}</span>
                      <span className={`change ${competitor.change >= 0 ? 'positive' : 'negative'}`}>
                        {competitor.change >= 0 ? '+' : ''}{competitor.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* テクニカル指標 */}
            <div className="karte-section">
              <h3>📈 テクニカル指標</h3>
              <div className="technical-indicators">
                <div className="trend-indicator">
                  <span className="trend-icon">{getTrendIcon(technicalIndicators.trend)}</span>
                  <span className="trend-text">
                    {technicalIndicators.trend === 'uptrend' ? '上昇トレンド' :
                     technicalIndicators.trend === 'downtrend' ? '下降トレンド' : '横這い'}
                  </span>
                </div>
                <div className="technical-grid">
                  <div className="tech-item">
                    <span className="tech-label">RSI</span>
                    <span className="tech-value">{technicalIndicators.rsi}</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">20日線</span>
                    <span className="tech-value">¥{technicalIndicators.sma20.toLocaleString()}</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">50日線</span>
                    <span className="tech-value">¥{technicalIndicators.sma50.toLocaleString()}</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">出来高</span>
                    <span className="tech-value">{technicalIndicators.volume}</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">ボラティリティ</span>
                    <span className="tech-value">{technicalIndicators.volatility}%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 投資スタイル適性 */}
        <div className="karte-section investment-styles">
          <h3>💼 投資スタイル適性度</h3>
          <div className="styles-container">
            <StarRating rating={investmentStyles.growth} label="グロース投資" />
            <StarRating rating={investmentStyles.value} label="バリュー投資" />
            <StarRating rating={investmentStyles.dividend} label="配当投資" />
            <StarRating rating={investmentStyles.momentum} label="モメンタム投資" />
            <StarRating rating={investmentStyles.quality} label="クオリティ投資" />
          </div>
        </div>

        {/* リスクと機会 */}
        <div className="karte-footer">
          <div className="risks-opportunities">
            <div className="risks-section">
              <h4>⚠️ 主要リスク</h4>
              <ul>
                {risks.map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </div>
            <div className="opportunities-section">
              <h4>🌟 成長機会</h4>
              <ul>
                {opportunities.map((opportunity, index) => (
                  <li key={index}>{opportunity}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 免責事項 */}
        <div className="disclaimer">
          <p>⚠️ この分析は投資判断の参考情報であり、投資を勧誘するものではありません。投資は自己責任でお願いします。</p>
        </div>
      </div>
    </div>
  );
}