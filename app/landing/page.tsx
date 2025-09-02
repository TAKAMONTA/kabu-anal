"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../lib/firebase";
import styles from "./landing.module.css";

export default function LandingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        if (password !== confirmPassword) {
          setError('パスワードが一致しません');
          setLoading(false);
          return;
        }
        
        const result = await signUp(email, password);
        if (result.success) {
          // 登録成功後、ダッシュボードへリダイレクト
          router.push('/');
        } else {
          setError(result.error || '登録に失敗しました');
        }
      } else {
        const result = await signIn(email, password);
        if (result.success) {
          // ログイン成功後、ダッシュボードへリダイレクト
          router.push('/');
        } else {
          setError(result.error || 'ログインに失敗しました');
        }
      }
    } catch (err) {
      setError('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Googleログイン成功後、ダッシュボードへリダイレクト
        router.push('/');
      }
    } catch (error: any) {
      let errorMessage = 'Googleログインに失敗しました';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'ログインがキャンセルされました';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.logo}>
            <span className={styles.logoText}>株穴</span>
            <span className={styles.logoSub}>kabu-ana</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/karte" className={styles.navLink}>
              AIカルテを試す
            </Link>
            <Link href="#features" className={styles.navLink}>
              機能
            </Link>
            <Link href="#how-it-works" className={styles.navLink}>
              使い方
            </Link>
            <button 
              className={styles.loginButton}
              onClick={() => openAuthModal('login')}
            >
              ログイン
            </button>
            <button 
              className={styles.signupButton}
              onClick={() => openAuthModal('signup')}
            >
              新規登録
            </button>
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={`${styles.hero} ${isVisible ? styles.visible : ""}`}>
          <h1 className={styles.title}>
            <span className={styles.titleMain}>AI株式分析カルテ</span>
            <span className={styles.titleSub}>個人投資家のための次世代投資分析プラットフォーム</span>
          </h1>
          
          <p className={styles.description}>
            最新のAI技術を活用して、日本株・米国株の詳細な投資分析を瞬時に提供。
            <br />
            投資判断に必要な全ての情報を、分かりやすく可視化します。
          </p>

          <div className={styles.cta}>
            <Link href="/karte" className={styles.primaryButton}>
              無料で分析を始める
            </Link>
            <Link href="#features" className={styles.secondaryButton}>
              機能を見る
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>5,000+</span>
              <span className={styles.statLabel}>対応銘柄</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>リアルタイム</span>
              <span className={styles.statLabel}>データ更新</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>5段階</span>
              <span className={styles.statLabel}>AI分析</span>
            </div>
          </div>
        </section>

        <section id="features" className={styles.features}>
          <h2 className={styles.sectionTitle}>主な機能</h2>
          
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤖</div>
              <h3 className={styles.featureTitle}>AI総合分析</h3>
              <p className={styles.featureDescription}>
                複数のAIモデルを組み合わせた高精度な投資分析。財務、テクニカル、ファンダメンタルズを網羅。
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3 className={styles.featureTitle}>SWOT分析</h3>
              <p className={styles.featureDescription}>
                企業の強み・弱み・機会・脅威を可視化。戦略的な投資判断をサポート。
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💰</div>
              <h3 className={styles.featureTitle}>投資スコア</h3>
              <p className={styles.featureDescription}>
                0-100点の直感的なスコアリング。BUY/HOLD/SELLの推奨レベルを明確に提示。
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📈</div>
              <h3 className={styles.featureTitle}>テクニカル指標</h3>
              <p className={styles.featureDescription}>
                トレンド、モメンタム、サポート/レジスタンスレベルを詳細に分析。
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚠️</div>
              <h3 className={styles.featureTitle}>リスク評価</h3>
              <p className={styles.featureDescription}>
                市場リスク、事業リスク、財務リスクを総合的に評価し、投資の安全性を判定。
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎯</div>
              <h3 className={styles.featureTitle}>目標株価</h3>
              <p className={styles.featureDescription}>
                AI予測による目標株価と上昇余地を算出。短期・中期・長期の見通しを提供。
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>使い方</h2>
          
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>銘柄を検索</h3>
              <p className={styles.stepDescription}>
                銘柄コードまたは企業名で検索
              </p>
            </div>

            <div className={styles.stepArrow}>→</div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>AI分析を実行</h3>
              <p className={styles.stepDescription}>
                5段階の詳細な分析を自動実行
              </p>
            </div>

            <div className={styles.stepArrow}>→</div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>結果を確認</h3>
              <p className={styles.stepDescription}>
                包括的な投資分析レポートを取得
              </p>
            </div>
          </div>
        </section>

        <section className={styles.demo}>
          <h2 className={styles.sectionTitle}>実際の分析例</h2>
          <div className={styles.demoContent}>
            <div className={styles.demoCard}>
              <h3>トヨタ自動車 (7203)</h3>
              <div className={styles.demoStats}>
                <div className={styles.demoStat}>
                  <span className={styles.demoLabel}>投資スコア</span>
                  <span className={styles.demoValue}>85/100</span>
                </div>
                <div className={styles.demoStat}>
                  <span className={styles.demoLabel}>推奨</span>
                  <span className={styles.demoValueBuy}>BUY</span>
                </div>
                <div className={styles.demoStat}>
                  <span className={styles.demoLabel}>上昇余地</span>
                  <span className={styles.demoValue}>+15.2%</span>
                </div>
              </div>
              <p className={styles.demoDescription}>
                電動化への移行が順調に進展。堅実な財務基盤と高い配当利回りが魅力。
              </p>
            </div>
          </div>
        </section>

        <section className={styles.cta2}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>今すぐ無料で始めましょう</h2>
            <p className={styles.ctaDescription}>
              クレジットカード不要。すぐに高度な株式分析を体験できます。
            </p>
            <Link href="/karte" className={styles.ctaButton}>
              無料で分析を開始
            </Link>
          </div>
        </section>
      </main>

      {/* 認証モーダル */}
      {showAuthModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAuthModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalClose}
              onClick={() => setShowAuthModal(false)}
            >
              ×
            </button>
            
            <h2 className={styles.modalTitle}>
              {authMode === 'login' ? 'ログイン' : '新規登録'}
            </h2>
            
            <form onSubmit={handleAuth} className={styles.authForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email">メールアドレス</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="password">パスワード</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="6文字以上"
                  minLength={6}
                />
              </div>
              
              {authMode === 'signup' && (
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">パスワード（確認）</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="パスワードを再入力"
                    minLength={6}
                  />
                </div>
              )}
              
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}
              
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? '処理中...' : (authMode === 'login' ? 'ログイン' : '登録する')}
              </button>
              
              <div className={styles.divider}>
                <span>または</span>
              </div>
              
              <button 
                type="button" 
                className={styles.googleButton}
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Googleでログイン
              </button>
              
              <div className={styles.authSwitch}>
                {authMode === 'login' ? (
                  <p>
                    アカウントをお持ちでない方は
                    <button 
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className={styles.switchButton}
                    >
                      新規登録
                    </button>
                  </p>
                ) : (
                  <p>
                    既にアカウントをお持ちの方は
                    <button 
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={styles.switchButton}
                    >
                      ログイン
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>株穴 (kabu-ana)</h4>
            <p className={styles.footerText}>
              AI技術を活用した次世代の株式分析プラットフォーム
            </p>
          </div>
          
          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>機能</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/karte">AIカルテ</Link></li>
              <li><Link href="#features">主な機能</Link></li>
              <li><Link href="#how-it-works">使い方</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>会社情報</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/terms">利用規約</Link></li>
              <li><Link href="/privacy">プライバシーポリシー</Link></li>
              <li><Link href="/contact">お問い合わせ</Link></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; 2024 株穴 (kabu-ana). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}