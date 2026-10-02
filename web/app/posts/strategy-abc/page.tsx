import Link from 'next/link'
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
function Callout({ color = 'blue', children }: { color?: 'blue' | 'yellow' | 'green' | 'red'; children: React.ReactNode }) {
  const s = {
    blue:  'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow:'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    green: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
    red:   'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200',
  }
  return <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${s[color]}`}>{children}</div>
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {headers.map(h => (
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

function DataLink({ inst }: { inst: string }) {
  return (
    <Link
      href={`/posts/strategy-abc/data?inst=${inst}`}
      className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap"
    >
      데이터 →
    </Link>
  )
}

export default function StrategyAbcPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />
      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* 헤더 */}
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">
            ← 목록으로
          </Link>
          <h1 className="text-3xl font-black leading-tight mb-4">
            A·B·C 전략 비교: 거치금이 없다면, 있다면, 멈춘다면
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-02</span>
            {['A전략', 'B전략', 'C전략', 'TQQQ', '비교', '백테스트'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <Callout color="blue">
          <strong>백테스트 조건:</strong> 일 20만원 적립 · 거치금(B/C) 2.5억 · 목표 10억 · 1971~2025년 전체 코호트
        </Callout>

        {/* 1. 세 전략 */}
        <H2>1. 세 가지 전략</H2>
        <P>같은 목표(10억), 같은 종목(TQQQ), 같은 일 투자액(20만원). 차이는 딱 하나 — <strong className="text-gray-900 dark:text-white">어떻게 사느냐</strong>다.</P>

        <div className="space-y-4 mb-8">
          <div className="border-l-4 border-emerald-400 pl-4 py-1">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">A전략 — 계속 적립</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">매일 20만원, 한도 없이 목표 달성까지 계속 산다. 가장 단순하고 가장 JUST KEEP BUYING에 충실한 전략.</p>
          </div>
          <div className="border-l-4 border-yellow-400 pl-4 py-1">
            <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400 mb-1">B전략 — 매입액 한도</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">매일 20만원, 누적 투자액 2.5억 도달 시 추가 매수 중단. 이후 보유만. 추가 투자 여력이 없는 경우를 상정한 전략.</p>
          </div>
          <div className="border-l-4 border-blue-400 pl-4 py-1">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">C전략 — 3년 분할 거치</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">매일 20만원 + 거치금 2.5억을 36개월에 걸쳐 월 균등 분할 투입. 목돈이 있고 한 번에 넣기 두려운 경우.</p>
          </div>
        </div>

        {/* 2. TQQQ 결과 */}
        <H2>2. TQQQ(나스닥100 3배) 백테스트 결과</H2>

        <Callout color="green">
          <strong>핵심 요약 (TQQQ 기준):</strong> C전략이 압도적으로 빠르다. 중간값 기준 A전략의 절반도 안 걸린다.
          B전략은 A전략과 비슷해 보이지만, 최악의 경우 A보다 4.8년 더 걸린다.
        </Callout>

        <Table
          headers={['전략', '완료율', '중간값', '평균', '최장(worst)', '데이터']}
          rows={[
            [
              <span key="a" className="font-semibold text-emerald-600 dark:text-emerald-400">A전략 (계속 적립)</span>,
              '92.4%', '5.32년', '5.84년', '13.74년',
              <DataLink key="a" inst="ndx3x" />,
            ],
            [
              <span key="b" className="font-semibold text-yellow-600 dark:text-yellow-400">B전략 (매입액 한도)</span>,
              '92.4%', '5.33년', '6.18년', <span key="bw" className="text-red-500 font-semibold">18.55년</span>,
              <DataLink key="b" inst="ndx3x" />,
            ],
            [
              <span key="c" className="font-semibold text-blue-600 dark:text-blue-400">C전략 (3년 분할 거치)</span>,
              <span key="cr" className="font-semibold">94.8%</span>,
              <span key="cm" className="font-semibold">3.23년</span>,
              '3.64년', '8.82년',
              <DataLink key="c" inst="ndx3x" />,
            ],
          ]}
        />

        <H3>B전략의 함정: 중간값은 비슷하지만 최장이 다르다</H3>
        <P>
          완료율(92.4%)과 중간값(5.32 vs 5.33년)만 보면 A전략과 B전략이 사실상 동일해 보인다.
          하지만 최장 소요기간이 <strong className="text-gray-900 dark:text-white">13.74년 vs 18.55년</strong>으로 4.8년 차이가 난다.
        </P>
        <P>
          이유는 단순하다. A전략은 시장이 하락할수록 더 많은 주식을 싸게 살 수 있다.
          B전략은 2.5억 한도에 도달하는 순간 매수를 멈추기 때문에, 그 이후 시장이 무너지면
          바닥에서 추가 매수할 기회를 잃는다. <strong className="text-gray-900 dark:text-white">닷컴버블 직전에 한도를 채운 코호트</strong>가
          가장 오래 걸린 케이스다.
        </P>

        <H3>C전략이 빠른 이유: 초기 자본의 복리 효과</H3>
        <P>
          C전략은 시작부터 매달 거치금(2.5억 ÷ 36 ≈ 694만원)이 추가로 들어온다.
          일 20만원만으로 시작하는 A전략보다 초기 주식 수가 훨씬 빠르게 쌓인다.
          이 초기 주식들이 이후 상승장에서 복리로 불어나기 때문에 소요기간이 절반 이하로 줄어든다.
        </P>

        {/* 3. 전 종목 비교 */}
        <H2>3. 전 종목 비교</H2>
        <P>레버리지가 낮을수록 B전략의 불리함이 더 커진다.</P>

        <Table
          headers={['종목', '전략', '완료율', '중간값', '최장']}
          rows={[
            ['TQQQ (3x)', 'A', '92.4%', '5.32년', '13.74년'],
            ['', 'B', '92.4%', '5.33년', <span key="1" className="text-red-500">18.55년</span>],
            ['', 'C', <span key="2" className="font-semibold">94.8%</span>, <span key="3" className="font-semibold">3.23년</span>, '8.82년'],
            ['QLD (2x)', 'A', '88.9%', '6.54년', '13.37년'],
            ['', 'B', '88.5%', '6.87년', <span key="4" className="text-red-500">19.58년</span>],
            ['', 'C', <span key="5" className="font-semibold">93.9%</span>, <span key="6" className="font-semibold">4.05년</span>, '12.38년'],
            ['QQQ (1x)', 'A', '85.2%', '9.10년', '14.34년'],
            ['', 'B', <span key="7" className="text-red-500">82.2%</span>, '11.37년', <span key="8" className="text-red-500">21.04년</span>],
            ['', 'C', <span key="9" className="font-semibold">90.7%</span>, <span key="10" className="font-semibold">5.86년</span>, '12.31년'],
            ['VOO (SP500)', 'A', '90.2%', '11.73년', '17.34년'],
            ['', 'B', <span key="11" className="text-red-500">85.9%</span>, '19.73년', <span key="12" className="text-red-500">31.00년</span>],
            ['', 'C', <span key="13" className="font-semibold">93.7%</span>, <span key="14" className="font-semibold">7.75년</span>, '16.31년'],
          ]}
        />

        <Callout color="red">
          <strong>VOO B전략의 최장 31년:</strong> S&P500을 매수하다 2.5억에서 멈추고 보유만 하면,
          닷컴버블 진입 시 31년이 걸린다. A전략(17.34년)보다 13.6년 더 오래 걸리는 셈이다.
          레버리지가 낮을수록 "계속 사는" 효과가 더 크다.
        </Callout>

        {/* 4. 결론 */}
        <H2>4. 어떤 전략을 선택해야 하나</H2>

        <div className="space-y-4 mb-8">
          <div className="border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-5 py-4 bg-emerald-50/50 dark:bg-emerald-900/10">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">거치금이 없다면 → A전략</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">매일 20만원, 멈추지 말고 계속. 단순하고 강력하다. JUST KEEP BUYING.</p>
          </div>
          <div className="border border-blue-200 dark:border-blue-800/40 rounded-xl px-5 py-4 bg-blue-50/50 dark:bg-blue-900/10">
            <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">거치금이 있다면 → C전략</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">목돈을 3년에 나눠 넣으면서 매일 20만원도 계속. 소요기간이 절반 가까이 줄어든다.</p>
          </div>
          <div className="border border-yellow-200 dark:border-yellow-800/40 rounded-xl px-5 py-4 bg-yellow-50/50 dark:bg-yellow-900/10">
            <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 mb-1">B전략은 언제?</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">추가 투자 여력이 진짜 없는 경우에만 유효하다. 소득이 있다면 A전략이 항상 낫거나 같다. 특히 레버리지가 낮을수록 B전략의 불이익이 크다.</p>
          </div>
        </div>

        <P>
          결국 이 분석이 보여주는 건 하나다.
          <strong className="text-gray-900 dark:text-white"> 멈추지 않는 게 중요하다.</strong> 하락장에 싸게 살 기회를 포기하는 순간,
          worst case가 급격히 나빠진다. 거치금 여부와 무관하게 "계속 사는" 행동만으로도 리스크가 크게 줄어든다.
        </P>

        {/* 관련 링크 */}
        <div className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">관련 글</p>
          <div className="space-y-2">
            {[
              { href: '/posts/lump-sum-vs-split', title: '거치금 2.5억, 한번에 넣을까 vs 3년에 나눠 넣을까', desc: 'C전략의 거치 방식을 더 깊이 분석' },
              { href: '/posts/accumulation-guide', title: '적립식 방법론 전체 설계도', desc: '종목 선택부터 전략까지' },
            ].map(({ href, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
              >
                <span className="text-blue-400 text-sm mt-0.5 shrink-0">→</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/simulator"
              className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-center py-4 rounded-xl text-sm font-semibold transition-colors"
            >
              내 숫자로 시뮬레이터 돌려보기 →
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
