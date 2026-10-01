import Link from 'next/link'
import { readFileSync } from 'fs'
import { join } from 'path'
import Header from '@/components/Header'
import WithdrawalComparisonChart from '@/components/charts/WithdrawalComparisonChart'

// ─── 유틸 컴포넌트 ────────────────────────────────────────────

function Tag({ children }: { children: string }) {
  return (
    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
      {children}
    </span>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-12 mb-4 text-gray-900 dark:text-white">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-8 mb-3 text-gray-700 dark:text-gray-200">{children}</h3>
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

function Table({
  headers,
  rows,
}: {
  headers: string[]
  rows: (string | number | React.ReactNode)[][]
}) {
  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {headers.map((h) => (
              <th key={h} className="py-2 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-4 text-gray-700 dark:text-gray-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DataLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap"
    >
      데이터 →
    </Link>
  )
}

// ─── 페이지 ───────────────────────────────────────────────────

export default function WithdrawalComparisonPost() {
  // 서버에서 JSON 로드
  const jsonPath = join(process.cwd(), 'public', 'data', 'withdrawal_comparison.json')
  const raw = readFileSync(jsonPath, 'utf-8')
  const data = JSON.parse(raw)
  const { summary } = data
  const sa = summary.a
  const sb = summary.b

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* 헤더 */}
        <div className="mb-12">
          <Link
            href="/posts"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block"
          >
            ← 목록으로
          </Link>
          <h1 className="text-3xl font-black leading-tight mb-4">
            인출 전략 비교: SP500 드로다운 기반 vs NDX 200MA 기반
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-01</span>
            {['인출', '백테스트', 'TQQQ', '200MA', '비교'].map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>

        {/* 본문 */}
        <P>
          TQQQ 인출 단계에서 가장 중요한 선택 중 하나는{' '}
          <strong className="text-gray-900 dark:text-white">언제 인출을 멈추고 현금으로 버티느냐</strong>입니다.
          두 가지 접근법을 10억 초기 자산, 20년 시뮬레이션 조건에서 비교했습니다.
        </P>

        <H2>두 전략의 핵심 차이</H2>

        <Table
          headers={['', 'A안 (SP500 드로다운 기반)', 'B안 (NDX 200MA 기반)']}
          rows={[
            ['인출 중단 신호', 'SP500 고점 대비 −20% 하락', 'NDX 200일 이동평균선 이탈'],
            ['중단 방식', '주식 그대로 보유 + 인출만 중단', '전량 매도 → 현금 전환'],
            ['하락장 생활비', '인출 중단 (현금 없음)', '현금/외화RP에서 충당'],
            ['재매수 신호', 'SP500 회복 (−20% 이상)', 'NDX가 MA200 이상 회복'],
            ['인출 한도', '없음 (포트폴리오 × 1%)', '생활비 캡 (월 최대 1500만)'],
            ['세금 처리', '없음 (단순 비율 인출)', '수익분 22%, 250만원 기본공제'],
          ]}
        />

        <P>
          A안은 단순합니다. 시장이 나쁘면 인출을 멈추고 기다립니다.
          B안은 더 복잡합니다. MA200 아래면 전량 현금으로 바꾸고, 현금에서 이자를 받으면서 생활비를 충당합니다.
          어느 쪽이 실제로 더 나은지 데이터로 확인했습니다.
        </P>

        <H2>전체 코호트 결과 요약</H2>

        <Callout color="blue">
          418개 코호트 (1971년 ~ 2006년), 각 시점에서 10억으로 인출 시작 → 20년 시뮬레이션
        </Callout>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">전략별 결과 요약</span>
          <DataLink href="/posts/withdrawal-comparison/data" />
        </div>
        <Table
          headers={['지표', 'A안 (SP500기반)', 'B안 (MA200기반)']}
          rows={[
            ['코호트 수', sa.total, sb.total],
            ['파산 횟수', sa.bankrupt, sb.bankrupt],
            ['생존율', `${sa.survival_rate}%`, `${sb.survival_rate}%`],
            ['20년 후 평균 잔여자산', `${sa.avg_final}억`, `${sb.avg_final}억`],
            ['20년 후 중앙값 잔여자산', `${sa.med_final}억`, `${sb.med_final}억`],
            ['평균 누적 인출액', `${sa.avg_withdrawn}억`, `${sb.avg_withdrawn}억`],
            ['최소 최솟값 (최악 구간)', `${sa.min_of_min}억`, `${sb.min_of_min}억`],
            ['생존 코호트 평균 CAGR', `${sa.avg_cagr}%`, `${sb.avg_cagr}%`],
          ]}
        />

        <H2>닷컴버블 구간 비교</H2>

        <H3>버블 직전 진입 (1996–1998년)</H3>
        <Table
          headers={['시작', 'A안 최종', 'A안 인출총액', 'B안 최종', 'B안 인출총액', '']}
          rows={[
            ['1996-10', '1.23억', '48.2억', '64.1억', '27.1억',
              <DataLink key="a" href="/posts/withdrawal-comparison/data?start=1996-10" />],
            ['1997-06', '0.73억', '43.1억', '72.5억', '26.8억',
              <DataLink key="b" href="/posts/withdrawal-comparison/data?start=1997-06" />],
            ['1998-09', '8.04억', '63.7억', '201.4억', '29.3억',
              <DataLink key="c" href="/posts/withdrawal-comparison/data?start=1998-09" />],
          ]}
        />
        <P>
          1996–1997년 진입 시 A안은 최종 잔여자산이 1억 안팎으로 줄어듭니다.
          닷컴버블로 TQQQ 합성가격이 99% 이상 폭락하는 구간에서{' '}
          <strong className="text-gray-900 dark:text-white">주식을 그대로 보유</strong>하면서
          인출만 중단했기 때문입니다.
          반면 B안은 MA200 아래에서 전량 현금으로 전환하여 붕괴 구간을 피했습니다.
        </P>
        <P>
          A안이 인출 총액이 많아 보이지만, 이는 버블 정점에서 10억이 단기간에 수백억으로
          불어났다가 폭락하는 과정에서 이미 많이 인출했기 때문입니다.
          잔여 자산이 거의 소진된 상태라면 의미 있는 인출이라고 보기 어렵습니다.
        </P>

        <H3>버블 정점 진입 (2000년 초)</H3>
        <Table
          headers={['시작', 'A안 최종', 'A안 최솟값', 'B안 최종', 'B안 최솟값', '']}
          rows={[
            ['2000-03', '0.04억', '0.0016억', '파산', '0.0억',
              <DataLink key="a" href="/posts/withdrawal-comparison/data?start=2000-03" />],
            ['2001-01', '2.44억', '0.56억', '44.5억', '0.12억',
              <DataLink key="b" href="/posts/withdrawal-comparison/data?start=2001-01" />],
          ]}
        />
        <P>
          닷컴버블 정점(2000-03) 진입은 두 전략 모두 극도로 위험합니다.
          B안은 이 경우 파산(잔여자산 0)에 도달했습니다.
          MA200 이탈 → 현금 전환 후 재매수 시점에 여전히 하락이 이어졌기 때문입니다.
          A안은 극소의 잔여자산(400만원)으로 겨우 생존했습니다.
        </P>

        <H3>버블 이후 진입 (2003년)</H3>
        <Table
          headers={['시작', 'A안 최종', 'B안 최종', '']}
          rows={[
            ['2003-03', '198.7억', '440.0억',
              <DataLink key="a" href="/posts/withdrawal-comparison/data?start=2003-03" />],
            ['2003-09', '286.9억', '441.3억',
              <DataLink key="b" href="/posts/withdrawal-comparison/data?start=2003-09" />],
          ]}
        />
        <P>
          바닥 이후 진입하면 두 전략 모두 크게 성장합니다. B안이 더 우세합니다.
          MA200 필터 덕분에 2008년 금융위기 구간을 피하고, 회복 후 재매수하여 수익을 극대화합니다.
        </P>

        <H2>인터랙티브 차트</H2>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-8">
          <WithdrawalComparisonChart data={data} />
        </div>

        <H2>결론</H2>

        <Callout color="green">
          <strong>장기 중앙값 기준으로는 B안이 압도적 우세.</strong><br />
          하지만 <strong>닷컴버블 정점 진입 시에는 두 전략 모두 취약</strong>합니다.
          유일한 차이는 A안이 "주식을 계속 보유"하는 데 반해,
          B안은 "현금 전환 후 재매수 타이밍"이 결과를 좌우한다는 점입니다.
        </Callout>

        <ul className="list-none space-y-3 mb-8">
          {[
            'B안은 중앙값 최종자산이 203억으로 A안(12.7억)보다 월등히 높습니다. MA200 필터가 장기적으로 하락 구간을 효과적으로 회피합니다.',
            'A안은 인출 한도가 없어 포트폴리오가 클 때 더 많이 받아가지만, 하락장에서 주식을 그대로 보유하는 리스크를 집니다.',
            'B안의 생활비 캡(월 최대 1500만)은 자산 보존에 유리하지만, 포트폴리오가 작을 때 생활비가 부족할 수 있습니다.',
            '두 전략 모두 닷컴버블 정점 진입 코호트(2000년 초)에서 취약합니다. 이 구간은 어떤 전략도 완전한 보호가 어렵습니다.',
            '현실에서는 두 전략을 결합하는 것이 유리합니다: MA200 필터 + SP500 드로다운 보조 지표를 함께 활용.',
          ].map((item, i) => (
            <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300 text-sm">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* 구분선 */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-16 pt-8 flex items-center justify-between text-sm text-gray-400">
          <Link href="/posts" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            ← 글 목록
          </Link>
          <Link
            href="/posts/withdrawal-comparison/data"
            className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            전체 코호트 데이터 →
          </Link>
        </div>
      </main>
    </div>
  )
}
