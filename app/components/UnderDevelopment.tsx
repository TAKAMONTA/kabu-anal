export default function UnderDevelopment({ 
  title, 
  icon, 
  description 
}: { 
  title: string; 
  icon: string; 
  description: string;
}) {
  return (
    <main>
      <div className="dev-container">
        <div className="dev-icon">{icon}</div>
        <h1>{title}</h1>
        <p className="subtitle">{description}</p>
        
        <div className="dev-notice">
          <div className="dev-badge">🚧 開発中</div>
          <h2>このページは現在開発中です</h2>
          <p>
            この機能は鋭意開発中です。<br />
            完成まで今しばらくお待ちください。
          </p>
          
          <div className="dev-features">
            <h3>実装予定の機能</h3>
            <ul>
              <li>✅ 基本デザイン完成</li>
              <li>⏳ 機能実装中</li>
              <li>⏳ テスト中</li>
              <li>⏳ 本番リリース準備</li>
            </ul>
          </div>
        </div>

        <div className="back-link">
          <a href="/">← ホームに戻る</a>
        </div>
      </div>
    </main>
  );
}