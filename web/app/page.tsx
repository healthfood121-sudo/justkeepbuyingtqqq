import Header from '@/components/Header'
import HomeSimulator from '@/components/HomeSimulator'
import WithdrawalSignal from '@/components/WithdrawalSignal'
import LivingCalc from '@/components/LivingCalc'
import Link from 'next/link'

const principles = [
  {
    num: '01',
    title: '종목은 시장지수를 한다',
    sub: 'VOO, QQQ, QLD, TQQQ',
    desc: '개별주 투자 금지, 가치주 금지, 성장주 금지, 개별주 레버리지 금지.',
  },
  {
    num: '02',
    title: '투자공부 대신 행복한 삶을 누리자',
    sub: '모두가 평등한 자원인 시간',
    desc: '모든 사람에게 똑같이 주어지는 자원은 시간뿐이다. 일반인의 투자공부는 지수공부로 충분하고, 그것만 해도 시간이 오래 걸린다. 나머지 시간은 그동안 하고 싶었지만, 시간이 없어서 못했던 일에 쓰자.',
  },
  {
    num: '03',
    title: '뉴스를 보지 말고, 방법론을 지킨다',
    sub: '시장지수를 믿자',
    desc: '백테스트 안에는 이미 모든 뉴스가 담겨 있다. 전쟁, 인플레이션, 디플레이션, 공황, 경제위기, 신용경색 등등 역사에 담겨있는 모든 불확실성이 시장지수에 담겨있다. — 시장지수는 그 모든 것을 겪고도 우상향했다. 뉴스에 흔들리지 말고 방법론을 지키자.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />

      {/* 히어로 */}
      <section className="w-full bg-gradient-to-r from-gray-900 via-blue-950 to-gray-900 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-wide text-white">
          JUST KEEP BUYING <span className="text-blue-400">TQQQ</span>
        </h1>
      </section>

      {/* 원칙 + 방법론 */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* 왼쪽: 원칙 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">원칙</h2>
            <div className="flex flex-col gap-3">
              {principles.map(p => (
                <div key={p.num} className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400 dark:text-gray-600">{p.num}</span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.title}</h3>
                    <span className="text-xs text-blue-500 dark:text-blue-400">{p.sub}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-6">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 방법론 */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">방법론</h2>

            {/* 적립식 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 rounded-2xl p-5">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xs font-bold text-blue-500 dark:text-blue-400 tracking-wide">JUST KEEP BUYING</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">적립식</span>
              </div>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-3">
                매일 같은 금액을 자동 매수 — 시장이 어떻든 멈추지 않는다
              </p>
              <div className="bg-white/70 dark:bg-gray-900/60 border border-blue-200 dark:border-blue-700/30 rounded-xl p-3 mb-2">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">TQQQ로 10억까지 걸린 기간</p>
                {[
                  { who: '매일 20만원만', med: '6년 4개월', worst: '13년 11개월' },
                  { who: '+ 목돈 2.5억 (5년 분할)', med: '4년 3개월', worst: '9년' },
                ].map(r => (
                  <div key={r.who} className="flex justify-between items-baseline gap-2 py-1.5 border-t first:border-t-0 border-gray-100 dark:border-gray-800 text-xs">
                    <span className="text-gray-600 dark:text-gray-300">{r.who}</span>
                    <span className="whitespace-nowrap text-gray-500 dark:text-gray-400">
                      보통 <strong className="text-sm text-blue-700 dark:text-blue-300">{r.med}</strong> · 최장 {r.worst}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">1971년 이후 모든 시작 시점 · 비용 반영</p>
              <Link
                href="/posts/accumulation-guide"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                방법론 상세 보기 →
              </Link>
            </div>

            {/* 인출식 */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 rounded-2xl p-5">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xs font-bold text-purple-500 dark:text-purple-400 tracking-wide">JUST KEEP SELLING</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">인출식</span>
              </div>
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">권장: T25 — 1년 고점 −25%면 매도</span>
                <Link href="/posts/withdrawal-guide#recommended" title="1971년 이후 모든 시작 시점의 생활비 포함 연 수익률 중간값 — 근거 보기"
                  className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap underline decoration-dotted underline-offset-2">
                  연 22.4%
                </Link>
              </div>
              <WithdrawalSignal />
              <LivingCalc />
              <Link
                href="/posts/withdrawal-guide"
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                방법론 상세 보기 →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 시뮬레이터 */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">백테스트 결과</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">내 투자 설정 기준 · 1971년~현재 전체 진입 시점</p>
        </div>
        <HomeSimulator />
      </div>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400 dark:text-gray-600 text-xs space-y-2">
          <p className="font-semibold text-gray-500 dark:text-gray-500">justkeepbuyingtqqq</p>
          <p>이 사이트의 모든 분석은 과거 데이터 기반이며 미래 수익을 보장하지 않습니다.</p>
          <p>TQQQ/QLD 합성 가격은 NDX 일별 수익률에 레버리지를 곱한 이론치입니다. 변동성 끌림은 일별 복리 계산에 자동 반영됩니다. 운용비용(TQQQ 0.88%/년)과 스왑금리비용(레버리지 조달 비용, 기준금리 × 2/년)을 기본으로 반영하며, 시뮬레이터·데이터 페이지의 [운용보수만] 버튼으로 스왑금리를 뺀 이론치도 볼 수 있습니다. 인출식 결과는 양도세 22%와 현금(외화RP) 이자까지 반영합니다. 추적오차는 미반영입니다.</p>
          <p className="mt-4">NDX 데이터: 1971-02-05~2026-09-25 | S&P500 데이터: 1927-12-30~2026-09-03</p>
        </div>
      </footer>
    </div>
  )
}
