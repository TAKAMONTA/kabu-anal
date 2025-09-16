# 🔧 Vercel デプロイエラー修正手順

## 🎯 問題の解決

### ❌ エラー内容

```
Error: The file "/vercel/path0/app/.next/routes-manifest.json" couldn't be found.
```

### ✅ 解決方法

## 📋 手順 1: Vercel プロジェクト設定変更

### 1. **Vercel ダッシュボードにアクセス**

- [https://vercel.com/dashboard](https://vercel.com/dashboard) にログイン
- プロジェクト `kabu-ana` を選択

### 2. **Root Directory を変更**

1. **Settings** タブをクリック
2. **General** セクションを選択
3. **Root Directory** を見つける
4. **Edit** ボタンをクリック
5. **Root Directory** に `app` を入力
6. **Save** をクリック

### 3. **再デプロイの実行**

1. **Deployments** タブに移動
2. **Redeploy** ボタンをクリック
3. **Use existing Build Cache** のチェックを **外す**
4. **Redeploy** を実行

## 📋 手順 2: ローカル設定確認

### 1. **next.config.ts 設定確認** ✅

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  experimental: {
    turbopack: {
      root: __dirname, // ✅ ルートを明示
    },
  },

  // 他の設定...
};
```

### 2. **.gitignore 設定確認** ✅

```
/.next/  # ✅ Vercelキャッシュ混乱防止
/out/
/node_modules
.env*.local
.vercel
```

### 3. **package.json 設定確認** ✅

```json
{
  "scripts": {
    "dev": "next dev", // ✅ Turbopackなし
    "build": "next build", // ✅ Turbopackなし
    "start": "next start"
  }
}
```

## 🔄 手順 3: 変更のコミット・プッシュ

```bash
# 変更をコミット
git add .
git commit -m "Vercel設定修正: Root Directory対応とキャッシュ問題解決"
git push origin main
```

## 📊 期待される結果

### ✅ **修正後**

- Vercel が `/vercel/path0/app` を正しくルートとして認識
- `.next/routes-manifest.json` が正しいパスで生成
- デプロイが成功する
- アプリが正常に動作する

### 🎯 **確認項目**

- [ ] Vercel Root Directory が `app` に設定されている
- [ ] キャッシュなしで再デプロイ完了
- [ ] ビルドエラーが解消されている
- [ ] 本番 URL でアプリが動作している

## 🚨 重要なポイント

### 1. **Root Directory が重要**

- Vercel は現在プロジェクトルートを `/kabu-ana` として認識
- 実際の Next.js プロジェクトは `/kabu-ana/app` にある
- Root Directory を `app` に設定することで正しいパスを指定

### 2. **キャッシュのクリア**

- 古いビルドキャッシュが問題を引き起こしている可能性
- **必ず** "Use existing Build Cache" のチェックを外して再デプロイ

### 3. **Turbopack の無効化**

- 本番ビルドでは標準の Next.js ビルドを使用
- Turbopack は開発環境でのみ有効

## 📞 トラブルシューティング

### 問題が続く場合

1. Vercel プロジェクトを一度削除
2. 新しくインポート（Root Directory: `app` を最初から設定）
3. 環境変数 `OPENAI_API_KEY` を再設定
4. デプロイ実行

---

**この手順で問題が解決するはずです！**
