'use client';

import { useState } from 'react';
import AIKarteDisplay from '../components/AIKarteDisplay';
import { mockToyotaData, mockAppleData, mockSonyData } from '../components/MockKarteData';

// 銘柄データの型定義
interface Stock {
  code: string;
  name: string;
  market?: string;
}

// サンプル銘柄データ
const japanStocks: Stock[] = [
  { code: '7203', name: 'トヨタ自動車', market: 'JP' },
  { code: '6758', name: 'ソニーグループ', market: 'JP' },
  { code: '9432', name: '日本電信電話', market: 'JP' },
  { code: '6861', name: 'キーエンス', market: 'JP' },
  { code: '4063', name: '信越化学工業', market: 'JP' },
  { code: '9983', name: 'ファーストリテイリング', market: 'JP' },
  { code: '8306', name: '三菱UFJフィナンシャル・グループ', market: 'JP' },
  { code: '9984', name: 'ソフトバンクグループ', market: 'JP' },
  { code: '7267', name: 'ホンダ', market: 'JP' },
  { code: '6902', name: 'デンソー', market: 'JP' },
];

const usStocks: Stock[] = [
  { code: 'AAPL', name: 'Apple Inc.', market: 'US' },
  { code: 'MSFT', name: 'Microsoft', market: 'US' },
  { code: 'GOOGL', name: 'Alphabet (Google)', market: 'US' },
  { code: 'AMZN', name: 'Amazon', market: 'US' },
  { code: 'NVDA', name: 'NVIDIA', market: 'US' },
  { code: 'TSLA', name: 'Tesla', market: 'US' },
  { code: 'META', name: 'Meta Platforms', market: 'US' },
  { code: 'BRK.B', name: 'Berkshire Hathaway', market: 'US' },
  { code: 'JPM', name: 'JPMorgan Chase', market: 'US' },
  { code: 'V', name: 'Visa', market: 'US' },
];

const allStocks = [...japanStocks, ...usStocks];

