# 🎯 株穴（kabu-ana） - AI株式分析カルテ

AI技術を活用した個人投資家向けの株式分析プラットフォーム

## ✨ 主な機能

### 📊 AIカルテ機能（実装済み）
- **銘柄検索**: 日本株・米国株の検索機能
- **3段階AI分析**: 
  1. 企業情報の特定
  2. 最新株価の取得
  3. 詳細な投資分析
- **包括的な分析項目**:
  - 会社概要と事業内容
  - 基本投資指標（PER、PBR、配当利回り等）
  - AI投資スコア（0-10点評価）
  - 財務健全性（5項目評価）
  - 市場センチメント分析
  - 競合他社との比較
  - テクニカル指標
  - 投資スタイル適性度
  - リスクと成長機会

### 🚀 今後実装予定
- 📰 市場ニュース（AI要約機能付き）
- 💼 ポートフォリオ管理
- 🤖 AIディベート（複数AI視点での分析）
- 🔔 価格アラート機能
- 🎮 投資シミュレーター

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 14.2.3, React 18, TypeScript
- **スタイリング**: CSS Modules（Tailwind CSS不使用）
- **AI統合**: OpenAI/Claude/Gemini API対応
- **デプロイ**: Vercel

## 🚀 セットアップ

### 1. リポジトリのクローン
```bash
git clone [your-repo-url]
cd kabu-ana-simple
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
`.env.local`ファイルを作成し、必要なAPIキーを設定：

```bash
cp .env.example .env.local
# .env.localを編集してAPIキーを追加
```

### 4. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 🔑 必要なAPIキー

以下のいずれか1つ以上のAI APIキーが必要です：

- **OpenAI API**: [取得先](https://platform.openai.com/)
- **Claude API**: [取得先](https://console.anthropic.com/)
- **Gemini API**: [取得先](https://makersuite.google.com/app/apikey)

オプション（リアルタイム株価データ用）：
- **Alpha Vantage API**: [取得先](https://www.alphavantage.co/)

## 📦 Vercelへのデプロイ

### 1. Vercel CLIのインストール
```bash
npm i -g vercel
```

### 2. Vercelにログイン
```bash
vercel login
```

### 3. プロジェクトのデプロイ
```bash
vercel
```

### 4. 環境変数の設定
Vercelダッシュボードで以下の環境変数を設定：
- `OPENAI_API_KEY`
- `CLAUDE_API_KEY`（オプション）
- `GEMINI_API_KEY`（オプション）

### 5. 本番環境へのデプロイ
```bash
vercel --prod
```

## 📝 使い方

1. **銘柄検索**: 検索ボックスに銘柄コードまたは企業名を入力
2. **銘柄選択**: 検索結果または人気銘柄から選択
3. **カルテ生成**: 「AIカルテを生成」ボタンをクリック
4. **分析確認**: 生成された詳細な投資分析を確認

## 🤝 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📄 ライセンス

MIT

## 🆘 サポート

問題が発生した場合は、[Issues](https://github.com/[your-username]/kabu-ana-simple/issues)で報告してください。

## 🎉 デモ

[ライブデモを見る](https://kabu-ana.vercel.app)

---

Made with ❤️ by [Your Name]# Deployment trigger
