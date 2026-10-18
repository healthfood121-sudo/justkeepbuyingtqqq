import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '10억 달성 후 인출을 6개월 미루면 수익률이 오른다',
  description:
    '25% 룰 인출 전략에서, 10억 달성 직후 바로 꺼내지 않고 6개월을 기다리면 연평균 수익률이 21.9% → 22.1%로 올라간다. 12개월은 동일하고, 24개월부터는 오히려 낮아진다.',
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

export default function WithdrawalDelayPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
              인출식
            </span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
              백테스트
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">
            10억 달성 후 인출을 6개월 미루면 수익률이 오른다
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-19</p>
        </div>

        <P>
          10억을 달성했다고 바로 꺼내야 할 필요는 없다. 부업이나 급여 소득이 있어서 당장 TQQQ를
          팔지 않아도 되는 상황이라면, 잠깐 기다리는 편이 유리하다.
        </P>

        <P>
          1971년 이후 538개 진입 시점을 기준으로, 인출 시작을 0개월~36개월 미뤘을 때
          연평균 수익률(IRR)과 최종 자산·평생 소비가 어떻게 달라지는지 계산했다.
        </P>

        <H2>결과</H2>

        <div className="overflow-x-auto mb-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">인출 시작</th>
                <th className="text-right py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">연평균 수익률</th>
                <th className="text-right py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">최종 자산</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">평생 소비</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">즉시</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">21.9%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">778억</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">368억</td>
              </tr>
              <tr className="bg-green-50 dark:bg-green-500/5">
                <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white">6개월 후</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-gray-900 dark:text-white">22.1%</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-gray-900 dark:text-white">815억</td>
                <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-white">382억</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">12개월 후</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">21.9%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">839억</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">398억</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">24개월 후</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">21.5%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">900억</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">435억</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">36개월 후</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">20.8%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">913억</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">436억</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 mb-8">
          25% 룰 전략 · 초기 10억 · 스왑금리·양도세·현금 이자 포함 · 1971~2026년 538개 진입 시점 중앙값 ·
          지연 기간 중 TQQQ는 그대로 보유 (매도 없음)
        </p>

        <Callout color="green">
          <strong>6개월이 스위트스팟이다.</strong> 연평균 수익률 22.1%로 즉시 인출(21.9%)보다 0.2%p 높고,
          최종 자산과 평생 소비도 모두 늘어난다.
        </Callout>

        <H2>왜 6개월 지연이 유리한가</H2>

        <P>
          인출을 시작하면 매달 TQQQ 일부를 팔아 생활비를 충당한다. 10억 달성 직후에는 자산이
          딱 목표 수준이다. 이 시점에서 0.5%씩 팔면 한 달에 500만 원어치 TQQQ를 파는 셈이다.
        </P>

        <P>
          달성 직후 6개월을 기다리면, TQQQ가 그 기간 성장한다. 달성 후 시장이 좋으면 6개월간
          20~30%가 붙기도 한다. 더 큰 자산에서 인출을 시작하면 같은 0.5%를 팔더라도 금액은 커지고,
          남은 포트의 절대 규모도 더 크다.
        </P>

        <P>
          12개월은 즉시와 IRR이 같다. 지연으로 인한 복리 이득과, 소득 없는 기간의 시간 페널티가
          상쇄된다. 24개월부터는 IRR이 낮아진다. 기다리는 시간이 길수록 IRR 계산상 &lsquo;소득 없는
          기간&rsquo;이 길어지기 때문이다.
        </P>

        <H2>최종 자산과 평생 소비의 역설</H2>

        <P>
          36개월을 기다리면 IRR은 가장 낮지만 최종 자산(913억)과 평생 소비(436억)는 가장 많다.
          이유는 간단하다. 3년을 쓰지 않고 놔뒀으니 복리가 더 붙었고, 나중에 더 큰 포트에서
          꺼내니 금액도 더 많다.
        </P>

        <P>
          하지만 그 3년을 다른 소득 없이 어떻게 버티느냐가 현실의 문제다. IRR이 20.8%라는 것은
          시간 대비 효율이 낮다는 뜻이다. 3년을 기다렸을 때의 총소득이 3년을 더 벌어야 하는
          기회비용을 초과하지 못할 수 있다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
          <div className="font-semibold text-gray-900 dark:text-white mb-2">어떤 경우에 지연이 현실적인가</div>
          <ul className="space-y-1 leading-relaxed">
            <li>· 급여나 프리랜서 수입이 있어서 당장 TQQQ를 팔지 않아도 생활 가능</li>
            <li>· 배우자 소득으로 가계가 유지되는 경우</li>
            <li>· 퇴직금·전세 만기 등 일시 소득으로 6~12개월 버틸 수 있는 경우</li>
          </ul>
        </div>

        <H2>지연 중 TQQQ는 어떻게 하나</H2>

        <P>
          지연 기간 동안 TQQQ를 그대로 보유한다. 25% 룰의 매도 신호가 들어오면 평소처럼
          현금으로 전환하고, 매수 신호에 재매수한다. 단지 &lsquo;생활비 인출&rsquo;만 하지 않는다.
          적립도 이미 완료(10억 달성)했으니 새로 사지도 않는다.
        </P>

        <Callout color="yellow">
          <strong>주의:</strong> 지연이 유리한 건 다른 소득이 있을 때만이다.
          지연하겠다고 대출을 내거나 생활 수준을 크게 낮추는 것은 이 계산에 포함되지 않은
          비용이다. 6개월의 수익률 이득(+0.2%p)은 생활비 부족을 감수할 만큼 크지 않다.
        </Callout>

        <H2>결론</H2>

        <P>
          다른 소득이 있어서 선택할 수 있다면, 6개월 기다리는 편이 가장 효율적이다.
          12개월은 중립적이다. 24개월 이상은 최종 자산은 커지지만 시간 대비 효율(IRR)은 낮아진다.
          다른 소득이 없다면 즉시 시작하는 것이 맞다 — 즉시 시작이 가장 나쁜 선택은 아니다.
        </P>

        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <Link
            href="/posts/withdrawal-guide"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                인출식 방법론
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                25% 룰 전략 전체 설명
              </div>
            </div>
          </Link>
          <Link
            href="/posts/withdrawal-early-buffer"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                처음 5년 버퍼가 중요한 이유
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                인출 초기 TQQQ 매도를 늦추는 다른 방법
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
