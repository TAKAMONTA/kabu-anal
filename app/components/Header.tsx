import Link from "next/link";

export default function Header() {
  return (
    <header className="ukiyoe-header ukiyoe-header-gradient relative">
      <div className="ukiyoe-pattern-overlay" />
      <div className="container mx-auto px-4 py-5 relative z-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-[#fff8dc] hover:text-[#d4af37] transition-colors flex items-center gap-2"
          >
            <span className="text-3xl">📊</span>
            <span className="tracking-wider">株アナ</span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="flex gap-8">
              <Link
                href="/analysis"
                className="text-[#fff8dc] hover:text-[#d4af37] transition-colors font-semibold"
              >
                分析
              </Link>
              <Link
                href="/login"
                className="text-[#fff8dc] hover:text-[#d4af37] transition-colors font-semibold"
              >
                ログイン
              </Link>
            </nav>

            {/* A8.net ヘッダー広告 - ログインボタンの右側に配置 */}
            <div className="hidden md:block">
              <div
                id="a8net-header-desktop-ad"
                className="bg-white/10 rounded-lg p-1 shadow-lg"
              >
                <a
                  href="https://px.a8.net/svt/ejp?a8mat=45FV1Z+56CP4I+1WP2+6DZBL"
                  rel="nofollow"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    width="120"
                    height="90"
                    alt="A8.net広告"
                    src="https://www26.a8.net/svt/bgt?aid=251002871313&wid=001&eno=01&mid=s00000008903001073000&mc=1"
                    style={{ border: 0 }}
                    className="rounded"
                  />
                </a>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  width="1"
                  height="1"
                  src="https://www14.a8.net/0.gif?a8mat=45FV1Z+56CP4I+1WP2+6DZBL"
                  alt=""
                  style={{ border: 0 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ukiyoe-stamp">
        <div className="ukiyoe-insho text-sm">株</div>
      </div>
    </header>
  );
}
