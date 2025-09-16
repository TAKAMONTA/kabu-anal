# 🚀 デプロイガイド - 株穴 (Kabu-Ana)

## 📋 デプロイ準備チェックリスト

### ✅ 完了済み項目

- [x] Next.js 15 プロジェクト構成
- [x] TypeScript 設定完了
- [x] 全 API Routes 実装済み
- [x] 型安全性 100%確保
- [x] フロントエンド完成
- [x] ビルドスクリプト設定済み

### 🔧 必要な環境変数

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## 🌐 推奨デプロイプラットフォーム

### 1. **Vercel（最推奨）** ⭐

```bash
# Vercelでのデプロイ手順
npm i -g vercel
vercel login
vercel --prod
```

**設定方法:**

1. GitHub/GitLab にプッシュ
2. Vercel ダッシュボードでプロジェクトインポート
3. 環境変数 `OPENAI_API_KEY` を設定
4. 自動デプロイ完了

**メリット:**

- Next.js 専用最適化
- 自動スケーリング
- グローバル CDN
- 無料枠で十分

### 2. **Netlify**

```bash
# Netlify CLI
npm i -g netlify-cli
netlify login
netlify deploy --prod
```

### 3. **Railway**

```bash
# Railway CLI
npm i -g @railway/cli
railway login
railway deploy
```

### 4. **Docker + クラウド**

```dockerfile
# Dockerfile（必要に応じて）
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📦 ビルドコマンド

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm run start

# 開発サーバー
npm run dev
```

## 🔐 セキュリティ設定

### 必須環境変数

- `OPENAI_API_KEY`: OpenAI API キー（必須）

### 推奨設定

```env
NODE_ENV=production
```

## 📊 API 使用状況

### 外部 API 依存関係

1. **OpenAI API**: AI 分析機能

   - モデル: `gpt-4o-mini`
   - 最大トークン: 800
   - レート制限: OpenAI 標準

2. **Yahoo Finance API**: 株価データ
   - 無料・認証不要
   - リアルタイムデータ取得

### API 制限

- OpenAI: 使用量に応じた課金
- Yahoo Finance: レート制限あり（通常利用範囲内）

## 🚀 デプロイ後の確認項目

### 機能テスト

- [ ] トップページ表示
- [ ] 検索機能（例: "7203", "AAPL"）
- [ ] AI 分析表示
- [ ] 株価チャート表示
- [ ] 財務データ表示
- [ ] エラーハンドリング

### パフォーマンス

- [ ] ページロード速度
- [ ] API 応答時間
- [ ] モバイル対応

## ⚠️ 注意事項

### データ精度

- 株価データ: Yahoo Finance 提供（リアルタイム）
- 財務データ: ダミーデータ（実装で本物に置き換え可能）
- AI 分析: OpenAI GPT-4o-mini 使用

### 免責事項

- 投資判断は自己責任
- データの正確性は保証なし
- 本番環境での使用は十分な検証後に

## 🔧 トラブルシューティング

### よくある問題

1. **ビルドエラー**: `npm install` → `npm run build`
2. **API エラー**: 環境変数 `OPENAI_API_KEY` 確認
3. **型エラー**: TypeScript 設定確認

### ログ確認

```bash
# Vercelログ
vercel logs

# 本番ログ
npm run start
```

## 📈 今後の改善点

### 近時実装予定

- [ ] 実際の財務データ取得
- [ ] ユーザー認証
- [ ] お気に入り機能
- [ ] 複数銘柄比較

### スケーラビリティ

- [ ] キャッシュ機能
- [ ] データベース連携
- [ ] 監視・アラート

---

## 🎉 Ready to Deploy!

**現在のプロジェクトはデプロイ可能です！**

環境変数 `OPENAI_API_KEY` を設定するだけで、
本格的な株式分析アプリが稼働します。
