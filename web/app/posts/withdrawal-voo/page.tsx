import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'S&P500 자동분산, 넣었다가 뺀 이유',
  description: '총자산이 커지면 S&P500으로 자동 분산하는 기능을 시뮬레이터에 추가했다가 제거했다. 왜 25% 룰 전략에서 이 아이디어가 역효과를 내는지 분석한다.',
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-8 mb-3 text-gray-700 dark:text-gray-200">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}

function Callout({ color = 'blue', children }: { color?: 'blue' | 'yellow' | 'red' | 'green'; children: React.ReactNode }) {
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

export default function WithdrawalVooPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">인출식</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">아이디어 검토</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">S&P500 자동분산, 넣었다가 뺀 이유</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-13</p>
        </div>

        <P>
          총자산이 20억을 넘으면 S&P500으로 자동 분산하는 기능을 인출 시뮬레이터에 추가했다가 제거했다.
          아이디어 자체는 그럴듯해 보였는데, 막상 25% 룰 전략에 얹으면 오히려 손해였다.
          왜 그런지 정리해둔다.
        </P>

        <H2>아이디어의 출발점</H2>

        <P>
          다른 백테스터에서 본 기능이었다. 총자산이 일정 규모를 넘으면
          생활비 3년치에 해당하는 금액을 S&P500에 따로 떼어 놓는다.
          "TQQQ는 변동성이 크니까, 자산이 커지면 일부는 안전하게 분산하자"는 논리다.
        </P>

        <P>
          구체적으로는 이렇다. 총자산이 20억 이상이면, 그 달 생활비의 36배(3년치)를
          목표 금액으로 잡고 TQQQ 일부를 팔아 S&P500을 산다.
          20억에서 인출률 0.7%면 한 달 생활비가 약 140만 원이고,
          3년치는 약 5천만 원이다. 총자산의 약 2.5% 수준이다.
        </P>

        <Callout color="blue">
          구현: 총자산 × 0.7% × 36개월 = 총자산의 약 25% → S&P500 목표<br />
          (인출률은 총자산 구간별로 0.3%·0.5%·0.7% 중 해당 구간 적용)
        </Callout>

        <H2>왜 역효과가 나는가</H2>

        <H3>1. TQQQ를 팔 때마다 세금이 나간다</H3>

        <P>
          S&P500으로 전환하려면 TQQQ를 매도해야 한다.
          우리 전략에서 모든 TQQQ 매도는 양도세 22%(연 250만 원 공제)를 낸다.
          처음 목표 금액을 채울 때도, 이후 목표 비율을 유지하려고 조금씩 팔 때도
          매번 세금이 발생한다. 분산의 비용이 생각보다 크다.
        </P>

        <H3>2. 레버리지가 희석된다</H3>

        <P>
          25% 룰의 수익은 상승장에서 TQQQ 100%를 들고 있는 데서 나온다.
          TQQQ 일부를 S&P500으로 바꾸면, 상승장에서 포트폴리오 수익률이 낮아진다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
          나스닥100 +10% 상승 시<br />
          <span className="block mt-2">
            TQQQ 100%: 포트폴리오 <strong className="text-gray-900 dark:text-white">+약 30%</strong>
          </span>
          <span className="block mt-1">
            TQQQ 75% + S&P500 25%: 포트폴리오 <strong className="text-gray-900 dark:text-white">+약 22~23%</strong>
          </span>
        </div>

        <P>
          하락장 보호 효과는 크지 않은 반면, 상승장 수익 손실은 크다.
          장기 복리에서 이 차이는 누적될수록 벌어진다.
        </P>

        <H3>3. 200일 지수이동평균(EMA200) 신호가 이미 하락장을 피해준다</H3>

        <P>
          25% 룰은 나스닥100이 EMA200 아래로 내려가는 신호가 나오면 TQQQ 전량을 현금으로 옮긴다.
          S&P500 분산이 목표로 하는 "하락장 손실 완화"를
          EMA200 신호가 이미 담당하고 있다.
        </P>

        <Callout color="yellow">
          보호 기능이 중복된다. 안전벨트를 하고 있는데 에어백을 켜는 격이다.
          상승장 수익만 깎이고, 하락장 추가 보호는 거의 없다.
        </Callout>

        <H2>구조적 문제: 이 아이디어는 다른 전략을 위한 것이다</H2>

        <P>
          원래 이 S&P500 자동투입 아이디어가 나온 백테스터는 구조가 달랐다.
          그쪽 전략은 생활비 버퍼(현금 적립분)를 별도로 관리한다.
          버퍼가 3년치를 초과하면 그 잉여분을 S&P500에 넣는 것이다.
        </P>

        <P>
          즉, "어차피 현금으로 쌓여 있을 돈을 굴리는" 개념이었다.
          우리 전략은 현금 버퍼 없이 동적 인출률로 매달 직접 꺼내는 구조라,
          그대로 옮기면 TQQQ를 팔아서 S&P500을 사는 역할이 돼버린다.
          전략 구조가 다르면 같은 아이디어도 다르게 작동한다.
        </P>

        <H2>결론</H2>

        <Callout color="green">
          25% 룰 전략에서 S&P500 자동분산은 넣을 이유가 없다.
          EMA200 신호가 하락장을 이미 피해주고,
          분산 전환 과정에서 세금이 발생하며,
          상승장 레버리지 효과만 줄어든다.
          단순하게 TQQQ 하나를 신호에 따라 운용하는 것이 낫다.
        </Callout>

        <P>
          아이디어를 검토하고 직접 구현해서 돌려봤을 때 결과가 더 나빠지는 걸 확인한 후
          시뮬레이터에서 제거했다.
          좋아 보이는 아이디어도 백테스트 앞에서는 틀릴 수 있다.
        </P>

        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <Link
            href="/posts/withdrawal-guide"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">인출식 방법론</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">25% 룰 전략 전체 설명</div>
            </div>
          </Link>
          <Link
            href="/simulator/withdrawal"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">인출 시뮬레이터</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">내 시작 시점으로 직접 확인</div>
            </div>
          </Link>
        </div>

      </main>
    </div>
  )
}
