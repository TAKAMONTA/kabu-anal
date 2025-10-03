/**
 * 環境変数とAPIキー検証スクリプト (簡易版)
 */

const fs = require('fs');
const path = require('path');

// .env.localを読み込み
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.localが見つかりません');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// 環境変数をパース
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  }
});

console.log('🔍 環境変数検証\n');

// 必須APIキーのチェック
const requiredKeys = [
  'OPENAI_API_KEY',
  'CLAUDE_API_KEY',
  'GEMINI_API_KEY',
  'PERPLEXITY_API_KEY'
];

const firebaseClientKeys = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const firebaseAdminKeys = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

let hasErrors = false;
let hasWarnings = false;

console.log('📋 AI APIキー:');
requiredKeys.forEach(key => {
  const value = envVars[key];
  if (!value || value.includes('your_')) {
    console.log(`  ❌ ${key}: 未設定`);
    hasErrors = true;
  } else if (value.length < 20) {
    console.log(`  ⚠️  ${key}: 設定済み (短すぎる可能性)`);
    hasWarnings = true;
  } else {
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`  ✅ ${key}: ${masked}`);
  }
});

console.log('\n🔥 Firebase Client設定:');
firebaseClientKeys.forEach(key => {
  const value = envVars[key];
  if (!value || value.includes('your_')) {
    console.log(`  ❌ ${key}: 未設定`);
    hasErrors = true;
  } else {
    const masked = value.length > 20
      ? value.substring(0, 12) + '...'
      : value.substring(0, 8) + '...';
    console.log(`  ✅ ${key}: ${masked}`);
  }
});

console.log('\n🔑 Firebase Admin SDK:');
firebaseAdminKeys.forEach(key => {
  const value = envVars[key];
  if (!value || value.includes('your_')) {
    console.log(`  ❌ ${key}: 未設定`);
    hasErrors = true;
  } else if (key === 'FIREBASE_PRIVATE_KEY') {
    console.log(`  ✅ ${key}: ${value.substring(0, 30)}...`);
  } else {
    console.log(`  ✅ ${key}: ${value}`);
  }
});

console.log('\n📊 サマリー:');
const configuredCount = [...requiredKeys, ...firebaseClientKeys, ...firebaseAdminKeys]
  .filter(key => envVars[key] && !envVars[key].includes('your_')).length;
const totalCount = requiredKeys.length + firebaseClientKeys.length + firebaseAdminKeys.length;

console.log(`  設定済み: ${configuredCount}/${totalCount}`);

if (hasErrors) {
  console.log('\n❌ 必須の環境変数が不足しています');
  console.log('📝 .env.example を参照して .env.local を設定してください\n');
  process.exit(1);
}

if (hasWarnings) {
  console.log('\n⚠️  警告: 一部のAPIキーが短すぎる可能性があります\n');
}

console.log('\n✨ すべての環境変数が設定されています！');
console.log('💡 実際のAPI接続テストは開発サーバーを起動して確認してください\n');
