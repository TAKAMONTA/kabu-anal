'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import LoginForm from '@/app/components/auth/LoginForm';
import SignUpForm from '@/app/components/auth/SignUpForm';

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/karte');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヒーローセクション */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="text-6xl mr-3 animate-pulse">📊</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              株価分析AIカルテ
            </h1>
          </div>
          <p className="text-xl text-gray-700 mb-2 font-medium">
            AIの力で株式投資をもっとスマートに
          </p>
          <p className="text-lg text-gray-600">
            詳細な企業分析と投資判断をAIがサポート
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start max-w-7xl mx-auto">
          {/* 左側：特徴説明 */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-95 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">✨</span>
                サービスの特徴
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start group hover:transform hover:scale-105 transition-transform duration-200">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">AI分析</h3>
                    <p className="text-gray-600 leading-relaxed">
                      最新のAI技術で企業の財務状況、市場動向、投資リスクを総合的に分析
                    </p>
                  </div>
                </div>

                <div className="flex items-start group hover:transform hover:scale-105 transition-transform duration-200">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">詳細レポート</h3>
                    <p className="text-gray-600 leading-relaxed">
                      財務分析、テクニカル分析、ファンダメンタル分析を網羅した包括的なレポート
                    </p>
                  </div>
                </div>

                <div className="flex items-start group hover:transform hover:scale-105 transition-transform duration-200">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-2xl">💡</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">投資アドバイス</h3>
                    <p className="text-gray-600 leading-relaxed">
                      リスク評価と投資タイミングの提案で、より賢明な投資判断をサポート
                    </p>
                  </div>
                </div>

                <div className="flex items-start group hover:transform hover:scale-105 transition-transform duration-200">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">リアルタイム更新</h3>
                    <p className="text-gray-600 leading-relaxed">
                      最新の市場データと企業情報を反映した、常に新鮮な分析結果
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="mr-2 text-2xl">🎯</span>
                こんな方におすすめ
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-2 text-green-300 text-xl">✓</span>
                  株式投資を始めたいが、何から始めれば良いか分からない方
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-300 text-xl">✓</span>
                  企業分析に時間をかけられない忙しい投資家
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-300 text-xl">✓</span>
                  データに基づいた合理的な投資判断をしたい方
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-300 text-xl">✓</span>
                  投資のリスクを適切に管理したい方
                </li>
              </ul>
            </div>
          </div>

          {/* 右側：ログイン/登録フォーム */}
          <div>
            {isLoginMode ? (
              <LoginForm
                onSuccess={() => router.push('/karte')}
                onSignUpClick={() => setIsLoginMode(false)}
              />
            ) : (
              <SignUpForm
                onSuccess={() => router.push('/karte')}
                onLoginClick={() => setIsLoginMode(true)}
              />
            )}
          </div>
        </div>

        {/* 追加情報セクション */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 animate-slide-up">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-5xl mb-3 animate-pulse">🔒</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">セキュア</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Googleアカウント連携と<br />暗号化による安全な認証
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-5xl mb-3 animate-pulse">🚀</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">高速分析</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              最新AIによる<br />瞬時の銘柄分析
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-5xl mb-3 animate-pulse">📱</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">マルチデバイス</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              PC・スマホ・タブレット<br />どこからでもアクセス可能
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}