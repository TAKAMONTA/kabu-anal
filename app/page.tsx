import Link from "next/link";
import Header from "./components/Header";
import StockAnalysisForm from "./components/StockAnalysisForm";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen ukiyoe-layout">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12 relative">
            <h1 className="text-5xl font-bold text-[#2e4057] mb-4 tracking-wider">
              株式分析AI - 株アナ
            </h1>
            <p className="text-xl text-[#2c2c2c] font-medium">
              市場三賢人による包括的な株式分析
            </p>
            <div className="absolute -top-6 right-6 flex items-center gap-2 md:gap-4">
              <div className="ukiyoe-insho">株</div>
              {/* ヘッダー広告スペース */}
              <div className="hidden md:block w-32 h-20 bg-gradient-to-br from-[#fff8e1] to-[#ffecb3] border border-[#ffc107] rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-[#666]">広告</div>
                  <div className="text-lg">📢</div>
                  <div className="text-xs text-[#ff8f00]">120×80px</div>
                </div>
              </div>
              {/* モバイル用広告スペース */}
              <div className="md:hidden w-20 h-16 bg-gradient-to-br from-[#fff8e1] to-[#ffecb3] border border-[#ffc107] rounded flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs">📢</div>
                  <div className="text-xs text-[#ff8f00]">広告</div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="ukiyoe-card ukiyoe-card-shadow border-[#d4af37] p-6">
                  <h2 className="text-2xl font-bold text-[#2e4057] mb-4 flex items-center gap-2">
                    <span className="text-3xl">📊</span> AI株式分析
                  </h2>

                  {/* 操作手順 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#2e4057] mb-3">
                      📝 操作方法
                    </h3>
                    <div className="space-y-2 text-sm text-[#2c2c2c]">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#d4af37] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                        <span>
                          銘柄コードを入力するか、サンプル銘柄をクリック
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#d4af37] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          2
                        </span>
                        <span>自動的に分析ページに移動して分析開始</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#d4af37] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          3
                        </span>
                        <span>3つのAIが包括的な分析を実行</span>
                      </div>
                    </div>
                  </div>

                  {/* 銘柄コード入力フォーム */}
                  <div className="mb-4">
                    <StockAnalysisForm />
                  </div>

                  {/* サンプル銘柄ボタン */}
                  <div className="mb-4">
                    <p className="text-sm text-[#666] mb-2">
                      💡 サンプル銘柄で試す：
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { code: "7203", name: "トヨタ自動車" },
                        { code: "6758", name: "ソニー" },
                        { code: "9984", name: "ソフトバンクG" },
                        { code: "AAPL", name: "Apple" },
                        { code: "MSFT", name: "Microsoft" },
                        { code: "GOOGL", name: "Google" },
                      ].map(stock => (
                        <Link
                          key={stock.code}
                          href={`/three-sages?symbol=${stock.code}&auto=true`}
                          className="bg-[#f8f8f8] hover:bg-[#e8e8e8] border border-[#d4af37] text-[#2c2c2c] px-3 py-1 rounded text-xs transition-colors"
                        >
                          {stock.code} ({stock.name})
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* システム詳細 */}
                  <div className="text-sm text-[#666] bg-[#f8f8f8] p-3 rounded border-l-4 border-[#d4af37]">
                    <strong>三賢人システム：</strong>{" "}
                    OpenAI、Claude、Geminiによる包括的分析
                  </div>
                </div>
              </div>

              {/* A8.net メイン広告スペース */}
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="ukiyoe-card text-center p-4">
                  <div id="a8net-main-ad">
                    <a
                      href="https://px.a8.net/svt/ejp?a8mat=45FV1Z+55R9IQ+0K+11J5Z5"
                      rel="nofollow"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        width="250"
                        height="250"
                        alt="A8.net広告"
                        src="https://www25.a8.net/svt/bgt?aid=251002871312&wid=001&eno=01&mid=s00000000002006304000&mc=1"
                        style={{ border: 0 }}
                      />
                    </a>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      width="1"
                      height="1"
                      src="https://www19.a8.net/0.gif?a8mat=45FV1Z+55R9IQ+0K+11J5Z5"
                      alt=""
                      style={{ border: 0 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-[#2e4057] mb-6 tracking-wider ukiyoe-dashed-divider pt-8">
              AI分析の特徴
            </h3>
            <div className="ukiyoe-card-grid max-w-4xl mx-auto">
              <div className="ukiyoe-info-block">
                <div className="text-3xl mb-3">🤖</div>
                <h4 className="font-bold mb-2 text-[#2e4057]">複数AI統合</h4>
                <p className="text-sm text-[#2c2c2c]">
                  OpenAI, Claude, Geminiによる多角的分析
                </p>
              </div>
              <div className="ukiyoe-info-block">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="font-bold mb-2 text-[#2e4057]">
                  リアルタイム分析
                </h4>
                <p className="text-sm text-[#2c2c2c]">
                  最新の市場データを基にした即時分析
                </p>
              </div>
              <div className="ukiyoe-info-block">
                <div className="text-3xl mb-3">📈</div>
                <h4 className="font-bold mb-2 text-[#2e4057]">
                  包括的レポート
                </h4>
                <p className="text-sm text-[#2c2c2c]">
                  技術分析、ファンダメンタル分析、センチメント分析
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
