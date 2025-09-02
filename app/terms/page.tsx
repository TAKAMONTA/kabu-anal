'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">利用規約</h1>
        
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">第1条（適用）</h2>
            <p>
              本規約は、株価分析AIカルテ（以下「本サービス」）の利用条件を定めるものです。
              登録ユーザーの皆さま（以下「ユーザー」）には、本規約に従って本サービスをご利用いただきます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">第2条（利用登録）</h2>
            <p>
              本サービスの利用を希望する方は、本規約に同意の上、当社の定める方法によって利用登録を申請し、
              当社がこれを承認することによって、利用登録が完了するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">第3条（投資判断について）</h2>
            <p className="font-semibold text-red-600 mb-2">【重要】</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>本サービスが提供する情報は、投資判断の参考情報であり、投資勧誘を目的としたものではありません。</li>
              <li>投資に関する最終決定は、ユーザー自身の判断と責任において行ってください。</li>
              <li>本サービスの情報に基づいて行われた投資により生じた損失について、当社は一切の責任を負いません。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">第4条（禁止事項）</h2>
            <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>当社、他のユーザー、その他第三者の権利を侵害する行為</li>
              <li>本サービスのサーバーまたはネットワークに過度な負荷をかける行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>不正アクセス、またはこれを試みる行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">第5条（本サービスの提供の停止等）</h2>
            <p>
              当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく
              本サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
              <li>その他、当社が本サービスの提供が困難と判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">第6条（免責事項）</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</li>
              <li>当社は、本サービスの提供の中断、停止、終了、利用不能または変更によってユーザーに生じた損害について、一切の責任を負いません。</li>
              <li>本サービスが提供する株価情報、分析結果の正確性、完全性、有用性等について、当社は保証しません。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">第7条（個人情報の取扱い）</h2>
            <p>
              当社は、本サービスの利用によって取得する個人情報については、
              当社「プライバシーポリシー」に従い適切に取り扱うものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">第8条（規約の変更）</h2>
            <p>
              当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
              変更後の規約は、当社ウェブサイトに掲示された時点から効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">第9条（準拠法・裁判管轄）</h2>
            <p>
              本規約の解釈にあたっては、日本法を準拠法とします。
              本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>

          <div className="mt-12 pt-6 border-t border-gray-300">
            <p className="text-sm text-gray-600">制定日：2025年1月1日</p>
            <p className="text-sm text-gray-600">最終更新日：2025年1月1日</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/login" 
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            ログインページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}