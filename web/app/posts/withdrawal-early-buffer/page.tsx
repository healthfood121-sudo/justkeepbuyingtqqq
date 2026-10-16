import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '처음 5년 버퍼가 중요한 이유 — 생활비가 아니라 TQQQ를 지키기 위해',
  description:
    '25% 룰 시작 후 첫 5년에만 24개월치 생활비를 현금으로 두면 연평균 수익률이 올라간다. 단순히 생활비를 지키기 위한 버퍼가 아니라, 초반 복리 구간에서 TQQQ를 팔지 않기 위한 버퍼다.',
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

export default function WithdrawalEarlyBufferPage() {
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
            처음 5년 버퍼가 중요한 이유 — 생활비가 아니라 TQQQ를 지키기 위해
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-15</p>
        </div>

        <P>
          현금 버퍼를 두는 이유를 대부분 이렇게 설명한다. "하락장에서 TQQQ를 팔지 않아도 현금에서
          생활비를 쓸 수 있다." 생활비 끊김을 막기 위한 완충재다.
        </P>

        <P>
          그런데 25% 룰은 현금 버퍼 없이도 생활비가 끊기지 않는다. 매달 TQQQ를 조금씩 팔아
          생활비를 충당하기 때문이다. 버퍼가 없어도 생활비는 나온다. 그런데도 첫 5년에만 버퍼를 두면
          수익률이 올라간다. 이유가 다른 데 있다.
        </P>

        <H2>버퍼가 없을 때 무슨 일이 일어나나</H2>

        <P>
          25% 룰 기본 전략(B0)은 매달 자산의 0.3~0.7%를 TQQQ 소량 매도로 충당한다. 생활비가 월 500만 원이면,
          자산 10억일 때 0.5% = 500만 원어치 TQQQ를 판다. 하락장이든 상승장이든 이 매도는 매달 일어난다.
        </P>

        <P>
          문제는 하락장 초반이다. 인출을 시작하고 1~2년 안에 큰 하락이 오면, 자산이 작은 상태에서 비례 매도가 이어진다.
          이 시기는 장기 복리의 씨앗이 자라는 구간이다. 자산이 10억일 때 팔리는 TQQQ 조각 하나가
          10년 후에는 수십 배가 됐을 몫이다.
        </P>

        <H2>첫 5년만 버퍼를 두면</H2>

        <P>
          시작할 때 24개월치 생활비를 현금으로 따로 두고, 첫 5년 동안은 생활비를 이 현금에서 꺼낸다.
          TQQQ를 팔지 않는다. 5년 후에는 버퍼 없이 기본 전략으로 돌아간다.
        </P>

        <div className="overflow-x-auto mb-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">방식</th>
                <th className="text-right py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">연평균 수익률</th>
                <th className="text-right py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">최종 자산</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">평생 소비</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">버퍼 없음 (B0)</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">21.1%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">693억</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">335억</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">버퍼 12개월, 첫 5년</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">21.5%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">735억</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">349억</td>
              </tr>
              <tr className="bg-green-50 dark:bg-green-500/5">
                <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white">버퍼 24개월, 첫 5년</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-gray-900 dark:text-white">21.9%</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-gray-900 dark:text-white">778억</td>
                <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-white">368억</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">버퍼 12개월, 영구 유지</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">20.4%</td>
                <td className="py-2.5 pr-4 text-right text-gray-700 dark:text-gray-300">527억</td>
                <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">248억</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 mb-8">
          25% 룰 전략 · 초기 10억 · 스왑금리·양도세·현금 이자 포함 · 1971~2026년 538개 진입 시점 중앙값 ·
          버퍼는 인출 시작 시점의 자산 × 인출률로 계산한 월 생활비 기준
        </p>

        <P>
          버퍼 24개월을 첫 5년에만 유지하면 연평균 수익률이 21.9%로 버퍼 없는 경우(21.1%)보다 0.8%p 높다.
          버퍼를 영구 유지하면 오히려 낮아진다(20.4%).
        </P>

        <H2>버퍼를 영구 유지하면 왜 오히려 나빠지나</H2>

        <P>
          버퍼 12개월을 영구 유지한다는 것은, 항상 포트폴리오의 일부를 현금으로 묶어 둔다는 뜻이다.
          현금은 TQQQ 복리를 못 받는다. 초반에는 TQQQ 매도를 막아 이득이지만, 자산이 커진 후에도
          계속 현금을 유지하면 복리 손실이 누적된다. 5년만 유지하고 기본 전략으로 돌아가면
          이 손실을 막을 수 있다.
        </P>

        <Callout color="yellow">
          <strong>처음 5년이 가장 중요하다.</strong>
          인출을 막 시작한 시점에 하락이 오면 작은 자산에서 TQQQ를 팔아야 한다. 이 조각 하나가
          10~20년 후에 수십 배의 복리 차이를 만든다. 버퍼는 이 시기를 현금으로 버티기 위한 것이다.
          5년이 지나면 자산이 충분히 자라 하락장 매도의 비중이 상대적으로 작아진다.
        </Callout>

        <H2>실제로 어떻게 준비하나</H2>

        <P>
          10억을 달성하고 인출을 시작할 때, 인출률 0.5%(월 500만 원 기준) × 24개월 = 1억 2천만 원을
          현금(외화RP 또는 CMA)으로 따로 빼둔다. 이 현금에서 생활비를 쓰면서, 처음 5년은 TQQQ를 팔지 않는다.
        </P>

        <P>
          현금이 바닥나면 25% 룰 기본 전략으로 전환한다. 매달 TQQQ 소량 매도로 생활비를 충당하는 방식으로 돌아온다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
          <div className="font-semibold text-gray-900 dark:text-white mb-2">준비 금액 계산</div>
          월 생활비 목표 × 24 = 버퍼 금액<br />
          <span className="block mt-1 text-gray-500 dark:text-gray-400">
            예: 월 500만원 → 1억 2천만원 / 월 300만원 → 7,200만원 / 월 700만원 → 1억 6,800만원
          </span>
        </div>

        <P>
          인출률에 따른 월 생활비 목표가 없다면, 10억 × 0.5% = 월 500만 원을 기준값으로 쓸 수 있다.
          이 기준으로 24개월치는 1억 2천만 원이다. 10억에서 이 금액을 현금으로 빼면, 남은 8억 8천만 원이
          TQQQ 투자 원금이 된다.
        </P>

        <Callout color="blue">
          <strong>주의:</strong> 버퍼를 빼면 TQQQ 투자금이 줄어든다. 예를 들어 10억에서 1.2억을 버퍼로 빼면
          8.8억만 TQQQ에 들어간다. 버퍼 효과는 초반 TQQQ 보호에서 오는데, 시작 자산이 줄어 복리 기반이
          작아지는 비용도 있다. 백테스트 결과는 이 두 가지를 모두 포함한 순수치다.
        </Callout>

        <H2>이전 포스트와의 차이</H2>

        <P>
          <Link href="/posts/living-stability" className="text-blue-600 dark:text-blue-400 underline">
            생활비가 반토막 나는 걸 막을 수 있나
          </Link>에서는 현금 버퍼 20~30%를 영구 유지하는 방법을 다뤘다.
          그 방법은 자산 최저점을 높이는 대신 연 수익률이 약 2%p 낮아진다.
        </P>

        <P>
          이 포스트의 방법(첫 5년 24개월 버퍼)은 다르다. 자산 최저점 보호보다 연평균 수익률 개선이 목적이다.
          비용이 거의 없다 — 버퍼를 영구 유지하는 비용 없이, 처음 5년만 초반 복리를 지킨다.
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
            href="/posts/living-stability"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                생활비가 반토막 나는 걸 막을 수 있나
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                영구 현금 버퍼 방법 — 이 포스트와 다른 목적
              </div>
            </div>
          </Link>
          <Link
            href="/posts/withdrawal-cap"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                자산이 커져도 인출률을 올리지 말아야 하는 이유
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                인출 상한 백테스트 — 같은 맥락의 후속 주제
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
