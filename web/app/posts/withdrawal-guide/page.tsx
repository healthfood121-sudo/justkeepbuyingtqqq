import Link from 'next/link'
import Header from '@/components/Header'
import WithdrawalStats from '@/components/WithdrawalStats'
import EmaSignalCard from '@/components/EmaSignalCard'

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

function FormulaBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 font-mono text-sm text-gray-700 dark:text-gray-300 leading-loose">
      {children}
    </div>
  )
}

function AnalysisLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group mb-3"
    >
      <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
      <div>
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</div>
      </div>
    </Link>
  )
}

function StepCard({
  num, color, title, children,
}: {
  num: string; color: 'blue' | 'yellow' | 'red' | 'purple'; title: string; children: React.ReactNode
}) {
  const colors = {
    blue:   'text-blue-500 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    yellow: 'text-yellow-500 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30',
    red:    'text-red-500 dark:text-red-400 border-red-200 dark:border-red-500/30',
    purple: 'text-purple-500 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
  }
  return (
    <div className={`border rounded-xl px-5 py-4 mb-4 bg-gray-50 dark:bg-gray-900 ${colors[color].split(' ')[2]} ${colors[color].split(' ')[3]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-mono text-sm font-bold ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]}`}>{num}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{title}</span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-7">{children}</div>
    </div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {headers.map((h) => (
              <th key={h} className="py-2 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-4 text-gray-700 dark:text-gray-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function WithdrawalGuidePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">
            ← 목록으로
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">필독</span>
            <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-500/30">
              연구 진행 중
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight mb-4">
            인출식 방법론: 10억 달성 후 어떻게 꺼내 쓰나
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-01 · 최종수정 2026-10-02</span>
            {['인출식', '200일 지수이동평균', '동적인출률', 'FIRE', 'TQQQ', '방법론'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <Callout color="purple">
          <strong>이 방법론은 확정이 아닙니다.</strong><br />
          백테스트를 거치며 계속 개선 중입니다.
          더 나은 방법이 발견될 때마다 업데이트하고, 각 연구 단계의 근거는 아래 링크에서 확인할 수 있습니다.
        </Callout>

        {/* ── 현재 권장 전략 ───────────────────────────────────── */}
        <H2>현재 권장 전략</H2>

        <Callout color="blue">
          <strong>200일 지수이동평균 15일 연속 + 동적 인출률 (S0) — 대부분 권장</strong><br />
          668가지 시작 시점 기준: 생존율 100% · 중간값 20년 후 <strong>1,109억</strong> · 연평균 수익률 25.9%<br />
          매수 후 구조적으로 1일 재매도 없음 · 평균 거래 21회/20년<br />
          <Link href="/posts/withdrawal-guide/tradelog" className="text-blue-600 dark:text-blue-400 underline text-xs mt-1 inline-block">
            전체 거래 로그 — 668가지 시작 시점 날짜별 매수/매도 기록 →
          </Link>
        </Callout>

        <div className="mb-6">
          <EmaSignalCard />
        </div>

        <P>
          200일 지수이동평균 기반 전략에서 출발해 여러 아이디어를 테스트했다.
          수익만 보면 D10GK(중간값 3,741억)가 압도적이지만, 대부분의 사람에게는 S0가 현실적인 선택이다.
          S0는 매수 후 최소 15거래일 보유가 구조적으로 보장되고, 668가지 시작 시점 전체에서 1일 재매도 사례가 단 한 건도 없다.
          T25(1,064억)보다 수익도 앞서며 규칙이 단순하다.
        </P>

        <WithdrawalStats />

        <Callout color="green">
          <strong>수익 극대화 옵션: RSI 과매도 조기 재진입 + 이동평균 대비 하락폭 필터 + Guyton-Klinger (D10GK)</strong><br />
          668가지 시작 시점 기준: 생존율 100% · 중간값 20년 후 <strong>3,741억</strong> · 연평균 수익률 32.1%<br />
          S0 대비 3.4배 우세. 단, 하락장에서 매수 다음날 재매도 사이클이 반복된다.
        </Callout>

        {/* ── 전체 전략 비교 ───────────────────────────────────── */}
        <H2>지금까지 테스트한 전략 전체 비교</H2>
        <P>
          1단계부터 5단계까지 연구에서 나온 모든 전략의 결과를 한 표에 정리했다.
          초기 자산 10억 · 668가지 시작 시점(1971~현재) · 20년 시뮬레이션 기준.
        </P>

        <div className="overflow-x-auto mb-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {['전략', '중앙값', '생존율', '거래/20년', '포스트', '데이터'].map(h => (
                  <th key={h} className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[
                {
                  name: 'SP500 드로다운 v1',
                  step: '1단계',
                  med: '12.7억', survival: '100%', trades: '—',
                  post: '/posts/withdrawal-comparison', postLabel: '비교 분석',
                  data: '/posts/withdrawal-comparison/data',
                  dim: true,
                },
                {
                  name: '나스닥100 200일 단순이동평균 기준선',
                  step: '1단계',
                  med: '203억', survival: '99.8%', trades: '144회',
                  post: '/posts/withdrawal-comparison', postLabel: '비교 분석',
                  data: '/posts/withdrawal-comparison/data',
                  dim: true,
                },
                {
                  name: '★ 200일 지수이동평균 15일 (S0) — 대부분 권장',
                  step: '2단계',
                  med: '1,109억', survival: '100%', trades: '21회',
                  post: '/posts/withdrawal-new-ideas', postLabel: '아이디어 8가지',
                  data: '/posts/withdrawal-new-ideas/data',
                  dim: false,
                  rec: true,
                },
                {
                  name: 'RSI<30 조기 재진입',
                  step: '3단계',
                  med: '3,231억', survival: '100%', trades: '57회',
                  post: '/posts/withdrawal-new-ideas', postLabel: '아이디어 8가지',
                  data: '/posts/withdrawal-new-ideas/data',
                  dim: false,
                },
                {
                  name: '★ D10GK (수익 최선)',
                  step: '4단계',
                  med: '3,741억', survival: '100%', trades: '47회',
                  post: '/posts/withdrawal-new-ideas', postLabel: '아이디어 8가지',
                  data: '/posts/withdrawal-new-ideas/data',
                  best: true,
                },
                {
                  name: 'T25 트레일링스탑',
                  step: '5단계',
                  med: '1,064억', survival: '100%', trades: '12회',
                  post: '/posts/withdrawal-new-ideas2', postLabel: '새 아이디어',
                  data: '/posts/withdrawal-new-ideas2/data',
                  dim: false,
                },
                {
                  name: 'DLEV 레버리지 하향',
                  step: '5단계',
                  med: '474억', survival: '100%', trades: '35회',
                  post: '/posts/withdrawal-new-ideas2', postLabel: '새 아이디어',
                  data: '/posts/withdrawal-new-ideas2/data',
                  dim: true,
                },
                {
                  name: 'GRAD 단계적 현금화',
                  step: '5단계',
                  med: '131억', survival: '100%', trades: '54회',
                  post: '/posts/withdrawal-new-ideas2', postLabel: '새 아이디어',
                  data: '/posts/withdrawal-new-ideas2/data',
                  dim: true,
                },
              ].map(row => (
                <tr key={row.name} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${row.dim ? 'opacity-50' : ''}`}>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                    <span className={row.best ? 'font-bold text-green-600 dark:text-green-400' : row.rec ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>{row.name}</span>
                    <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-600">{row.step}</span>
                  </td>
                  <td className={`py-2 px-3 font-mono ${row.best ? 'font-bold text-green-600 dark:text-green-400' : row.rec ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{row.med}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{row.survival}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{row.trades}</td>
                  <td className="py-2 px-3">
                    <Link href={row.post} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">{row.postLabel} →</Link>
                  </td>
                  <td className="py-2 px-3">
                    <Link href={row.data} className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-10">흐린 행은 채택되지 않은 전략. <span className="text-blue-500 dark:text-blue-400">파란색</span> = 대부분 권장 · <span className="text-green-500 dark:text-green-400">초록색</span> = 수익 최선. 중앙값은 20년 완료 기준.</p>

        {/* ── 연구 흐름 ────────────────────────────────────────── */}
        <H2>연구 흐름: 어떻게 여기까지 왔나</H2>

        <div className="space-y-3 mb-8">
          {[
            {
              step: '1단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: 'SP500 낙폭 기반 전략 (v1)',
              result: '중간값 12.7억',
              desc: 'SP500이 −20% 이상 하락하면 인출 중단하는 방식. 하락 중에도 TQQQ를 보유해 손실이 누적됐다.',
              href: '/posts/withdrawal-comparison',
              link: '비교 분석 →',
            },
            {
              step: '2단계',
              color: 'border-blue-300 dark:border-blue-700',
              badge: 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
              title: '★ 200일 지수이동평균 연속 15일 + 동적 인출률 (S0) — 현재 권장',
              result: '중간값 1,109억 (668가지 기준) · 생존율 100%',
              desc: '나스닥100이 200일 지수이동평균 아래에서 15거래일 연속이면 전액 현금 전환. 95가지 설정값 조합 탐색에서 최적 조합. 매수 후 1일 재매도 사례 없음 — 구조적 안전장치.',
              href: '/posts/withdrawal-new-ideas',
              link: '아이디어 8가지 →',
            },
            {
              step: '3단계',
              color: 'border-purple-200 dark:border-purple-800/50',
              badge: 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
              title: '8가지 새 아이디어 테스트',
              result: 'RSI 조기 재진입 → 중간값 3,231억',
              desc: '골든크로스, 분할 재진입, 동적 레버리지 등 8가지를 비교. RSI가 30 미만으로 떨어지면 200일 지수이동평균 신호를 기다리지 않고 즉시 재매수하는 방식이 압도적 우세.',
              href: '/posts/withdrawal-new-ideas',
              link: '테스트 결과 →',
            },
            {
              step: '4단계',
              color: 'border-green-300 dark:border-green-700',
              badge: 'bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400',
              title: 'RSI + 이동평균 대비 −10% 필터 + Guyton-Klinger (D10GK)',
              result: '★ 중간값 3,741억 (668가지 기준)',
              desc: 'RSI 신호에 "200일 지수이동평균보다 10% 이상 떨어진 상태"라는 조건을 추가해 가짜 신호를 줄였다. 자산이 많이 늘었을 때 인출을 자동으로 줄여주는 Guyton-Klinger 규칙도 결합. 과최적화 여부도 검증 완료.',
              href: '/posts/withdrawal-new-ideas',
              link: '상세 분석 →',
            },
            {
              step: '5단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: '트레일링 스탑·단계적 현금화·레버리지 하향 검증',
              result: '추가 아이디어 3가지 — 모두 기준선 미달',
              desc: '3가지 새 아이디어(T25/T20/T15 트레일링 스탑, 단계적 현금화 GRAD, 자산 규모별 레버리지 하향 DLEV)를 668가지 진입 시점으로 테스트. 모두 기준선을 넘지 못했다. 단, T25는 거래 12회로 가장 단순하고 장기 상승장에서 강점이 있다.',
              href: '/posts/withdrawal-new-ideas2',
              link: '검증 결과 →',
            },
            {
              step: '현재',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: 'TQQQ 자체 신호 · 인출 시작 지연 검증',
              result: 'TQQQ 신호: 기준의 1/4 수준 열등 · 인출 2년 지연: +13%',
              desc: 'TQQQ 합성가격 기준 200일 지수이동평균 신호는 레버리지 잡음으로 매매가 너무 잦아 완전히 열등. 반면 다른 수입원이 있어 인출을 1~2년 미룰 수 있는 경우, 최종 자산이 7~13% 늘어나는 효과가 있다.',
              href: '/posts/withdrawal-signal-test',
              link: '검증 결과 →',
            },
          ].map(({ step, color, badge, title, result, desc, href, link }) => (
            <div key={step} className={`border rounded-xl px-4 py-4 ${color}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${badge}`}>{step}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">{title}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{result}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
                {href && link && (
                  <Link href={href} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 mt-0.5">
                    {link}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── 1. 왜 인출식이 더 어려운가 ─────────────────────── */}
        <H2>1. 왜 인출식이 더 어려운가</H2>
        <P>
          적립식은 시장이 내려갈수록 유리하다. 같은 돈으로 더 많이 살 수 있기 때문이다.
          인출식은 반대다. 시장이 내려갈 때 팔면, 포트폴리오가 줄어든 상태에서 더 큰 비율을 팔게 된다.
          이것을 <strong className="text-gray-900 dark:text-white">수익률 순서 리스크(Sequence of Returns Risk)</strong>라고 한다.
        </P>
        <P>
          핵심은 두 가지다. 첫째, <strong className="text-gray-900 dark:text-white">하락장에서 팔지 않는 것</strong>.
          둘째, 팔더라도 <strong className="text-gray-900 dark:text-white">포트폴리오가 작을 때 덜 파는 것</strong>.
          이 두 원칙을 어떻게 구현하느냐가 인출 전략의 핵심이다.
        </P>

        {/* ── 2. S0 권장 전략 상세 ────────────────────────────── */}
        <H2>2. S0 — 권장 전략 상세</H2>

        <Callout color="blue">
          <strong>200일 지수이동평균 연속15일 + 동적 인출률 (S0) — 668가지 시작 시점</strong><br />
          생존율 100% · 중간값 20년 후 <strong>1,109억</strong> · 연평균 수익률 25.9% · 최솟값 1.68억 · 평균 매매 21회/20년
        </Callout>

        <H3>2-1. 하락 신호: 나스닥100 200일 지수이동평균 연속 15일 필터</H3>
        <P>
          <strong className="text-gray-900 dark:text-white">나스닥100 지수</strong>가{' '}
          <strong className="text-gray-900 dark:text-white">200일 지수이동평균</strong> 아래에서{' '}
          <strong className="text-gray-900 dark:text-white">15거래일(약 3주) 연속 유지</strong>될 때
          TQQQ 전량을 현금으로 전환한다. 반대로 200일 지수이동평균 위에서 15거래일 연속이면 전액 재매수한다.
          신호는 TQQQ 합성가격이 아닌 <strong className="text-gray-900 dark:text-white">원지수(나스닥100)로 판단</strong>한다.
        </P>
        <P>
          <strong className="text-gray-900 dark:text-white">200일 지수이동평균이 200일 단순이동평균보다 우세한 이유</strong>: 지수이동평균은 최근 가격에 더 높은 가중치를 부여하기 때문에
          추세 전환에 더 빠르게 반응한다. 하락 초기에 더 일찍 신호를 주고, 반등 시에도 더 빨리 재진입할 수 있다.
          95개 조합 테스트 결과, 200일 지수이동평균 계열이 200일 단순이동평균 계열을 전체적으로 압도했다.
        </P>
        <P>
          <strong className="text-gray-900 dark:text-white">15일 연속 필터 이유</strong>: 기준선(200일 지수이동평균 교차 즉시)을 쓰면 20년에 평균 144번 거래(whipsaw).
          15일 연속 필터를 붙이면 21번으로 줄어들면서도 닷컴버블, 금융위기 같은 큰 하락은
          빠짐없이 포착한다. 10일 필터(25번 거래)보다 더 적은 거래로 더 나은 결과를 냈다.
        </P>
        <FormulaBlock>
          200일 지수이동평균 = 전날 값 × (1 − α) + 당일 종가 × α,  α = 2/(200+1)<br />
          <br />
          매도 조건: 나스닥100 종가 {'<'} 200일 지수이동평균 상태가 15거래일 연속 → 전량 매도 → 현금(외화RP)<br />
          매수 조건: 나스닥100 종가 {'>'} 200일 지수이동평균 상태가 15거래일 연속 → 전액 재매수<br />
          중간 상태: 현재 포지션 유지 (카운터 리셋)
        </FormulaBlock>

        <H3>2-2. 인출률: 자산 크기에 따라 자동 조정</H3>
        <P>
          고정 비율(월 1%) 대신 자산 구간별로 인출률을 다르게 적용한다.
          자산이 작을 때 덜 팔아 회복 여력을 보존하고,
          자산이 클 때 더 많이 받아가는 구조다.
          95개 조합 테스트 결과, 10억/20억 구간에 0.3/0.5/0.7% 비율이 최적으로 확인됐다.
        </P>
        <FormulaBlock>
          총자산 10억 미만: 월 0.3% (연 3.6%)<br />
          총자산 10억 ~ 20억: 월 0.5% (연 6.0%)<br />
          총자산 20억 이상: 월 0.7% (연 8.4%) ← 생활비 상한 1500만
        </FormulaBlock>

        <Callout color="blue">
          <strong>왜 동적 인출률이 효과적인가?</strong><br />
          단순 비율 인출(월 1%)과 달리, 동적 인출률은 포트폴리오가 하락해서 10억 아래로 내려가는 순간
          인출량을 자동으로 30% 수준으로 줄인다. 200일 지수이동평균 현금 전환(하락 중 팔지 않음)과 결합하면
          하락장에서 두 겹으로 자산을 보호하고, 상승 전환 후 복리 효과를 극대화한다.
        </Callout>

        <H3>2-3. 현금 보유 중: 외화RP 이자</H3>
        <P>
          200일 지수이동평균 아래에 있어 현금으로 전환된 기간 동안,
          현금은 외화RP(연방기금금리 − 0.4%)로 이자를 받는다.
          668가지 시작 시점 어디서도 현금이 생활비 2년치 아래로 줄어드는 경우가 없었기 때문에,
          현금 잔고 기준으로 생활비를 줄이는 별도 규칙은 시뮬레이션 결과에 영향이 없었다.
          현금이 있는 한 정상적으로 생활비를 쓰면 된다.
        </P>

        <H3>2-4. 세금 처리</H3>
        <P>
          매도 시 수익분(매도가 − 평균매수가)에만 22% 양도세를 적용한다.
          250만원 기본공제는 연말에 일괄 정산해 환급한다.
          200일 이동평균 아래에서 전량 현금 전환 시에는 세금 없이 매도,
          인출(생활비 차감) 시에만 수익분 과세한다.
        </P>

        {/* ── 3. 주요 시나리오 비교 ────────────────────────────── */}
        <H2>3. 주요 시나리오 비교 (초기 10억, 20년)</H2>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">전략별 요약 (668가지 시작 시점)</span>
          <Link href="/posts/withdrawal-comparison/data" className="text-xs text-blue-500 dark:text-blue-400 hover:underline">
            전체 데이터 →
          </Link>
        </div>

        <Table
          headers={['전략', '생존율', '중앙값', '연평균 수익률', '최솟값', '거래수']}
          rows={[
            ['SP500기반 (구 v1)',       '100%',   '12.7억',  '4.9%',  '0.002억', '–'],
            ['200일 단순이동평균 기준선',           '99.8%', '203억',   '17.6%', '0억',      '144'],
            ['200일 단순이동평균 ±5% 범위',      '100%',  '251억',   '16.7%', '0.26억',   '25'],
            ['200일 단순이동평균 연속10일 (B3)',    '100%',  '328억',   '18.6%', '0.73억',   '25'],
            ['200일 단순이동평균 + 동적인출 (B3C1)', '100%', '619억',   '22.1%', '1.88억',   '25'],
            ['200일 지수이동평균 연속10일 + 동적인출', '100%', '798억',  '23.8%', '1.60억',   '29'],
            [<strong key="best" className="text-blue-600 dark:text-blue-400">★ 200일 지수이동평균 연속15일 + 동적인출 (S0)</strong>,
              '100%', <strong key="bv" className="text-blue-600 dark:text-blue-400">1,176억</strong>,
              <strong key="bc" className="text-blue-600 dark:text-blue-400">25.9%</strong>,
              '1.68억', '21'],
          ]}
        />

        <Table
          headers={['진입 시점', '상황', 'v1(SP500기반)', '200일 단순이동평균 10일+동적인출', '★ 200일 지수이동평균 15일+동적인출']}
          rows={[
            ['1996-10', '닷컴버블 직전', '1.2억',  '502억',  '1,892억'],
            ['1999-03', '버블 상승 중',  '8.0억',  '76억',   '180억'],
            ['2000-03', '버블 정점',     '0.04억', '11.2억', '22.2억'],
            ['2003-03', '버블 이후',     '198억',  '441억',  '252억'],
          ]}
        />

        <P>
          기존 방법론(v1)은 닷컴버블 정점(2000-03) 진입 시 0.04억으로 사실상 파산이었다.
          200일 지수이동평균 15일 전략으로 22.2억까지 끌어올렸고,
          버블 직전(1996-10) 진입에서는 1,892억(약 190배)을 달성한다.
          2003-03처럼 버블 이후 저점 진입은 200일 지수이동평균이 200일 단순이동평균보다 소폭 낮은데,
          이는 저점에서 빠른 신호 반응이 약간 일찍 매수·매도를 유발하기 때문이다.
        </P>

        {/* ── 4. 설정값 탐색 세부 결과 ───────────────────────── */}
        <H2>4. 설정값 탐색 — 어떻게 이 조합을 찾았나</H2>

        <P>
          95가지 조합 테스트(지수/단순이동평균 × 연속일 × 인출률 × 구간)와
          이중버퍼 구조 별도 테스트를 통해 각 설계 결정을 데이터로 검증했다.
        </P>

        <H3>4-1. 200일 지수이동평균 vs 200일 단순이동평균 × 연속일 필터</H3>
        <P>
          같은 설정값에서 200일 지수이동평균이 200일 단순이동평균을 일관되게 압도한다.
          연속일 필터는 5~20일을 테스트했고, 15일이 최적이었다.
        </P>

        <Table
          headers={['이동평균', '연속일', '중앙 최종값', '연평균 수익률', '거래 횟수/20년', '최솟값']}
          rows={[
            ['200일 단순이동평균', '10일', '619억',   '22.1%', '26회', '1.88억'],
            ['200일 단순이동평균', '15일', '665억',   '22.6%', '26회', '–'],
            ['200일 단순이동평균', '20일', '722억',   '23.3%', '19회', '1.04억'],
            ['200일 지수이동평균', '10일', '798억',   '23.8%', '29회', '1.60억'],
            ['200일 지수이동평균', '15일', <strong key="w" className="text-green-600 dark:text-green-400">1,176억</strong>,
              <strong key="c" className="text-green-600 dark:text-green-400">25.9%</strong>, '21회', '1.68억'],
          ]}
        />

        <Callout color="blue">
          <strong>왜 200일 지수이동평균이 200일 단순이동평균보다 우세한가?</strong><br />
          단순이동평균은 200일 동안 모든 날의 가중치가 동일하다. 지수이동평균은 최근 데이터에 더 높은 가중치(α=2/201≈0.01)를 부여해
          추세 전환을 더 빨리 포착한다. 인출 단계에서는 하락 초기에 빨리 현금으로 전환하고,
          반등 초기에 빨리 재진입하는 것이 유리하기 때문에 200일 지수이동평균이 큰 차이를 만든다.
        </Callout>

        <H3>4-2. 인출 구조: 단일버퍼 vs 이중버퍼</H3>
        <P>
          "매달 동적 비율 전체 인출 → 생활비 쓰고 남는 건 별도 버퍼 → VOO 매수" 구조(이중버퍼)와
          "인출 상한 1500만, 나머지는 TQQQ에 그대로" 구조(단일버퍼)를 비교했다.
        </P>

        <Table
          headers={['구조', '설명', '중앙 최종값', '연평균 수익률']}
          rows={[
            [<strong key="s0" className="text-green-600 dark:text-green-400">★ 단일버퍼</strong>,
              '인출 상한 1500만, 나머지 TQQQ 복리',
              <strong key="v0" className="text-green-600 dark:text-green-400">1,176억</strong>,
              <strong key="c0" className="text-green-600 dark:text-green-400">26.0%</strong>],
            ['이중버퍼 (B2→VOO 12개월치)', '초과 인출분 → 별도버퍼 → VOO', '854억', '23.9%'],
            ['이중버퍼 (B2→VOO 24개월치)', '초과 인출분 → 별도버퍼 → VOO', '854억', '23.9%'],
            ['이중버퍼 (B2→VOO 36개월치)', '초과 인출분 → 별도버퍼 → VOO', '853억', '23.9%'],
          ]}
        />

        <P>
          이중버퍼가 단일버퍼보다 27% 낮은 이유: 자산이 커질수록 동적 인출률(0.7%)로
          더 많이 TQQQ를 팔아 VOO로 이동하게 되는데, VOO(1배)가 TQQQ(200일 지수이동평균 보호 3배)보다
          장기 성장이 느리기 때문이다. 200일 지수이동평균이 이미 하락 방어를 담당하므로
          추가 분산이 오히려 복리를 갉아먹는다.
          단, 닷컴버블 정점(2000-03) 같은 극단적 케이스에서는 이중버퍼가 22.2억 vs 24.3억으로 소폭 우세하다.
        </P>

        {/* ── 5. 기존 방법론 (v1 레거시) ──────────────────────── */}
        <H2>5. 기존 방법론 v1 (참고용)</H2>

        <Callout color="yellow">
          아래 내용은 이전에 사용하던 방법론이다.
          S0 전략보다 성능이 낮지만, 설계 사고 방식을 이해하는 데 참고가 된다.
          특히 버블 케이스 처리와 버퍼 계산 로직은 여전히 유효한 관점이다.
        </Callout>

        <H3>v1-1. 버블 케이스 판단</H3>
        <P>
          적립 소요기간 1.5년 미만이면 버블로 판단해 인출을 보류하고 DCA로 재진입한다.
          2년 대기 후 DCA(Method A) vs 즉시 DCA(Method B)를 비교한 결과,
          닷컴버블 직전 진입에서는 A가 크게 유리했고,
          버블 중반 진입에서는 B가 소폭 유리했다.
        </P>

        <H3>v1-2. 버퍼 계산</H3>
        <FormulaBlock>
          버퍼 기간 = max(0, 기준연수 − 적립 소요기간)<br />
          버퍼 금액 = 버퍼 기간 × 일적립액 × 252
        </FormulaBlock>

        <H3>v1-3. SP500 −20% / −50% 대응</H3>
        <P>
          SP500 −20%: 인출 중단 + 1년간 일 20만원 매수. 8억 회복 시 재개.<br />
          SP500 −50%: 버퍼 전액을 14년에 걸쳐 분산 매수.
        </P>

        {/* ── 6. 어떤 전략을 선택할까 ─────────────────────────── */}
        <H2>6. 어떤 전략을 선택할까</H2>

        <P>
          수익만 보면 D10GK가 압도적이다. 하지만 실생활에서 꾸준히 유지할 수 있는 전략인지도 중요하다.
          복잡한 규칙은 지키다 지쳐 포기하면 무의미하기 때문이다.
        </P>

        <Table
          headers={['전략', '평균 거래', '1일 재매도', '신호 확인', '중앙값']}
          rows={[
            [<strong key="d10gk" className="text-green-600 dark:text-green-400">D10GK</strong>,
              '47회/20년', '있음 (하락장)', '매일 (알림 권장)', <strong key="d10gkv" className="text-green-600 dark:text-green-400">3,741억</strong>],
            [<strong key="s0" className="text-blue-600 dark:text-blue-400">S0 (200일 지수이동평균 15일)</strong>,
              '21회/20년', <strong key="s0w" className="text-green-600 dark:text-green-400">없음 (구조적)</strong>, '매일 (앱 표시 가능)', <strong key="s0v" className="text-blue-600 dark:text-blue-400">1,109억</strong>],
            ['T25 (트레일링 스탑)', '12회/20년', '27.6%', '주 1회', '1,064억'],
          ]}
        />

        <H3>S0 — 200일 지수이동평균 15일, 단순하면서 안정적</H3>
        <FormulaBlock>
          매도: 나스닥100이 200일 지수이동평균 아래에서 15거래일 연속 → 전량 현금 전환<br />
          매수: 나스닥100이 200일 지수이동평균 위에서 15거래일 연속 → 전액 재매수
        </FormulaBlock>
        <P>
          매수 조건과 매도 조건이 둘 다 "15일 연속"이라, 매수 직후 최소 15거래일은
          구조적으로 보유가 보장된다. 668가지 시작 시점 전체에서 매수 다음날 재매도된 사례가
          단 한 건도 없다. 매일 확인해야 하지만 앱에서 현재 구간을 표시해주면 부담이 없다.
        </P>

        <H3>T25 — 거래 횟수는 적지만 약점 있음</H3>
        <FormulaBlock>
          매도: 52주(약 1년) 최고가 대비 −25% 이상 하락 → 전량 현금 전환<br />
          매수: 200일 지수이동평균 위 15거래일 연속 회복 → 전액 재매수
        </FormulaBlock>
        <P>
          20년에 평균 12번으로 거래가 가장 적다. 하지만 전체 매도의 27.6%가 매수 다음날 바로 재매도다.
          이유는 52주 고점이 1년간 유지되기 때문이다. 큰 하락 이후 200일 지수이동평균을 회복해 매수해도,
          1년 전 고점 기준 −25%는 이미 근접해있어 다음날 조금만 빠져도 매도 조건이 충족된다.
          거래 12회 중 3~4회가 다음날 재매도라면 실질 유효 포지션은 8~9회로 S0(21회)와 크게 다르지 않다.
          2009-03 같은 장기 상승장 초입에서는 D10GK(1,588억)를 앞서기도 하지만(2,675억),
          그 타이밍을 미리 알 수 없다.
        </P>

        <H3>D10GK — 수익 최대화 전략</H3>
        <P>
          RSI와 이동평균 대비 하락폭을 매일 확인해야 하는 부담이 있다. 하지만 핵심은
          &ldquo;RSI가 30 이하로 떨어지면 알림&rdquo; 하나를 설정해두는 것이다.
          알림 없는 날에는 신경 쓸 필요가 없고, 알림이 오면 이동평균 대비 하락폭 조건까지만 확인하면 된다.
          20년에 47번(약 5개월에 1회) 행동 기회가 생긴다.
        </P>
        <Callout color="yellow">
          <strong>닷컴버블 같은 장기 하락에서는 매수 다음날 재매도될 수 있다</strong><br />
          RSI 신호로 재진입했는데 시장이 계속 하락하면, 200일 지수이동평균 아래 연속일 조건이 즉시 충족돼
          1~2일 만에 재매도 신호가 뜬다. 2000~2002년 구간에서 이 사이클이 8번 반복됐다.<br /><br />
          이것은 의도된 구조다. &ldquo;재진입이 틀렸을 때 빠르게 손절&rdquo;하는 자동 안전장치로,
          이 동작을 제거하면 성능이 4.4배 떨어진다는 것이 검증됐다.
          심리적으로 가장 어려운 부분이지만 건드리지 않는 것이 맞다.
        </Callout>

        <Callout color="blue">
          <strong>RSI는 종가 기준이다</strong><br />
          RSI는 장 마감(미국 동부 오후 4시, 한국 새벽 5시)에 종가가 확정된 뒤에야 최종값이 결정된다.
          장중 RSI는 미확정 상태이므로 참고만 할 것.
          실제 운영은 &ldquo;새벽 5시 이후 확인 → 조건 충족 시 다음 날 개장 후 매매&rdquo; 흐름이 현실적이다.
        </Callout>

        <H3>결론: 무엇을 선택할까</H3>
        <Callout color="blue">
          <strong>대부분의 사람</strong>에게 → <strong>S0 (200일 지수이동평균 15일)</strong> — 1일 재매도 없음 · 중간값 1,109억<br />
          수익을 극대화하고 알림 설정을 감수할 수 있다면 → <strong>D10GK</strong> — 중간값 3,741억<br />
          거래 횟수를 최소화하고 싶다면 → <strong>T25</strong> — 12회/20년 (단, 1일 재매도 27.6% 감수)
        </Callout>
        <P>
          솔직히 말하면, <strong className="text-gray-900 dark:text-white">대부분의 사람에게는 S0가 현실적인 선택이다.</strong>{' '}
          D10GK의 3,741억은 닷컴버블 속에서 매수→다음날 재매도를 반복 실행했을 때 나오는 숫자다.
          T25는 거래가 적어 보이지만 그 중 27.6%가 다음날 재매도로, 실제 체감은 생각보다 불안정하다.
          S0는 매수 후 최소 15일 보유가 보장되고, 1,109억으로 T25(1,064억)보다 수익도 앞선다.
          앱에서 현재 구간을 표시해주면 신호 확인 부담도 없다.
        </P>

        {/* ── 7. 아직 해결 안 된 것들 ──────────────────────────── */}
        <H2>7. 아직 해결 안 된 것들</H2>

        <H3>확인된 것</H3>
        <ul className="list-none space-y-3 mb-6">
          {[
            { q: '✅ 200일 지수이동평균 > 200일 단순이동평균', a: '200일 지수이동평균 계열이 200일 단순이동평균 계열을 전 조합에서 압도. 같은 조건(연속10일, 0.3/0.5/0.7%)에서 619억 → 798억으로 상승.' },
            { q: '✅ 15일 연속 필터가 10일보다 우세', a: '더 적은 거래(21회 vs 29회)로 더 높은 중앙값(1,176억 vs 798억). 추가 필터링이 신호 품질을 높였다.' },
            { q: '✅ 0.3/0.5/0.7% 비율 확정 (구간: 10억/20억)', a: '95개 조합 중 이 조합이 최적. 0.2/0.4/0.6%, 0.4/0.6/0.8%, 0.3/0.6/0.9% 등보다 일관되게 우세.' },
            { q: '✅ 단일버퍼(인출 상한 1500만) > 이중버퍼(초과분 VOO 이전)', a: 'TQQQ에서 1500만만 꺼내고 나머지를 3배 레버리지로 복리하는 것이, 더 많이 꺼내 VOO로 분산하는 것보다 중앙값 기준 27% 우세.' },
            { q: '✅ 초기 현금버퍼 불필요', a: '6개월, 12개월 초기 버퍼를 테스트했지만 200일 지수이동평균 즉시 전환 방식이 더 우세. 200일 지수이동평균이 하락 초기에 알아서 현금 전환하므로 사전 버퍼 필요성 낮음.' },
          ].map(({ q, a }) => (
            <li key={q} className="border border-green-200 dark:border-green-800/40 rounded-xl px-4 py-3 bg-green-50/50 dark:bg-green-900/10">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a}</p>
            </li>
          ))}
        </ul>

        <H3>아직 열린 것</H3>
        <ul className="list-none space-y-3 mb-8">
          {[
            { q: '20일+ 연속 필터 + 200일 지수이동평균 조합은?', a: '200일 단순이동평균 + 20일 조합도 순위권(722억)이었지만 200일 지수이동평균+15일(1,176억)보다 낮았다. 200일 지수이동평균+20일 이상은 미테스트 영역.' },
            { q: '다른 기간의 지수이동평균(100일·150일·250일)?', a: '200일 지수이동평균 고정 상태에서만 탐색했다. 더 짧거나 긴 기간의 효과는 검증되지 않았다.' },
            { q: '2003-03 저점 진입에서 200일 지수이동평균이 200일 단순이동평균보다 낮은 이유', a: '저점 반등 시 200일 지수이동평균이 빠른 반응으로 조금 일찍 매수 신호를 줘 약간의 오신호가 섞인다. 저점 진입 케이스에서의 최적화 여지.' },
          ].map(({ q, a }) => (
            <li key={q} className="border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a}</p>
            </li>
          ))}
        </ul>

        {/* ── 다음 단계 ──────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">관련 분석 글</p>
          <div className="space-y-0">
            <AnalysisLink
              href="/posts/withdrawal-new-ideas"
              title="인출 전략 새 아이디어 8가지 — S0가 대부분에게 최선"
              desc="S0(200일 지수이동평균 15일)를 기준으로 RSI 조기 재진입·골든크로스·동적 레버리지 등 8가지 비교. D10GK는 수익 극대화 옵션."
            />
            <AnalysisLink
              href="/posts/withdrawal-new-ideas2"
              title="더 나을 줄 알았던 전략 3가지를 테스트해봤다"
              desc="트레일링 스탑·단계적 현금화·레버리지 하향 — 668가지 진입 시점으로 모두 검증. T25가 가장 단순한 대안."
            />
            <AnalysisLink
              href="/posts/withdrawal-signal-test"
              title="10억 달성 후 바로 꺼낼까, 1~2년 더 기다릴까"
              desc="인출 시작을 1~2년 미루면 최종 자산 +7~13%. 다른 수입원이 있는 경우에만 유효한 전략."
            />
            <AnalysisLink
              href="/posts/withdrawal-comparison"
              title="인출 전략 비교: SP500 기반 vs 나스닥100 200일 이동평균 기반"
              desc="418가지 시작 시점 비교. 두 전략의 중앙값 12.7억 vs 203억 차이가 발생하는 원인 분석."
            />
            <AnalysisLink
              href="/posts/withdrawal-strategy"
              title="인출 전략 설계기: 버블 케이스 재진입 방법 비교 (A vs B)"
              desc="버블 케이스를 2년 대기(Method A) vs 즉시 DCA(Method B)로 처리할 때 643가지 시작 시점에서 어떤 차이가 나는지 분석."
            />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/posts/accumulation-guide"
              className="flex-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl px-5 py-4 hover:border-blue-400 dark:hover:border-blue-400/60 transition-colors text-center"
            >
              <div className="text-xs text-blue-500 dark:text-blue-400 font-bold mb-1">이전 필독</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">← 적립식 방법론</div>
            </Link>
            <Link
              href="/simulator"
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-center py-4 rounded-xl text-sm font-semibold transition-colors"
            >
              시뮬레이터에서 내 숫자로 확인 →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
