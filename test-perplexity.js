const fs = require('fs');

// .env.localから環境変数を読み込み
const envContent = fs.readFileSync('.env.local', 'utf8');
const apiKey = envContent
  .split('\n')
  .find(line => line.startsWith('PERPLEXITY_API_KEY='))
  ?.split('=')[1]
  .trim();

if (!apiKey) {
  console.error('PERPLEXITY_API_KEY not found');
  process.exit(1);
}

async function testPerplexity() {
  try {
    console.log('Testing Perplexity API...\n');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{
          role: 'user',
          content: 'トヨタ自動車の株式コード7203の現在の株価を教えてください。'
        }],
        temperature: 0.1,
      }),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('\n❌ API呼び出し失敗');
      process.exit(1);
    }

    console.log('\n✅ Perplexity API正常動作');
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    process.exit(1);
  }
}

testPerplexity();
