import Link from 'next/link'
import LegacyResearchNote from '@/components/LegacyResearchNote'
import Header from '@/components/Header'

function Tag({ children }: { children: string }) {
  return (
    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{children}</span>
  )
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

function Callout({ color = 'blue', children }: { color?: 'blue' | 'yellow' | 'red' | 'green' | 'purple'; children: React.ReactNode }) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    red:    'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200',
    green:  'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
    purple: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-200',
  }
  return (
    <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>
      {children}
    </div>
  )
}

function DataLink({ m }: { m: string }) {
  return (
    <Link
      href={`/posts/withdrawal-signal-test/data?m=${m}`}
      className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap"
    >
      데이터 →
    </Link>
  )
}

export default function WithdrawalSignalTestPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-12">

        {/* 헤더 */}
        <div className="mb-2">
          <Link href="/posts/withdrawal-guide" className="text-xs text-blue-500 dark:text-blue-400 hover:underline">
            ← 인출식 방법론 허브
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-snug">
          10억 달성 후 바로 꺼낼까, 1~2년 더 기다릴까
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">2026-10-03</p>
        <div className="flex flex-wrap gap-1.5 mb-10">
          {['인출식', 'EMA200', '인출지연', 'FIRE', 'TQQQ', '백테스트'].map(t => <Tag key={t}>{t}</Tag>)}
        </div>

        <LegacyResearchNote />

        {/* 요약 */}
        <Callout color="blue">
          <strong>결론 요약</strong><br />
          • TQQQ 자체 가격 기준 지수이동평균 신호 → 중앙값 276억 (기준 1,176억의 1/4). 채택 불가.<br />
          • 인출 1년 지연 → 중앙값 1,261억 (+7%), 2년 지연 → 1,333억 (+13%)<br />
          • 단, 지연 기간 동안 다른 수입원이 있어야 실행 가능한 전략.
        </Callout>

        <H2>배경: 두 가지 변형을 검증해봤다</H2>
        <P>
          지금까지 인출 전략 연구는 주로 두 가지 축이었다. 언제 현금으로 피할지(신호 조건),
          그리고 매달 얼마씩 꺼낼지(인출률). 이번에는 다른 각도를 테스트했다.
        </P>
        <P>
          첫째, 신호 계산을 나스닥100 원지수 대신 TQQQ 합성가격으로 바꾸면 어떻게 될까.
          둘째, 10억을 달성하고도 1~2년간 인출을 미루면 나중에 더 많이 꺼낼 수 있을까.
        </P>
        <P>
          418가지 진입 시점(1971년~2004년 매월), 20년 시뮬레이션으로 비교했다.
        </P>

        <H2>1. TQQQ 자체 신호: 왜 나쁜가</H2>

        <P>
          현재 권장 전략(S0)은 <strong className="text-gray-900 dark:text-white">나스닥100 원지수</strong>가
          200일 지수이동평균(EMA200) 아래에서 15거래일 연속이면 전량 현금 전환한다.
          이번에 테스트한 것은 같은 조건을 <strong className="text-gray-900 dark:text-white">TQQQ 합성가격</strong>에 적용하는 방식이다.
        </P>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium">전략</th>
                <th className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium">중앙값</th>
                <th className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium">연평균 수익률</th>
                <th className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium">생존율</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">기준 (나스닥100 EMA200)</td>
                <td className="py-2 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-semibold">1,176억</td>
                <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">26.0%</td>
                <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">100%</td>
                <td className="py-2 px-3 text-right"><DataLink m="S0" /></td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 opacity-60">
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">TQQQ 자체 EMA200 신호</td>
                <td className="py-2 px-3 text-right font-mono text-red-600 dark:text-red-400 font-semibold">276억</td>
                <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">16.9%</td>
                <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">100%</td>
                <td className="py-2 px-3 text-right"><DataLink m="TQQQ_EMA" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <P>
          결과는 기준의 4분의 1 수준이다. 이유는 구조적이다.
        </P>
        <P>
          나스닥100이 1% 하락할 때 TQQQ는 약 3% 하락한다. 그만큼 TQQQ의 EMA200 대비 이탈 폭도
          3배가 된다. 15거래일 연속 조건이 훨씬 자주 충족되고, 매매 횟수가 늘어나며, 수수료와
          재진입 타이밍 손실이 누적된다.
        </P>
        <Callout color="red">
          나스닥100 원지수로 신호를 잡고 TQQQ를 매매하는 현재 방식이 옳다.
          TQQQ 자체 가격으로 신호를 계산하면 레버리지 잡음까지 신호로 오해하게 된다.
        </Callout>

        <H2>2. 인출 지연: 1~2년 더 기다리면</H2>

        <P>
          10억을 달성한 직후에는 포트폴리오가 딱 10억이다. 동적 인출률 기준으로 이달 꺼낼 수 있는
          최대 금액은 월 300만원(0.3%)이다. 이 시점에서 인출을 바로 시작하는 대신,
          1년 혹은 2년을 더 복리로 굴리면 어떻게 될까.
        </P>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium">전략</th>
                <th className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium">중앙값</th>
                <th className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium">연평균 수익률</th>
                <th className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium">평균 총 인출</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">즉시 인출 시작 (기준)</td>
                <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">1,176억</td>
                <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">26.0%</td>
                <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">27.4억</td>
                <td className="py-2 px-3 text-right"><DataLink m="S0" /></td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">1년 지연</td>
                <td className="py-2 px-3 text-right font-mono text-blue-600 dark:text-blue-400">1,261억 <span className="text-xs font-normal text-green-600 dark:text-green-400">+7%</span></td>
                <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">26.3%</td>
                <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">27.1억</td>
                <td className="py-2 px-3 text-right"><DataLink m="DELAY12" /></td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">2년 지연</td>
                <td className="py-2 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-semibold">1,333억 <span className="text-xs font-normal text-green-600 dark:text-green-400">+13%</span></td>
                <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">26.7%</td>
                <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">26.5억</td>
                <td className="py-2 px-3 text-right"><DataLink m="DELAY24" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <H3>왜 더 많이 남는가</H3>
        <P>
          동적 인출률의 핵심은 자산이 클수록 인출금도 커진다는 것이다. 10억 시점의 300만원이
          아니라, 2년 뒤 12~15억이 됐을 때 첫 인출을 시작하면 그 시점부터 매달 더 많이 꺼낼 수 있다.
          인출 시작이 늦어도 인출 총액은 큰 차이가 없고, 오히려 잔여 자산이 크게 늘어난다.
        </P>
        <P>
          닷컴버블 직후 진입(2000-03) 같은 최악의 케이스에서도 같은 방향으로 움직인다.
          기준 22억 → 1년 지연 23억 → 2년 지연 24억. 절대값은 작지만 비율 개선은 유지된다.
        </P>

        <H3>현실적인 조건</H3>
        <Callout color="yellow">
          이 전략은 10억 달성 후 <strong>1~2년간 인출 없이 버틸 수 있는 사람</strong>에게만 유효하다.<br /><br />
          직장을 계속 다니고 있거나, 다른 수입원이 있거나, 생활비를 대신 충당할 저축이 있는 경우가 해당된다.
          그런 상황이라면 인출 시작을 서두를 이유가 없다. 10억 달성을 확인한 뒤 1~2년을 더 기다리는 것만으로
          최종 자산이 7~13% 늘어난다.
        </Callout>

        <H2>정리</H2>
        <div className="space-y-3 mb-8">
          {[
            {
              label: 'TQQQ 자체 EMA200 신호',
              verdict: '채택 불가',
              color: 'border-red-200 dark:border-red-800/50',
              badge: 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400',
              desc: 'TQQQ는 3배 레버리지라 EMA200 교차가 너무 잦다. 잡음을 신호로 오인해 매매가 늘고 수익이 크게 줄어든다. 나스닥100 원지수 기준 신호가 맞다.',
            },
            {
              label: '인출 2년 지연',
              verdict: '+13%',
              color: 'border-blue-300 dark:border-blue-700',
              badge: 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
              desc: '다른 수입원이 있다면 10억 달성 후 바로 꺼내지 않아도 된다. 2년 기다리면 최종 자산 중앙값이 1,176억 → 1,333억으로 늘어난다. 단 전제 조건이 필요한 전략이다.',
            },
          ].map(({ label, verdict, color, badge, desc }) => (
            <div key={label} className={`border rounded-xl px-4 py-3 ${color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{verdict}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">관련 글</p>
          <div className="space-y-2">
            <Link href="/posts/withdrawal-guide" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span className="text-blue-400">→</span> 인출식 방법론 허브 — 전략 비교 및 연구 흐름 전체
            </Link>
            <Link href="/posts/withdrawal-new-ideas2" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span className="text-blue-400">→</span> 트레일링 스탑·단계적 현금화·레버리지 하향 검증
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
