import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '3배·2배·1배 비교 — 레버리지가 클수록 최악도 빨리 회복된다',
  description:
    'TQQQ(3배)·QLD(2배)·나스닥100(1배)을 1971년 이후 668가지 진입 시점으로 비교. 3배가 중앙 6.3년으로 가장 빠르고, 최악 케이스도 13.9년으로 세 종목 중 가장 짧다.',
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}

function Callout({
  color = 'blue',
  children,
}: {
  color?: 'blue' | 'yellow' | 'red' | 'green'
  children: React.ReactNode
}) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    red:    'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200',
    green:  'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
  }
  return (
    <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>
      {children}
    </div>
  )
}

export default function LeverageComparePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
              적립식
            </span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
              백테스트
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">
            3배·2배·1배 비교 — 레버리지가 클수록 최악도 빨리 회복된다
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-19</p>
        </div>

        <P>
          레버리지가 높을수록 위험하다는 건 맞다. 하락 폭이 극단적이고, 회복에 시간이 걸린다.
          그런데 매달 꾸준히 사는 DCA 전략에서는 직관과 다른 일이 벌어진다.
        </P>

        <P>
          나스닥100 3배(TQQQ), 2배(QLD), 1배(QQQ) 세 종목을 1971년 이후 668가지 월별 진입 시점으로
          비교했다. 일 20만원 DCA, 목표 10억, 운용보수·스왑금리 포함.
        </P>

        <H2>핵심 결과</H2>

        <div className="overflow-x-auto mb-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">종목</th>
                <th className="text-right py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">달성률</th>
                <th className="text-right py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">중앙 소요</th>
                <th className="text-right py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">최선</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">최악</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr className="bg-blue-50 dark:bg-blue-500/5">
                <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white">TQQQ (3배)</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-gray-900 dark:text-white">90.0%</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-gray-900 dark:text-white">6.3년</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-gray-900 dark:text-white">2.0년</td>
                <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-white">13.9년</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">QLD (2배)</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">88.2%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">7.3년</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">2.7년</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">14.5년</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">나스닥100 (1배)</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">85.2%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">9.2년</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">4.5년</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">14.4년</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 mb-8">
          A전략(계속 적립) 기준 · 일 20만원 DCA · 목표 10억 · 운용보수·스왑금리 포함(with_costs) ·
          1971~2026년 668개 월별 진입 시점 · 최악은 달성한 케이스 중 가장 오래 걸린 경우
        </p>

        <Callout color="blue">
          <strong>3배가 중앙값(6.3년)과 최악(13.9년) 모두에서 세 종목 중 가장 빠르다.</strong>
          1배(나스닥100)가 더 &lsquo;안전&rsquo;하다는 직관과 반대다.
        </Callout>

        <H2>왜 레버리지가 클수록 최악도 더 빠른가</H2>

        <P>
          나스닥100이 고점 대비 80% 빠지면 TQQQ는 약 99% 빠진다. 공포스럽다.
          하지만 이 구간에서 매달 20만원씩 사고 있다면, 3배 레버리지의 주가가 1배보다
          훨씬 더 싸다. 이 &lsquo;싼 주수&rsquo;가 회복기에 폭발적으로 불어난다.
        </P>

        <P>
          1배 종목은 80% 하락 시 주가가 고점의 20% 수준이다. 같은 돈으로 고점 대비 5배치 주수를 살 수 있다.
          3배 종목은 99% 하락 시 주가가 고점의 1% 수준이다. 같은 돈으로 고점 대비 100배치 주수를 살 수 있다.
          회복이 시작되면 3배 레버리지로 사 모은 주수의 가치가 1배보다 훨씬 빠르게 10억에 도달한다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
          <div className="font-semibold text-gray-900 dark:text-white mb-2">닷컴버블 구간 (1997~2001 진입 시작)</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-1.5 pr-4 text-gray-500 dark:text-gray-400 font-medium">종목</th>
                  <th className="text-right py-1.5 pr-4 text-gray-500 dark:text-gray-400 font-medium">최악 진입 시점</th>
                  <th className="text-right py-1.5 text-gray-500 dark:text-gray-400 font-medium">소요 기간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="py-1.5 pr-4">TQQQ (3배)</td>
                  <td className="py-1.5 pr-4 text-right">1998-05</td>
                  <td className="py-1.5 text-right font-semibold">13.9년</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4">QLD (2배)</td>
                  <td className="py-1.5 pr-4 text-right">1997-08</td>
                  <td className="py-1.5 text-right font-semibold">14.5년</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4">나스닥100 (1배)</td>
                  <td className="py-1.5 pr-4 text-right">1996-05</td>
                  <td className="py-1.5 text-right font-semibold">14.4년</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            닷컴버블과 금융위기를 모두 관통하는 구간이 역사적 최악 케이스
          </p>
        </div>

        <H2>1배가 더 &lsquo;안전&rsquo;하지 않은 이유</H2>

        <P>
          많은 사람이 레버리지를 낮추면 더 안전하다고 생각한다. 하락 폭은 맞다 — 1배는 덜 빠진다.
          하지만 목표 달성까지의 시간 관점에서는 1배가 오히려 불리하다.
        </P>

        <P>
          달성률도 3배(90.0%) &gt; 2배(88.2%) &gt; 1배(85.2%) 순이다. 즉 1배로 적립하면
          10억에 도달하지 못하는 경우가 3배보다 더 많다. 가격이 덜 빠지지만 그만큼
          복리의 씨앗도 덜 쌓인다. 회복기 상승폭도 적다.
        </P>

        <Callout color="yellow">
          레버리지가 두렵다면 비중을 줄이는 것이 낫다. 예를 들어 TQQQ 50% + 현금 50%로 시작하면
          하락 폭은 절반이고, 현금을 하락장에 추가 투입할 수 있다. 레버리지를 아예 낮추는 것(1배 or 2배)은
          안전망이 되지 않는다.
        </Callout>

        <H2>비용 차이는 얼마나 되나</H2>

        <P>
          이 비교는 운용보수와 스왑금리를 포함한 with_costs 기준이다. 각 종목의 연간 비용은 아래와 같다.
        </P>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">종목</th>
                <th className="text-right py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">운용보수</th>
                <th className="text-right py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">스왑금리</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">총비용 (기준금리 0%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">TQQQ (3배)</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">0.88%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">2× (기준금리+0.5%)</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">0.88% + 1.0%</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">QLD (2배)</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">0.95%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">1× (기준금리+0.5%)</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">0.95% + 0.5%</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">나스닥100 (1배)</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">0.20%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">없음</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">0.20%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <P>
          기준금리가 높을수록 3배의 비용 부담이 커진다. 2022~2023년처럼 기준금리 5%대에서는
          TQQQ의 스왑 비용만 연 11%를 넘긴다.{' '}
          <Link href="/posts/tqqq-cost" className="text-blue-600 dark:text-blue-400 underline">
            TQQQ 비용의 전부
          </Link>에서 상세히 다뤘다.
        </P>

        <H2>A·B·C 전략별 차이</H2>

        <P>
          위 표는 A전략(한도 없이 계속 적립) 기준이다. 목돈 거치가 있는 C전략을 쓰면
          모든 종목이 빨라진다. 전략 비교는{' '}
          <Link href="/posts/strategy-abc" className="text-blue-600 dark:text-blue-400 underline">
            A·B·C 전략 비교
          </Link>를 참고.
        </P>

        <Callout color="blue">
          <strong>데이터 주의 사항</strong><br />
          1971~2026년 나스닥100 합성가격 기준. 나스닥100은 1971년 이전 데이터가 없어
          닷컴버블·금융위기가 역사적 최악 케이스다. 미래에 더 긴 하락이 올 수 있다.
          최악 케이스는 모두 닷컴버블(2000~2002) + 금융위기(2008~2009)를 연속으로 통과하는 구간이다.
        </Callout>

        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <Link
            href="/posts/accumulation-guide"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                적립식 방법론
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                종목 선택과 전략 전체 설명
              </div>
            </div>
          </Link>
          <Link
            href="/posts/tqqq-cost"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                TQQQ 비용의 전부
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                스왑금리가 레버리지 비용에 미치는 영향
              </div>
            </div>
          </Link>
          <Link
            href="/posts/panic-sell"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                적립 중 패닉매도하면 어떻게 되나
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                하락 중에 팔고 이탈하면 벌어지는 일
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
