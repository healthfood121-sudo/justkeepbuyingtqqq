import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: '적립 중 패닉매도하면 어떻게 되나',
  description:
    '1971년 이후 669개 진입 시점 시뮬레이션. 하락 중에 팔고 나오면 10억 목표를 못 이룰 확률이 얼마나 되는지 데이터로 확인했다.',
}

const PanicSellChart = dynamic(() => import('./PanicSellChart'), { ssr: false })

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

export default function PanicSellPage() {
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
            적립 중 패닉매도하면 어떻게 되나
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-19</p>
        </div>

        <P>
          나스닥100이 고점 대비 30% 이상 빠지면 팔고 싶어진다. 3배 레버리지 TQQQ는 그 시점에
          이미 60~80% 이상 내려가 있다. 매달 돈을 넣어온 계좌 잔액이 투자 원금보다 훨씬 작아져 있다.
          이때 팔면 어떻게 될까.
        </P>

        <P>
          1971년 이후 669개 월별 진입 시점으로 시뮬레이션했다. 일 20만원 DCA, 목표 10억.
          TQQQ 합성가격(스왑금리·운용보수 포함).
        </P>

        <H2>핵심 결과</H2>

        <div className="overflow-x-auto mb-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">전략</th>
                <th className="text-right py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">발생률</th>
                <th className="text-right py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">10억 달성률</th>
                <th className="text-right py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">중앙 소요</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">중앙 최종 자산</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr className="bg-blue-50 dark:bg-blue-500/5">
                <td className="py-2.5 pr-3 font-semibold text-gray-900 dark:text-white">계속 매수</td>
                <td className="py-2.5 pr-3 text-right text-gray-400 dark:text-gray-500">—</td>
                <td className="py-2.5 pr-3 text-right font-semibold text-gray-900 dark:text-white">89.5%</td>
                <td className="py-2.5 pr-3 text-right font-semibold text-gray-900 dark:text-white">6.5년</td>
                <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-white">34억</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 text-gray-700 dark:text-gray-300">−30% 매도 후 영구 이탈</td>
                <td className="py-2.5 pr-3 text-right text-gray-700 dark:text-gray-300">55.6%</td>
                <td className="py-2.5 pr-3 text-right text-red-600 dark:text-red-400 font-semibold">35.9%</td>
                <td className="py-2.5 pr-3 text-right text-gray-500 dark:text-gray-400">—</td>
                <td className="py-2.5 text-right text-red-600 dark:text-red-400 font-semibold">1.5억</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 text-gray-700 dark:text-gray-300">−50% 매도 후 영구 이탈</td>
                <td className="py-2.5 pr-3 text-right text-gray-700 dark:text-gray-300">22.3%</td>
                <td className="py-2.5 pr-3 text-right text-orange-600 dark:text-orange-400 font-semibold">67.3%</td>
                <td className="py-2.5 pr-3 text-right text-gray-500 dark:text-gray-400">—</td>
                <td className="py-2.5 text-right text-orange-600 dark:text-orange-400 font-semibold">11.5억</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 text-gray-700 dark:text-gray-300">−30% 매도 후 12개월 재개</td>
                <td className="py-2.5 pr-3 text-right text-gray-700 dark:text-gray-300">55.6%</td>
                <td className="py-2.5 pr-3 text-right text-gray-700 dark:text-gray-300">85.1%</td>
                <td className="py-2.5 pr-3 text-right text-gray-700 dark:text-gray-300">9.0년</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">15.5억</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 text-gray-700 dark:text-gray-300">−30% 매도 후 24개월 재개</td>
                <td className="py-2.5 pr-3 text-right text-gray-700 dark:text-gray-300">55.6%</td>
                <td className="py-2.5 pr-3 text-right text-gray-700 dark:text-gray-300">83.6%</td>
                <td className="py-2.5 pr-3 text-right text-gray-700 dark:text-gray-300">8.7년</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">17.9억</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 mb-8">
          일 20만원 DCA · 목표 10억 · TQQQ 합성가격(스왑금리+운용보수 포함) · 1971~2026년 669개 진입 시점 ·
          발생률은 해당 패닉 트리거를 경험한 진입 시점 비율 · 최종 자산은 최대 35년 시뮬레이션 종료 시점 중앙값
        </p>

        <H2>차트: 진입 시점별 포트폴리오 추이</H2>

        <P>
          아래 차트는 닷컴버블(2000-01 진입)과 금융위기(2007-10 진입) 시나리오에서
          전략별 포트폴리오 가치 추이다. Y축은 로그 스케일이다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-8">
          <PanicSellChart />
        </div>

        <H2>닷컴버블 (2000년 1월 진입)</H2>

        <P>
          2000년 1월에 적립을 시작했다면, 3개월 뒤인 2000년 4월 14일에 이미 나스닥100은
          고점 대비 30% 이상 하락해 있었다. 이 시점의 TQQQ 포트폴리오는 0.06억이었다.
          이제까지 투입한 원금 0.15억 대비 이미 60% 이상 손실 상태였다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
          <div className="font-semibold text-gray-900 dark:text-white mb-2">2000-01 진입 시나리오 비교</div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-blue-500 dark:text-blue-400">계속 매수</span>
              <span>2012년 9월 달성 <span className="text-gray-400">(12.7년)</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500 dark:text-red-400">−30% 매도 후 이탈</span>
              <span className="text-red-500 dark:text-red-400">2026년까지 미달성 <span className="text-gray-400">(최종 0.06억)</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-500 dark:text-green-400">−30% 매도 후 12개월 재개</span>
              <span>2026년 달성 <span className="text-gray-400">(26.4년)</span></span>
            </div>
          </div>
        </div>

        <P>
          팔고 나온 사람은 2026년까지도 달성하지 못했다. 보유 현금은 600만원으로 고정된 채 26년이 지났다.
          팔지 않은 사람은 닷컴버블과 금융위기를 모두 통과하면서 12.7년 만에 목표를 달성했다.
          2026년 시점 포트폴리오는 1,030억이다.
        </P>

        <P>
          12개월 후 다시 시작한 사람은 결국 목표를 달성했다. 하지만 26.4년이 걸렸다.
          계속 매수한 사람과 비교하면 13.7년이 늦었다.
        </P>

        <H2>왜 팔았을 때 이렇게 나빠지나</H2>

        <P>
          팔고 나올 때 포트폴리오는 이미 아주 작다. 닷컴버블 예시에서 0.06억이었다.
          그 600만원을 지키기 위해 팔았지만, 그 600만원을 아무리 오래 두어도 10억이 되지 않는다.
        </P>

        <P>
          반면 팔지 않은 사람은 2000년~2002년 내내 TQQQ가 헐값일 때 매달 20만원씩 사고 있었다.
          2002년 10월 나스닥100 바닥에서 3배 레버리지 TQQQ는 극단적으로 저렴했다. 그때 쌓인 주수가
          2003년~2007년 강세장에서 수십 배로 불어났다. 그 과정을 팔고 나온 사람은 전혀 경험하지 못했다.
        </P>

        <Callout color="yellow">
          하락 중에 파는 행위 자체가 손실을 확정하는 게 아니다. 더 정확히는
          <strong> 바닥 근처에서 쌓이는 주수를 포기하는 것</strong>이다.
          그 주수가 회복 때 전체 수익의 대부분을 만든다.
        </Callout>

        <H2>패닉 트리거가 발생하는 빈도</H2>

        <P>
          1971년 이후 669개 진입 시점 중 55.6%는 어느 시점에서 나스닥100이 진입 후 최고점 대비
          30% 이상 하락하는 구간을 경험했다. 절반이 넘는 투자자가 이 시나리오에 실제로 직면한다는 뜻이다.
        </P>

        <P>
          50% 이상 하락 트리거는 22.3%에서 발생했다. 5명 중 1명은 진입 이후 나스닥100이 반 토막 나는 경험을 한다.
        </P>

        <Callout color="red">
          <strong>1971년 이후 진입 시점의 55.6%가 −30% 하락을 경험했다.</strong>
          이 시점에 팔고 나오면 10억을 달성할 확률은 35.9%다. 계속 매수했을 때(89.5%)와 비교하면
          달성 확률이 절반 이하로 떨어진다.
        </Callout>

        <H2>팔고 다시 시작하면 어느 정도 회복되나</H2>

        <P>
          −30% 하락 시 매도하고 12개월 또는 24개월 후 다시 시작하면 달성률은 85.1~83.6%로
          어느 정도 회복된다. 하지만 달성 소요 기간이 9.0년으로 늘어난다. 계속 매수(6.5년)보다
          2.5년 더 걸린다. 최종 자산 중앙값도 15.5~17.9억으로 계속 매수(34억)의 절반 수준이다.
        </P>

        <P>
          이 차이는 재진입 시점의 현금이 아주 적기 때문이다. 팔 때 0.06억을 들고 나와서
          12개월 동안 현금으로 약 0.5억을 더 모은 뒤 총 0.56억으로 재시작하는 셈이다.
          이미 계속 매수한 사람은 같은 기간 동안 2~3억어치 TQQQ를 쌓아두고 있었다.
        </P>

        <Callout color="blue">
          <strong>데이터 주의 사항</strong><br />
          이 결과는 TQQQ를 매도 신호 없이 단순 DCA로 보유하는 전략을 기준으로 한다.
          인출 전략(25% 룰)은 별도 매도 신호가 있어서 이와 다르다. 이 포스트는 &ldquo;적립 중에 패닉매도&rdquo;하는 상황을 다룬다.
          진입 시점부터의 나스닥100 최고점 대비 하락률로 패닉 트리거를 정의했다.
        </Callout>

        <H2>결론</H2>

        <P>
          적립 중에 팔면 손실이 확정되는 게 아니라 회복 기회가 사라진다. 하락 구간이 실제로 위험한 이유는
          그 기간에도 계속 사야 하기 때문이다. 팔고 나온 순간 그 기회는 끝난다.
        </P>

        <P>
          버티기 어려운 건 알고 있다. 닷컴버블에서 −30%가 찍혔을 때 이후 −80%까지 더 빠졌다.
          −30%에서 팔지 않은 사람도 그 이후 2년을 더 버텨야 했다. 미리 알아두는 것은 그래서 중요하다.
          이런 하락이 올 수 있고, 버티는 편이 낫다는 걸 데이터로 확인해 두는 것.
        </P>

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
                A·B·C 전략 전체 설명
              </div>
            </div>
          </Link>
          <Link
            href="/posts/trust-the-method"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                방법을 믿어야 하는 이유
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                닷컴버블 진입자가 결국 이기는 이유
              </div>
            </div>
          </Link>
          <Link
            href="/posts/market-history"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                시장 역사
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                과거 대형 하락의 패턴과 회복 과정
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
