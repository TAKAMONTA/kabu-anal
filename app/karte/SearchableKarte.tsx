'use client';

import { useState, useEffect } from 'react';
import AIKarteDisplay from '../components/AIKarteDisplay';

// 銘柄データの型定義
interface Stock {
  code: string;
  name: string;
  market?: string;
}

interface TrendingStock {
  code: string;
  name: string;
  reason: string;
}

interface TrendingStocks {
  japan: TrendingStock[];
  us: TrendingStock[];
}

// サンプルデータを削除 - Perplexity APIのみ使用

export default function SearchableKarte() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showKarte, setShowKarte] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [apiNote, setApiNote] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [analyzingStock, setAnalyzingStock] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [trendingStocks, setTrendingStocks] = useState<TrendingStocks | null>(null);

  // 話題の銘柄を取得
  useEffect(() => {
    const fetchTrendingStocks = async () => {
      try {
        const response = await fetch('/api/trending-stocks');
        const data = await response.json();
        if (data.success) {
          setTrendingStocks(data.data);
        }
      } catch (error) {
        // エラーは静かに処理（話題の銘柄は必須ではないため）
      }
    };
    fetchTrendingStocks();
  }, []);

  // 話題の銘柄をクリックした時の処理
  const handleTrendingStockClick = async (stockCode: string, stockName: string) => {
    // 銘柄コード/ティッカーシンボルのみを検索欄に設定
    setSearchQuery(stockCode);
    
    // 検索を自動実行
    setIsSearching(true);
    setErrorMessage('');
    setSearchResults([]);
    setApiNote('');
    
    try {
      const response = await fetch('/api/stock-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: stockCode })  // 銘柄コードのみを送信
      });

      const data = await response.json();
      
      if (data.success && data.results && data.results.length > 0) {
        setSearchResults(data.results);
        if (data.apiNote) {
          setApiNote(data.apiNote);
        }
      } else {
        setErrorMessage(data.error || '銘柄情報が見つかりませんでした');
      }
    } catch (error) {
      setErrorMessage('検索エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSearching(false);
    }
  };

  // 検索処理（Perplexity APIを使用）
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setErrorMessage('銘柄コードまたは企業名を入力してください');
      return;
    }

    setIsSearching(true);
    setErrorMessage('');
    setSearchResults([]);
    setApiNote('');
    
    try {
      // Perplexity APIで検索
      const response = await fetch('/api/stock-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json();
          throw new Error(`リクエスト制限に達しました。${errorData.resetIn || 60}秒後に再試行してください。`);
        }
        throw new Error('検索サービスに接続できませんでした');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Perplexityの結果を表示
        setSearchResults(data.results.map((result: any) => ({
          query: result.query,
          companyInfo: result.companyInfo,
          priceInfo: result.priceInfo,
          content: result.companyInfo || result.content
        })));
        setApiNote('🔍 Perplexity AIで検索し、株価情報を取得しました');
        setTimeout(() => setApiNote(''), 5000);
      } else {
        setErrorMessage('検索結果がありませんでした');
      }
    } catch (error) {
      console.error('Search error:', error);
      setErrorMessage(error instanceof Error ? error.message : '検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
    }
  };

  // 銘柄選択処理（削除 - 使用しない）

  // 段階的AI分析処理
  const analyzeStock = async (stock: any) => {
    setIsAnalyzing(true);
    setAnalyzingStock(stock);
    setErrorMessage('');
    
    try {
      const analysisSteps = [];
      let accumulatedData = {};
      
      // 5段階の分析を実行
      for (let step = 1; step <= 5; step++) {
        // ステップごとのメッセージを表示
        const stepMessages = [
          '🔍 基本情報を取得中...',
          '📰 最新ニュースを検索中...',
          '💰 財務データを分析中...',
          '🏆 競合他社と比較中...',
          '🤖 AI総合分析を実行中...'
        ];
        
        setGenerationStep(stepMessages[step - 1]);
        
        const response = await fetch('/api/analyze-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: stock.query,
            step: step,
            previousData: step === 5 ? accumulatedData : undefined
          })
        });

        if (!response.ok) {
          if (response.status === 429) {
            const errorData = await response.json();
            throw new Error(`リクエスト制限に達しました。${errorData.resetIn || 60}秒後に再試行してください。`);
          }
          throw new Error(`ステップ${step}の分析に失敗しました`);
        }

        const stepData = await response.json();
        analysisSteps.push(stepData);
        
        // データを蓄積
        if (stepData.data) {
          accumulatedData = { ...accumulatedData, ...stepData.data };
        }
        
        // 各ステップ間に少し待機（API負荷軽減）
        if (step < 5) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // 分析結果を統合して表示
      setAnalysisResult({
        steps: analysisSteps,
        summary: accumulatedData
      });
      setShowAnalysisModal(true);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setErrorMessage(error instanceof Error ? error.message : '分析中にエラーが発生しました');
    } finally {
      setIsAnalyzing(false);
      setAnalyzingStock(null);
      setGenerationStep('');
    }
  };

  // AIカルテ生成処理（3段階のAPI呼び出し）
  const generateKarte = async () => {
    if (!selectedStock) {
      alert('銘柄を選択してください');
      return;
    }
    
    setIsGenerating(true);
    setGenerationStep('🤖 ChatGPTに企業情報を確認中...');
    setApiNote('OpenAI APIを使用してChatGPTに分析を依頼しています');
    setErrorMessage('');
    
    try {
      // ステップ1: 企業を特定
      setGenerationStep('🤖 ChatGPTに企業情報を聞いています... (1/3)');
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
        const errorData = await step1Response.json().catch(() => ({}));
        if (step1Response.status === 429) {
          throw new Error(`リクエスト制限: ${errorData.message || '少し待ってから再試行してください'}`);
        }
        throw new Error(errorData.error || '企業情報の取得に失敗しました');
      }
      
      const step1Data = await step1Response.json();
      
      // ステップ2: 株価を取得
      setGenerationStep('📊 ChatGPTに株価動向を分析してもらっています... (2/3)');
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
      setGenerationStep('🌟 ChatGPTが詳細な投資分析を作成中... (3/3)');
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
      const errorMsg = error instanceof Error ? error.message : 'AIカルテの生成に失敗しました';
      setErrorMessage(errorMsg + '。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
      setApiNote('');
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

        {/* 話題の銘柄 */}
        {trendingStocks && !searchResults.length && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🔥</span>
              AIが選ぶ話題の銘柄
            </h3>
            
            {/* 日本株 */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{
                fontSize: '15px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>🇯🇵</span>
                日本株
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '10px'
              }}>
                {trendingStocks.japan.map((stock) => (
                  <button
                    key={stock.code}
                    onClick={() => handleTrendingStockClick(stock.code, stock.name)}
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#4f46e5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#111827'
                    }}>
                      <span style={{ color: '#4f46e5' }}>{stock.code}</span>
                      <span>{stock.name}</span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}>
                      {stock.reason}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 米国株 */}
            <div>
              <h4 style={{
                fontSize: '15px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>🇺🇸</span>
                米国株
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '10px'
              }}>
                {trendingStocks.us.map((stock) => (
                  <button
                    key={stock.code}
                    onClick={() => handleTrendingStockClick(stock.code, stock.name)}
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#4f46e5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#111827'
                    }}>
                      <span style={{ color: '#4f46e5' }}>{stock.code}</span>
                      <span>{stock.name}</span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}>
                      {stock.reason}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="error-message" style={{
            marginTop: '10px',
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px', marginTop: '2px' }}>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 検索結果 */}
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Perplexity AI検索結果</h3>
            <div className="results-list">
              {searchResults.map((stock: any, index: number) => (
                <div 
                  key={index} 
                  className="result-item"
                  style={{
                    padding: '20px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    marginBottom: '15px',
                    cursor: 'default',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* 銘柄名 */}
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '18px',
                    marginBottom: '15px',
                    color: '#111827'
                  }}>
                    🔍 {stock.query}
                  </div>
                  
                  {/* 株価情報 */}
                  {stock.priceInfo && (
                    <div style={{
                      backgroundColor: '#f3f4f6',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '15px'
                    }}>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: '#374151'
                      }}>
                        📊 株価情報
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {stock.priceInfo.currentPrice && (
                          <div>
                            <span style={{ color: '#6b7280', fontSize: '12px' }}>現在価格</span>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                              {stock.priceInfo.currentPrice}
                            </div>
                          </div>
                        )}
                        {stock.priceInfo.change && (
                          <div>
                            <span style={{ color: '#6b7280', fontSize: '12px' }}>前日比</span>
                            <div style={{ 
                              fontSize: '16px', 
                              fontWeight: 'bold',
                              color: stock.priceInfo.change.startsWith('-') ? '#dc2626' : '#16a34a'
                            }}>
                              {stock.priceInfo.change}
                              {stock.priceInfo.changePercent && ` (${stock.priceInfo.changePercent}%)`}
                            </div>
                          </div>
                        )}
                        {stock.priceInfo.volume && (
                          <div style={{ gridColumn: 'span 2' }}>
                            <span style={{ color: '#6b7280', fontSize: '12px' }}>出来高</span>
                            <div style={{ fontSize: '14px', color: '#374151' }}>
                              {stock.priceInfo.volume}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* 企業情報 */}
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '15px',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      marginBottom: '10px',
                      color: '#374151'
                    }}>
                      🏢 企業情報
                    </h4>
                    <div style={{ 
                      whiteSpace: 'pre-wrap',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#4b5563',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {stock.companyInfo || stock.content}
                    </div>
                  </div>
                  
                  {/* 分析ボタン */}
                  <div style={{
                    marginTop: '15px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => analyzeStock(stock)}
                      disabled={isAnalyzing && analyzingStock === stock}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: isAnalyzing && analyzingStock === stock ? '#9ca3af' : '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: isAnalyzing && analyzingStock === stock ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isAnalyzing && analyzingStock === stock ? (
                        <>
                          <span style={{
                            display: 'inline-block',
                            width: '14px',
                            height: '14px',
                            border: '2px solid transparent',
                            borderTopColor: 'white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></span>
                          分析中...
                        </>
                      ) : (
                        <>
                          🤖 AI分析を実行
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 分析中の進行状況表示 */}
        {generationStep && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#eff6ff',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '20px',
              height: '20px',
              border: '3px solid #3b82f6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></span>
            <span style={{ color: '#1e40af', fontWeight: '500' }}>
              {generationStep}
            </span>
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
                  '🤖 ChatGPTに分析を依頼'
                )}
              </button>
            </div>
            {apiNote && (
              <div style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeIn 0.3s ease-in'
              }}>
                {apiNote}
              </div>
            )}
          </div>
        )}
      </div>

      {/* サンプル銘柄を削除 */}

      {/* AIカルテ表示 */}
      {showKarte && analysisData && (
        <AIKarteDisplay 
          analysisData={analysisData}
          onClose={closeKarte}
        />
      )}

      {/* 分析結果モーダル */}
      {showAnalysisModal && analysisResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '30px',
            position: 'relative'
          }}>
            {/* クローズボタン */}
            <button
              onClick={() => setShowAnalysisModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f3f4f6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              ×
            </button>

            {/* ヘッダー */}
            <div style={{
              marginBottom: '25px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '15px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '10px'
              }}>
                🤖 AI段階的投資分析レポート
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                5段階のAI分析により、詳細な投資判断材料を提供します
              </p>
            </div>

            {/* 段階的分析結果 */}
            {analysisResult.steps && analysisResult.steps.map((step: any, index: number) => {
              // ステップ5（AI総合分析）の場合は特別な表示
              if (step.step === 5 && step.data) {
                const aiAnalysis = step.data;
                return (
                  <div key={index}>
                    {/* 投資スコアとサマリー */}
                    {aiAnalysis.investmentScore !== undefined && (
                      <div style={{
                        backgroundColor: '#eff6ff',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        borderLeft: '4px solid #3b82f6'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '15px'
                        }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>
                            📊 総合評価
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                          }}>
                            <div style={{
                              fontSize: '32px',
                              fontWeight: 'bold',
                              color: aiAnalysis.investmentScore >= 70 ? '#16a34a' : 
                                     aiAnalysis.investmentScore >= 40 ? '#f59e0b' : '#dc2626'
                            }}>
                              {aiAnalysis.investmentScore}/100
                            </div>
                            <div style={{
                              padding: '6px 16px',
                              borderRadius: '20px',
                              backgroundColor: 
                                aiAnalysis.recommendation === 'BUY' ? '#dcfce7' :
                                aiAnalysis.recommendation === 'HOLD' ? '#fef3c7' : '#fee2e2',
                              color: 
                                aiAnalysis.recommendation === 'BUY' ? '#166534' :
                                aiAnalysis.recommendation === 'HOLD' ? '#92400e' : '#991b1b',
                              fontWeight: 'bold'
                            }}>
                              {aiAnalysis.recommendation === 'BUY' ? '買い推奨' :
                               aiAnalysis.recommendation === 'HOLD' ? '様子見' : '売り推奨'}
                            </div>
                          </div>
                        </div>
                        <p style={{ color: '#374151', lineHeight: '1.6' }}>
                          {aiAnalysis.summary}
                        </p>
                      </div>
                    )}

                    {/* SWOT分析 */}
                    {aiAnalysis.swotAnalysis && (
                      <div style={{
                        backgroundColor: '#f9fafb',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '15px'
                      }}>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#111827',
                          marginBottom: '15px'
                        }}>
                          📋 SWOT分析
                        </h3>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '15px'
                        }}>
                          <div style={{ backgroundColor: '#dcfce7', padding: '15px', borderRadius: '6px' }}>
                            <h4 style={{ color: '#166534', fontWeight: 'bold', marginBottom: '8px' }}>強み (Strengths)</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                              {aiAnalysis.swotAnalysis.strengths?.map((item: string, i: number) => (
                                <li key={i} style={{ color: '#374151', fontSize: '14px' }}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={{ backgroundColor: '#fee2e2', padding: '15px', borderRadius: '6px' }}>
                            <h4 style={{ color: '#991b1b', fontWeight: 'bold', marginBottom: '8px' }}>弱み (Weaknesses)</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                              {aiAnalysis.swotAnalysis.weaknesses?.map((item: string, i: number) => (
                                <li key={i} style={{ color: '#374151', fontSize: '14px' }}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={{ backgroundColor: '#dbeafe', padding: '15px', borderRadius: '6px' }}>
                            <h4 style={{ color: '#1e40af', fontWeight: 'bold', marginBottom: '8px' }}>機会 (Opportunities)</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                              {aiAnalysis.swotAnalysis.opportunities?.map((item: string, i: number) => (
                                <li key={i} style={{ color: '#374151', fontSize: '14px' }}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '6px' }}>
                            <h4 style={{ color: '#92400e', fontWeight: 'bold', marginBottom: '8px' }}>脅威 (Threats)</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                              {aiAnalysis.swotAnalysis.threats?.map((item: string, i: number) => (
                                <li key={i} style={{ color: '#374151', fontSize: '14px' }}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* テクニカル分析とファンダメンタル分析 */}
                    <div style={{
                      backgroundColor: '#f3f4f6',
                      padding: '20px',
                      borderRadius: '8px',
                      marginBottom: '15px'
                    }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: '15px'
                      }}>
                        📊 詳細分析
                      </h3>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '15px',
                        marginBottom: '15px'
                      }}>
                        {/* テクニカル分析 */}
                        {aiAnalysis.technicalIndicators && (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            borderRadius: '8px'
                          }}>
                            <h4 style={{ 
                              fontWeight: 'bold', 
                              marginBottom: '12px', 
                              color: '#374151',
                              fontSize: '16px'
                            }}>
                              📈 テクニカル分析
                            </h4>
                            <div style={{ fontSize: '14px', color: '#4b5563' }}>
                              <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>トレンド:</span>
                                <div style={{ fontWeight: '600', color: '#111827' }}>
                                  {aiAnalysis.technicalIndicators.trend}
                                </div>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>モメンタム:</span>
                                <div style={{ fontWeight: '600', color: '#111827' }}>
                                  {aiAnalysis.technicalIndicators.momentum}
                                </div>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>サポート:</span>
                                <div style={{ fontWeight: '600', color: '#111827' }}>
                                  {aiAnalysis.technicalIndicators.support}
                                </div>
                              </div>
                              <div>
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>レジスタンス:</span>
                                <div style={{ fontWeight: '600', color: '#111827' }}>
                                  {aiAnalysis.technicalIndicators.resistance}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ファンダメンタル分析（財務健全性） */}
                        {aiAnalysis.financialHealth && (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            borderRadius: '8px'
                          }}>
                            <h4 style={{ 
                              fontWeight: 'bold', 
                              marginBottom: '12px', 
                              color: '#374151',
                              fontSize: '16px'
                            }}>
                              💰 ファンダメンタル分析
                            </h4>
                            <div style={{ fontSize: '14px', color: '#4b5563' }}>
                              <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>収益性:</span>
                                <div style={{ fontWeight: '600', color: '#111827' }}>
                                  {aiAnalysis.financialHealth.profitability}
                                </div>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>成長率:</span>
                                <div style={{ fontWeight: '600', color: '#111827' }}>
                                  {aiAnalysis.financialHealth.growthRate}
                                </div>
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>負債水準:</span>
                                <div style={{ fontWeight: '600', color: '#111827' }}>
                                  {aiAnalysis.financialHealth.debtLevel}
                                </div>
                              </div>
                              <div>
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>キャッシュフロー:</span>
                                <div style={{ fontWeight: '600', color: '#111827' }}>
                                  {aiAnalysis.financialHealth.cashFlow}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* その他の分析項目 */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '15px'
                      }}>
                        {/* リスク分析 */}
                        {aiAnalysis.riskAnalysis && (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                          }}>
                            <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>
                              ⚠️ リスク分析
                            </h4>
                            <div style={{ fontSize: '14px', color: '#4b5563' }}>
                              <div style={{
                                padding: '8px',
                                backgroundColor: aiAnalysis.riskAnalysis.overallRiskLevel === '高' ? '#fee2e2' :
                                               aiAnalysis.riskAnalysis.overallRiskLevel === '中' ? '#fef3c7' : '#dcfce7',
                                borderRadius: '4px',
                                marginBottom: '8px',
                                fontWeight: 'bold',
                                color: aiAnalysis.riskAnalysis.overallRiskLevel === '高' ? '#991b1b' :
                                       aiAnalysis.riskAnalysis.overallRiskLevel === '中' ? '#92400e' : '#166534'
                              }}>
                                総合リスク: {aiAnalysis.riskAnalysis.overallRiskLevel}
                              </div>
                              <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                <div style={{ marginBottom: '4px' }}>
                                  <strong>市場:</strong> {aiAnalysis.riskAnalysis.marketRisk}
                                </div>
                                <div style={{ marginBottom: '4px' }}>
                                  <strong>事業:</strong> {aiAnalysis.riskAnalysis.businessRisk}
                                </div>
                                <div>
                                  <strong>財務:</strong> {aiAnalysis.riskAnalysis.financialRisk}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* バリュエーション */}
                        {aiAnalysis.valuation && (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                          }}>
                            <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>
                              💎 バリュエーション
                            </h4>
                            <div style={{ fontSize: '14px', color: '#4b5563' }}>
                              <div style={{
                                padding: '8px',
                                backgroundColor: aiAnalysis.valuation.currentValuation === '割安' ? '#dcfce7' :
                                               aiAnalysis.valuation.currentValuation === '適正' ? '#dbeafe' : '#fee2e2',
                                borderRadius: '4px',
                                marginBottom: '8px',
                                fontWeight: 'bold',
                                color: aiAnalysis.valuation.currentValuation === '割安' ? '#166534' :
                                       aiAnalysis.valuation.currentValuation === '適正' ? '#1e40af' : '#991b1b'
                              }}>
                                現在の評価: {aiAnalysis.valuation.currentValuation}
                              </div>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>目標株価:</strong> {aiAnalysis.valuation.targetPrice}
                              </div>
                              <div>
                                <strong>上昇余地:</strong> {aiAnalysis.valuation.upside}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 投資期間別見通し */}
                    {aiAnalysis.investmentHorizon && (
                      <div style={{
                        backgroundColor: '#f0f9ff',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '15px'
                      }}>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#0369a1',
                          marginBottom: '15px'
                        }}>
                          📅 投資期間別見通し
                        </h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          <div>
                            <strong style={{ color: '#0c4a6e' }}>短期（1-3ヶ月）:</strong>
                            <span style={{ color: '#4b5563', marginLeft: '10px' }}>
                              {aiAnalysis.investmentHorizon.shortTerm}
                            </span>
                          </div>
                          <div>
                            <strong style={{ color: '#0c4a6e' }}>中期（3-12ヶ月）:</strong>
                            <span style={{ color: '#4b5563', marginLeft: '10px' }}>
                              {aiAnalysis.investmentHorizon.mediumTerm}
                            </span>
                          </div>
                          <div>
                            <strong style={{ color: '#0c4a6e' }}>長期（1年以上）:</strong>
                            <span style={{ color: '#4b5563', marginLeft: '10px' }}>
                              {aiAnalysis.investmentHorizon.longTerm}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              
              // ステップ1-4の通常表示
              return (
                <div key={index} style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {step.step}
                    </span>
                    {step.stepName}
                  </h3>
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    color: '#4b5563',
                    fontSize: '14px',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    {Object.entries(step.data).map(([key, value]: [string, any]) => (
                      <div key={key} style={{ marginBottom: '10px' }}>
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* 推奨理由 */}
            {analysisResult.recommendationReason && (
              <div style={{
                backgroundColor: '#eff6ff',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                borderLeft: '4px solid #3b82f6'
              }}>
                <h4 style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>
                  🎯 投資判断の根拠
                </h4>
                <p style={{ color: '#374151', lineHeight: '1.6' }}>
                  {analysisResult.recommendationReason}
                </p>
              </div>
            )}

            {/* 業界分析 */}
            {analysisResult.industryAnalysis && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: '15px'
                }}>
                  🏭 業界分析
                </h3>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '15px',
                  borderRadius: '8px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>市場ポジション:</strong>
                    <div style={{ marginTop: '4px', color: '#4b5563' }}>
                      {analysisResult.industryAnalysis.marketPosition}
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>競合優位性:</strong>
                    <div style={{ marginTop: '4px', color: '#4b5563' }}>
                      {analysisResult.industryAnalysis.competitiveAdvantage}
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>業界トレンド:</strong>
                    <div style={{ marginTop: '4px', color: '#4b5563' }}>
                      {analysisResult.industryAnalysis.industryTrend}
                    </div>
                  </div>
                  {analysisResult.industryAnalysis.majorCompetitors && (
                    <div>
                      <strong style={{ color: '#374151' }}>主要競合:</strong>
                      <div style={{ marginTop: '4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {analysisResult.industryAnalysis.majorCompetitors.map((comp: string, idx: number) => (
                          <span key={idx} style={{
                            padding: '4px 12px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '12px',
                            fontSize: '13px',
                            color: '#374151'
                          }}>
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* 目標株価（古いセクション - 削除予定） */}
            {false && analysisResult.targetPrice && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: '10px'
                }}>
                  🎯 目標株価
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  {analysisResult.targetPrice.threeMonths && (
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '15px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '5px' }}>3ヶ月後</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                        {analysisResult.targetPrice.threeMonths}
                      </div>
                    </div>
                  )}
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '5px' }}>6ヶ月後</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                      {analysisResult.targetPrice.sixMonths}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '5px' }}>1年後</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                      {analysisResult.targetPrice.oneYear}
                    </div>
                  </div>
                  {analysisResult.targetPrice.threeYears && (
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '15px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '5px' }}>3年後</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                        {analysisResult.targetPrice.threeYears}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{
                  backgroundColor: '#dcfce7',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '5px' }}>上昇余地</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>
                    {analysisResult.targetPrice.upside}
                  </div>
                </div>
                {analysisResult.targetPrice.methodology && (
                  <div style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
                    <strong>算出根拠:</strong> {analysisResult.targetPrice.methodology}
                  </div>
                )}
              </div>
            )}

            {/* カタリスト */}
            {analysisResult.catalysts && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: '10px'
                }}>
                  ⚡ 株価変動の触媒
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  {analysisResult.catalysts.positive && (
                    <div style={{
                      backgroundColor: '#f0fdf4',
                      padding: '15px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #22c55e'
                    }}>
                      <h4 style={{ fontWeight: 'bold', color: '#166534', marginBottom: '8px' }}>ポジティブ要因</h4>
                      <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#374151' }}>
                        {analysisResult.catalysts.positive.map((item: string, index: number) => (
                          <li key={index} style={{ marginBottom: '4px' }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.catalysts.negative && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      padding: '15px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #ef4444'
                    }}>
                      <h4 style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '8px' }}>ネガティブ要因</h4>
                      <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#374151' }}>
                        {analysisResult.catalysts.negative.map((item: string, index: number) => (
                          <li key={index} style={{ marginBottom: '4px' }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 投資アクション */}
            {analysisResult.actionItems && (
              <div style={{
                backgroundColor: '#fef3c7',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <h4 style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '12px' }}>
                  📋 具体的な投資アクション
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {analysisResult.actionItems.buyEntry && (
                    <div>
                      <strong style={{ color: '#92400e', fontSize: '13px' }}>買いエントリー:</strong>
                      <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>
                        {analysisResult.actionItems.buyEntry}
                      </div>
                    </div>
                  )}
                  {analysisResult.actionItems.sellExit && (
                    <div>
                      <strong style={{ color: '#92400e', fontSize: '13px' }}>売りエグジット:</strong>
                      <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>
                        {analysisResult.actionItems.sellExit}
                      </div>
                    </div>
                  )}
                  {analysisResult.actionItems.stopLoss && (
                    <div>
                      <strong style={{ color: '#92400e', fontSize: '13px' }}>損切りライン:</strong>
                      <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>
                        {analysisResult.actionItems.stopLoss}
                      </div>
                    </div>
                  )}
                  {analysisResult.actionItems.positionSize && (
                    <div>
                      <strong style={{ color: '#92400e', fontSize: '13px' }}>推奨ポジション:</strong>
                      <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>
                        {analysisResult.actionItems.positionSize}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* アナリストノート */}
            {analysisResult.analystNote && (
              <div style={{
                backgroundColor: '#fef3c7',
                padding: '15px',
                borderRadius: '8px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <h4 style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '8px' }}>
                  📝 アナリストノート
                </h4>
                <p style={{ color: '#374151', lineHeight: '1.6' }}>
                  {analysisResult.analystNote}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* スピナーアニメーション用のスタイル */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}