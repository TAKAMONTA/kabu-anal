# 株式分析AI - カブアナ

複数のAI（OpenAI、Claude、Gemini）による包括的な株式分析システム

## 主な機能

- 🤖 **3つのAI統合分析**: 各AIが専門分野に特化した多角的分析
  - 📈 **Gemini 2.5 Flash**: テクニカル分析（チャート、トレンド、指標）
  - 💼 **Claude 3.5 Sonnet**: ファンダメンタル分析（決算、財務、業界動向）
  - ⚖️ **OpenAI GPT-4o-mini**: 総合判断（統合分析、投資推奨）
- ⚡ **並列処理**: 3つのAIが同時に分析を実行し、高速な結果を提供
- 📊 **包括的レポート**: テクニカル、ファンダメンタル、総合判断を統合
- 🎯 **信頼度スコア**: 各分析に信頼度を付与し、総合評価を算出
- 🔐 **Firebase認証**: セキュアなユーザー認証システム

**📖 詳細**: [分析システム詳細仕様](./ANALYSIS_SYSTEM.md)

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **認証**: Firebase Authentication
- **データベース**: Firestore
- **AI統合**: OpenAI API, Anthropic Claude API, Google Gemini API

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定：

```env
# AI API Keys
OPENAI_API_KEY=your_openai_api_key
CLAUDE_API_KEY=your_claude_api_key
GEMINI_API_KEY=your_gemini_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Logging (オプション)
# 開発: debug (デフォルト) | 本番: warn (デフォルト)
LOG_LEVEL=debug
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## ビルド

```bash
npm run build
npm start
```

## プロジェクト構造

```
kabu-ana/
├── app/
│   ├── analysis/          # 株式分析ページ
│   ├── api/
│   │   ├── orchestrator/  # AI統合APIエンドポイント
│   │   └── health/        # ヘルスチェック
│   ├── components/        # 再利用可能なUIコンポーネント
│   ├── lib/              # ユーティリティとFirebase設定
│   ├── login/            # 認証ページ
│   ├── types/            # TypeScript型定義
│   ├── globals.css       # グローバルスタイル
│   ├── layout.tsx        # ルートレイアウト
│   └── page.tsx          # ホームページ
├── public/               # 静的ファイル
└── ...config files
```

## 使い方

1. **ホームページ**: アプリケーションの概要と機能紹介
2. **株式分析**: 銘柄コードを入力してAI分析を実行
3. **ログイン/登録**: Firebase認証でユーザーアカウントを管理

## API エンドポイント

- `POST /api/orchestrator`: 株式分析を実行（パラメータ: `stockCode`）
- `GET /api/health`: サーバーヘルスチェック

## ライセンス

Private