export default function SearchableKarte() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showKarte, setShowKarte] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 検索処理
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert('銘柄コードまたは企業名を入力してください');
      return;
    }

    setIsSearching(true);
    setErrorMessage('');
    
    // 検索シミュレーション（実際にはAPIを呼ぶ）
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const results = allStocks.filter(stock => 
        stock.code.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query)
      );
      
      setSearchResults(results);
      setIsSearching(false);
      
      if (results.length === 0) {
        alert('該当する銘柄が見つかりませんでした');
      }
    }, 500);
  };

  // 銘柄選択処理
  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setSearchQuery(stock.code + ' - ' + stock.name);
    setSearchResults([]);
    setErrorMessage('');
  };

  // AIカルテ生成処理（3段階のAPI呼び出し）
  const generateKarte = async () => {
    if (!selectedStock) {
      alert('銘柄を選択してください');
      return;
    }
    
    setIsGenerating(true);
    setGenerationStep('企業情報を確認中...');
    setErrorMessage('');
    
    try {
      // ステップ1: 企業を特定
      setGenerationStep('企業情報を確認中... (1/3)');
      const step1Response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockCode: selectedStock.code,
          market: selectedStock.market || 'JP',
          step: 1
        })
      });
      
      if (!step1Response.ok) {
        throw new Error('企業情報の取得に失敗しました');
      }
      
      const step1Data = await step1Response.json();
      
      // ステップ2: 株価を取得
      setGenerationStep('最新の株価を取得中... (2/3)');
      const step2Response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockCode: selectedStock.code,
          market: selectedStock.market || 'JP',
          step: 2,
          previousData: { companyName: step1Data.companyName || selectedStock.name }
        })
      });
      
      if (!step2Response.ok) {
        throw new Error('株価情報の取得に失敗しました');
      }
      
      const step2Data = await step2Response.json();
      
      // ステップ3: 詳細分析
      setGenerationStep('AI分析を実行中... (3/3)');
      const step3Response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockCode: selectedStock.code,
          market: selectedStock.market || 'JP',
          step: 3,
          previousData: {
            companyName: step1Data.companyName || selectedStock.name,
            currentPrice: step2Data.currentPrice || 0
          }
        })
      });
      
      if (!step3Response.ok) {
        throw new Error('AI分析の実行に失敗しました');
      }
      
      const analysisResult = await step3Response.json();
      
      // 分析結果を設定
      setAnalysisData(analysisResult);
      setShowKarte(true);
      
    } catch (error) {
      console.error('カルテ生成エラー:', error);
      setErrorMessage('AIカルテの生成に失敗しました。もう一度お試しください。');
      
      // エラー時はモックデータを使用
      const mockData = getMockData();
      if (mockData) {
        setAnalysisData(mockData);
        setShowKarte(true);
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // モックデータを取得する関数（フォールバック用）
  const getMockData = () => {
    if (!selectedStock) return null;
    
    switch (selectedStock.code) {
      case '7203':
        return mockToyotaData;
      case 'AAPL':
        return mockAppleData;
      case '6758':
        return mockSonyData;
      default:
        // デフォルトとしてトヨタのデータを使用し、銘柄情報を上書き
        return {
          ...mockToyotaData,
          stockInfo: {
            ...mockToyotaData.stockInfo,
            code: selectedStock.code,
            name: selectedStock.name,
            market: selectedStock.market || 'JP'
          }
        };
    }
  };

  // カルテを閉じる処理
  const closeKarte = () => {
    setShowKarte(false);
    setAnalysisData(null);
  };

  return (
    <>
      <div className="search-section">
        <h2>銘柄検索</h2>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="銘柄コードまたは企業名を入力..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <button 
            className="search-button" 
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? '検索中...' : '検索'}
          </button>
        </div>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="error-message" style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* 検索結果 */}
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>検索結果（{searchResults.length}件）</h3>
            <div className="results-list">
              {searchResults.map((stock) => (
                <div 
                  key={stock.code} 
                  className={`result-item ${stock.market === 'US' ? 'us-stock' : ''}`}
                  onClick={() => handleStockSelect(stock)}
                >
                  <span className="stock-code">{stock.code}</span>
                  <span className="stock-name">{stock.name}</span>
                  {stock.market === 'US' && <span className="market-badge">🇺🇸</span>}
                  {stock.market === 'JP' && <span className="market-badge">🇯🇵</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 選択された銘柄 */}
        {selectedStock && (
          <div className="selected-stock">
            <h3>選択中の銘柄</h3>
            <div className={`selected-stock-card ${selectedStock.market === 'US' ? 'us-stock' : ''}`}>
              <div className="selected-info">
                <span className="stock-code">{selectedStock.code}</span>
                <span className="stock-name">{selectedStock.name}</span>
              </div>
              <button className="generate-button" onClick={generateKarte} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <span className="loading-spinner"></span>
                    {generationStep || '生成中...'}
                  </>
                ) : (
                  '📊 AIカルテを生成'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 人気銘柄 */}
      <div className="sample-section">
        <h3>🇯🇵 日本株 - 人気銘柄</h3>
        <div className="sample-stocks">
          {japanStocks.slice(0, 6).map((stock) => (
            <div 
              key={stock.code} 
              className="stock-item"
              onClick={() => handleStockSelect(stock)}
              style={{ cursor: 'pointer' }}
            >
              <span className="stock-code">{stock.code}</span>
              <span className="stock-name">{stock.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sample-section">
        <h3>🇺🇸 米国株 - 人気銘柄</h3>
        <div className="sample-stocks">
          {usStocks.slice(0, 6).map((stock) => (
            <div 
              key={stock.code} 
              className="stock-item us-stock"
              onClick={() => handleStockSelect(stock)}
              style={{ cursor: 'pointer' }}
            >
              <span className="stock-code">{stock.code}</span>
              <span className="stock-name">{stock.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AIカルテ表示 */}
      {showKarte && analysisData && (
        <AIKarteDisplay 
          analysisData={analysisData}
          onClose={closeKarte}
        />
      )}
    </>
  );
}