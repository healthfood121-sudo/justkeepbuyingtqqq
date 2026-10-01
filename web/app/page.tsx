import Link from 'next/link'
import MethodologySection from '@/components/MethodologySection'

const principles = [
  {
    num: '01',
    title: '종목은 시장지수를 한다',
    sub: 'VOO, QQQ, QLD, TQQQ',
    desc: '개별주 투자 금지, 가치주 금지, 성장주 금지.',
  },
  {
    num: '02',
    title: '투자공부 대신 삶을 살아라',
    sub: '모두가 평등한 자원인 시간',
    desc: '개별주 공부할 시간에 모두가 평등한 자원인 시간을 투자에 집중하지 않고 행복한 삶을 살기 위해 배분하라. 투자공부를 할 바에야, 그 시간에 평상시 배우고 싶거나 하고 싶었던 것을 실행하자. 가족과 산책을 해도 좋고, 달리기를 해도 좋고, 악기를 배워도 좋고, 여행을 다녀도 좋다.',
  },
  {
    num: '03',
    title: '뉴스를 보지 말고, 방법론을 지킨다',
    sub: '시장지수를 믿어라',
    desc: '모든 백테스트 안에 이미 뉴스가 다 있기 때문에. 모든 전쟁, 모든 인플레이션, 디플레이션, 공황, 위기 등등 다 겪은 게 시장지수이다. 시장지수를 믿어라.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight">
            justkeepbuying<span className="text-blue-400">tqqq</span>
          </span>
          <nav className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/simulator" className="hover:text-white transition-colors">시뮬레이터</Link>
            <Link href="/posts" className="hover:text-white transition-colors">글</Link>
          </nav>
        </div>
      </header>

      {/* 히어로 */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <p className="text-sm text-gray-500 tracking-widest uppercase mb-6">1971–2026 역사적 데이터 기반</p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
          JUST KEEP BUYING<br />
          <span className="text-blue-400">TQQQ</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
          복잡하게 생각하지 마라.
          그냥 꾸준히 사면 어떻게 되는지, 55년 데이터로 직접 확인했다.
        </p>
      </section>

      {/* 원칙 */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-lg font-bold text-center text-gray-300 mb-6 tracking-widest uppercase">원칙</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {principles.map(p => (
            <div key={p.num} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
              <span className="font-mono text-xs text-gray-600 block mb-3">{p.num}</span>
              <h3 className="text-base font-bold text-white mb-1">{p.title}</h3>
              <p className="text-xs text-blue-400 mb-3">{p.sub}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 방법론 */}
      <div className="border-t border-gray-800">
        <MethodologySection />
      </div>

      {/* 푸터 */}
      <footer className="border-t border-gray-800 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-600 text-xs space-y-2">
          <p className="font-semibold text-gray-500">justkeepbuyingtqqq</p>
          <p>이 사이트의 모든 분석은 과거 데이터 기반이며 미래 수익을 보장하지 않습니다.</p>
          <p>TQQQ/QLD 합성 가격은 NDX 일별 수익률에 레버리지를 곱한 이론치입니다. 변동성 끌림은 일별 복리 계산에 자동 반영되며, 운용비용(TQQQ 0.88%/년)·추적오차는 미반영입니다.</p>
          <p className="mt-4">NDX 데이터: 1971-02-05~2026-09-25 | S&P500 데이터: 1927-12-30~2026-09-03</p>
        </div>
      </footer>
    </div>
  )
}
