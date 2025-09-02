'use client';

import { useAuth } from './contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from './components/Header';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 認証がない場合はランディングページへリダイレクト
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  const features = [
    { title: '銘柄AIカルテ', description: 'AIが個別銘柄を徹底分析', icon: '🔍', href: '/karte' },
    { title: '市場ニュース', description: 'AI要約で効率的な情報収集', icon: '📰', href: '/news' },
    { title: 'ランキング', description: '条件に合った銘柄を発見', icon: '📊', href: '/ranking' },
    { title: '学習クイズ', description: '投資知識を楽しく習得', icon: '🧠', href: '/quiz' },
    { title: 'AIディベート', description: '複数AIによる銘柄分析', icon: '🤖', href: '/ai-debate' },
    { title: 'アラート', description: '価格変動を自動監視', icon: '🔔', href: '/alerts' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <main>
        <h1>株穴 (kabu-ana)</h1>
        <p className="subtitle">AI×投資情報の新しい形</p>
        <div className="status">
          ✅ ようこそ、{user.displayName || user.email}さん！
        </div>

        <h2>機能一覧</h2>
        <div className="features">
          {features.map((feature, index) => (
            <a key={index} href={feature.href} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </a>
          ))}
        </div>
      </main>
    </>
  )
}