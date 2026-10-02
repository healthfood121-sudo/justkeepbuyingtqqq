import Header from '@/components/Header'
import HomeSimulator from '@/components/HomeSimulator'

const principles = [
  {
    num: '01',
    title: '종목은 시장지수를 한다',
    sub: 'VOO, QQQ, QLD, TQQQ',
    desc: '개별주 투자 금지, 가치주 금지, 성장주 금지, 개별주 레버리지 금지.',
  },
  {
    num: '02',
    title: '투자공부 대신 삶을 살아라',
    sub: '모두가 평등한 자원인 시간',
    desc: '모든 사람에게 똑같이 주어지는 자원은 시간뿐이다. 일반인의 투자공부는 지수공부로 충분하고, 그것만 해도 시간이 오래 걸린다. 나머지 시간은 그동안 하고 싶었지만, 시간이 없어서 못했던 일에 써라.',
  },
  {
    num: '03',
    title: '뉴스를 보지 말고, 방법론을 지킨다',
    sub: '시장지수를 믿어라',
    desc: '백테스트 안에는 이미 모든 뉴스가 담겨 있다. 전쟁, 인플레이션, 공황, 위기 — 시장지수는 그 모든 것을 겪고도 우상향했다. 뉴스에 흔들리지 말고 방법론을 지켜라.',
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

      {/* 원칙 */}
      <section className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-5">원칙</h2>
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
      </section>

      {/* 시뮬레이터 */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">백테스트 결과</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">내 투자 설정 기준 · 1971년~현재 전체 코호트</p>
        </div>
        <HomeSimulator />
      </div>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400 dark:text-gray-600 text-xs space-y-2">
          <p className="font-semibold text-gray-500 dark:text-gray-500">justkeepbuyingtqqq</p>
          <p>이 사이트의 모든 분석은 과거 데이터 기반이며 미래 수익을 보장하지 않습니다.</p>
          <p>TQQQ/QLD 합성 가격은 NDX 일별 수익률에 레버리지를 곱한 이론치입니다. 변동성 끌림은 일별 복리 계산에 자동 반영되며, 운용비용(TQQQ 0.88%/년)·스왑금리비용·추적오차는 미반영입니다.</p>
          <p className="mt-4">NDX 데이터: 1971-02-05~2026-09-25 | S&P500 데이터: 1927-12-30~2026-09-03</p>
        </div>
      </footer>
    </div>
  )
}
