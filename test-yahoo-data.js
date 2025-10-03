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

async function testYahooFinanceData() {
  try {
    console.log('Testing Yahoo Finance data extraction via Perplexity...\n');

    const prompt = `Yahoo Finance Japan (https://finance.yahoo.co.jp/quote/7203.T) から、トヨタ自動車(7203)の以下の情報を取得してください:

1. PER (株価収益率)
2. PBR (株価純資産倍率)
3. ROE (自己資本利益率)
4. EPS (1株当たり利益)
5. 配当利回り
6. 移動平均線 (25日、75日、200日)
7. RSI
8. MACD

取得できた情報のみをJSON形式で返してください。取得できない項目は null としてください。

{
  "PER": 数値またはnull,
  "PBR": 数値またはnull,
  "ROE": 数値またはnull,
  "EPS": 数値またはnull,
  "配当利回り": 数値またはnull,
  "MA25": 数値またはnull,
  "MA75": 数値またはnull,
  "MA200": 数値またはnull,
  "RSI": 数値またはnull,
  "MACD": {
    "値": 数値またはnull,
    "シグナル": 数値またはnull,
    "ヒストグラム": 数値またはnull
  }
}`;

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
          content: prompt
        }],
        temperature: 0.1,
        return_citations: true,
      }),
    });

    console.log('Status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error('\n❌ API呼び出し失敗');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n=== Perplexity Response ===');
    console.log('Content:', data.choices[0].message.content);
    console.log('\n=== Citations ===');
    console.log(data.citations);

    // JSONを抽出
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[0];
      const extractedData = JSON.parse(jsonString);
      console.log('\n=== Extracted Data ===');
      console.log(JSON.stringify(extractedData, null, 2));

      // 取得できたフィールドと取得できなかったフィールドを集計
      const available = [];
      const missing = [];

      for (const [key, value] of Object.entries(extractedData)) {
        if (value === null || value === undefined) {
          missing.push(key);
        } else if (typeof value === 'object' && value !== null) {
          // MACDの場合
          const subAvailable = [];
          const subMissing = [];
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue === null || subValue === undefined) {
              subMissing.push(`${key}.${subKey}`);
            } else {
              subAvailable.push(`${key}.${subKey}`);
            }
          }
          if (subAvailable.length > 0) available.push(...subAvailable);
          if (subMissing.length > 0) missing.push(...subMissing);
        } else {
          available.push(key);
        }
      }

      console.log('\n=== Summary ===');
      console.log('✅ Available Fields:', available.join(', '));
      console.log('❌ Missing Fields:', missing.join(', '));
      console.log(`\nData Availability: ${available.length}/${available.length + missing.length} (${Math.round(available.length / (available.length + missing.length) * 100)}%)`);
    }

    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    process.exit(1);
  }
}

testYahooFinanceData();
