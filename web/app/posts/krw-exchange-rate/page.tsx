import Link from 'next/link'
import Header from '@/components/Header'

function Tag({ children, color = 'gray' }: { children: string; color?: 'gray' | 'blue' | 'purple' }) {
  const styles = {
    gray:   'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
    blue:   'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[color]}`}>{children}</span>
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

function Table({ headers, rows, note }: {
  headers: string[]
  rows: (string | React.ReactNode)[][]
  note?: string
}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {headers.map((h, i) => (
              <th key={i} className="py-2 px-4 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-4 text-gray-700 dark:text-gray-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-1">{note}</p>}
    </div>
  )
}

export default function KrwExchangeRatePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" />

      <main className="max-w-3xl mx-auto px-6 py-16">

        <Link href="/posts"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-8 inline-block">
          ← 전체 글 목록
        </Link>

        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <Tag color="blue">적립식</Tag>
            <Tag color="purple">인출식</Tag>
            <Tag>환율</Tag>
            <Tag>원화</Tag>
            <Tag>백테스트</Tag>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white leading-tight">
            원화로 투자하면 달러 기준 백테스트와<br />결과가 달라지나
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-13</p>
        </div>

        <Callout color="yellow">
          <strong>핵심 요약</strong><br />
          441개 진입 시점을 분석한 결과 98.7%에서 달러 기준과 원화 기준의 차이는 1년 미만이었다.
          평소에는 환율 효과가 거의 없다는 뜻이다.
          단, 1998년 외환위기처럼 원/달러 환율이 역사적 고점일 때 투자를 시작하면
          이후 원화가 강세로 전환되면서 원화 기준 목표 달성에 13년이 더 걸린 사례도 있다.
          인출 단계에서는 큰 위기 때 원화 낙폭이 달러 낙폭보다 3~4%p 작다는 완충 효과가 있다.
        </Callout>

        {/* 1. 왜 이 질문인가 */}
        <H2>이 사이트의 모든 백테스트는 달러 기준이다</H2>

        <P>
          이 사이트의 적립·인출 시뮬레이션은 TQQQ의 달러 합성가격을 기반으로 한다.
          목표도 달러 가격 기준 10억 원어치, 생활비도 달러 가격 기준 포트폴리오의 일정 비율이다.
        </P>

        <P>
          그런데 한국 투자자라면 이런 의문이 생긴다.
          "나는 매달 원화를 달러로 바꿔서 산다. 환율이 오르내리면 결과가 달라지지 않나?"
          달러가 강할 때(원화 약세)는 같은 돈으로 더 적은 TQQQ를 살 수 있고,
          원화 약세가 풀리면 내 원화 환산 자산은 오히려 줄어들기도 한다.
        </P>

        <P>
          결론부터 말하면 <strong>대부분의 경우 차이가 거의 없고, 특수한 예외가 하나 있다.</strong>
        </P>

        {/* 2. 두 가지 계산 방식 */}
        <H2>두 가지 계산 방식</H2>

        <P>
          같은 1990년 이후 441개 진입 시점을 두 가지 방식으로 계산해 비교했다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6 space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">달러 기준</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              매일 원화 20만원을 <strong>달러 TQQQ 가격으로 나눠서</strong> 매수.
              환율을 1:1로 고정했다고 보면 된다.
              목표: 달러 TQQQ 가격 × 보유 주수 = 10억.
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">원화 기준</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              매일 원화 20만원을 <strong>그날 환율을 반영한 원화 TQQQ 가격으로 나눠서</strong> 매수.
              원화 TQQQ 가격 = 달러 합성가격 × 당일 환율.
              목표: 원화 TQQQ 가격 × 보유 주수 = 10억.
            </div>
          </div>
        </div>

        <P>
          환율 데이터: FRED(미국 연방준비제도 경제 데이터)에서 원/달러 일별 환율 수집.
          분석 기간은 1990년 1월부터 2026년 9월까지. 1997년 이전은 관리변동환율 구간이다.
        </P>

        {/* 3. 적립식 결과 */}
        <H2>적립식: 441개 진입 시점 비교 결과</H2>

        <Table
          headers={['구분', '달러 기준', '원화 기준']}
          rows={[
            ['완료 케이스', '372개', '381개'],
            ['중간 소요기간', '5.62년', '5.56년'],
            ['가장 짧은 경우', '1.98년', '2.15년'],
            ['가장 긴 경우', '14.37년', '15.17년'],
          ]}
          note="1990-01 이후 441개 진입 시점. 일 20만원 적립, 목표 원화 10억. 스왑금리 + 운용보수 반영."
        />

        <P>
          중간값 차이는 <strong>0.06년(약 22일)</strong>이다.
          원화 기준이 약간 빠른데, 이는 1990년 이후 전반적으로 원화가 약세였기 때문이다
          (환율 상승 = 원화 약세 = 기존 보유 자산의 원화 가치 상승).
        </P>

        {/* 차이 분포 */}
        <H3>차이는 대부분 1년 안에 수렴한다</H3>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: '1년 이내 차이', value: '98.7%', sub: '367개', color: 'text-green-600 dark:text-green-400' },
            { label: '원화 1년+ 빠름', value: '0.8%', sub: '3개', color: 'text-blue-600 dark:text-blue-400' },
            { label: '달러 1년+ 빠름', value: '0.5%', sub: '2개', color: 'text-orange-600 dark:text-orange-400' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</div>
            </div>
          ))}
        </div>

        <P>
          달러 기준이 1년 이상 빠른 케이스는 2개뿐이다.
          바로 <strong>1998년 3월(1,553원)과 4월(1,392원)</strong>에 시작한 경우다.
          원화 기준이 1년 이상 빠른 케이스 3개는 2010년대 중반 시작으로 빠른 TQQQ 상승기와 맞물린다.
        </P>

        {/* 4. 외환위기 케이스 */}
        <H2>외환위기 고점에서 시작하면 13년이 더 걸렸다</H2>

        <P>
          1998년 3월 2일에 적립을 시작했다고 가정해 보자.
          이 날의 원/달러 환율은 <strong>1,553원</strong>으로 외환위기 당시 역사적 최고점 부근이었다.
        </P>

        <Table
          headers={['방식', '10억 달성 소요기간', '달성 시점']}
          rows={[
            [
              '달러 기준',
              <strong key="usd" className="text-blue-600 dark:text-blue-400">2.02년</strong>,
              '2000-03',
            ],
            [
              '원화 기준',
              <strong key="krw" className="text-red-600 dark:text-red-400">15.17년</strong>,
              '2013-05',
            ],
          ]}
          note="시작 환율 1,553원. 이후 환율이 1,000~1,200원대로 안정되면서 원화 기준 투자자에게 불리하게 작용."
        />

        <P>
          왜 이런 차이가 생길까?
          원화 기준 시뮬레이션에서 원화 포트폴리오 가치는 <strong>달러 TQQQ 가격 × 보유주수 × 현재 환율</strong>이다.
          1553원에서 1100원으로 환율이 내려오면, 같은 달러 자산이 원화로는 29% 줄어 보인다.
          TQQQ가 올라도 그 효과가 환율 강세에 일부 상쇄되는 것이다.
        </P>

        <Callout color="red">
          <strong>이 케이스가 주는 교훈:</strong> 원/달러 환율이 역사적으로 높은 수준(1,400~1,600원)일 때 시작하면,
          이후 원화가 강세로 전환될 경우 원화 기준 목표 달성이 크게 늦어질 수 있다.
          반대로 환율이 낮을 때(700~900원) 시작하고 이후 원화가 약세가 되면 원화 기준이 유리해진다.
        </Callout>

        <H3>환율 구간별 평균 차이</H3>

        <Table
          headers={['시작 환율 구간', '진입 시점 수', '평균 차이 (원화 − 달러)', '해석']}
          rows={[
            ['700원 미만', '3개', '−0.00년', '거의 동일'],
            ['700~1,000원', '119개', '−0.09년', '원화 약간 빠름'],
            ['1,000~1,300원', '227개', '+0.05년', '사실상 동일'],
            [
              '1,300~1,600원',
              '22개',
              <strong key="x" className="text-red-600 dark:text-red-400">+1.67년</strong>,
              '달러 약 1.7년 빠름',
            ],
          ]}
          note="양수 = 달러 기준이 더 빠름. 완료된 케이스만 포함."
        />

        <P>
          환율 1,300원 이상 구간 22개의 평균 차이가 1.67년인데,
          이 중 1998년 두 케이스(13년 차이)가 평균을 끌어올리고 있다.
          나머지 20개의 차이는 훨씬 작다.
          대부분의 투자자가 해당하는 1,000~1,300원 구간은 평균 0.05년(18일) 차이다.
        </P>

        {/* 5. 인출식 */}
        <H2>인출식: 낙폭 완충 효과</H2>

        <P>
          인출 단계에서는 환율이 결과를 바꾸지 않는다.
          달러 기준과 원화 기준 시뮬레이션의 IRR·최종자산이 수학적으로 동일하기 때문이다.
          이유는 단순하다: 생활비 = 포트폴리오 × 인출률인데,
          원화 포트 = 달러 포트 × 환율이고 생활비도 원화 기준으로 같은 비율을 꺼내면
          환율이 분자·분모에서 상쇄된다.
        </P>

        <P>
          그러나 환율이 <strong>낙폭 완충</strong> 역할을 하는 건 사실이다.
          위기 때 원/달러 환율이 오르면(원화 약세), 달러로는 90% 빠진 자산이
          원화로는 조금 덜 빠져 보인다.
        </P>

        <Table
          headers={['위기', '달러 낙폭', '원화 낙폭', '완충 효과', '환율 변화']}
          rows={[
            ['닷컴버블 (2000~2002)', '−100.0%', '−99.9%', '+0.1%p', '1,120 → 1,241원'],
            ['금융위기 (2007~2009)', '−95.2%', '−91.8%', <strong key="gc" className="text-green-600 dark:text-green-400">+3.4%p</strong>, '903 → 1,541원'],
            ['코로나 급락 (2020-02~03)', '−70.0%', '−68.5%', '+1.5%p', '1,191 → 1,251원'],
            ['2022 하락 (2021~2022)', '−81.9%', '−80.6%', '+1.3%p', '1,185 → 1,268원'],
          ]}
          note="낙폭은 각 위기의 시작 시점 대비 저점까지 합성 TQQQ 기준. with_costs 모드."
        />

        <P>
          금융위기 때 완충 효과가 3.4%p로 가장 크다.
          이는 환율이 903원 → 1,541원으로 70.7% 급등했기 때문이다.
          닷컴버블은 이미 낙폭이 -100%에 가까워 완충의 의미가 없고,
          2022년은 환율 변화(+7%)가 크지 않아 완충도 미미하다.
        </P>

        <Callout color="green">
          실전에서의 의미: 위기가 와서 원화 자산이 -91.8% 빠졌을 때,
          "달러로는 -95.2%지만 원화로는 -91.8%"라는 사실이 심리적 안정에 약간의 도움이 된다.
          전략을 바꿀 이유는 없지만, 원화로 체감하는 낙폭이 달러보다 작다는 건 사실이다.
        </Callout>

        {/* 6. 결론 */}
        <H2>결론: 달러 기준 백테스트를 그대로 믿어도 된다</H2>

        <div className="space-y-3 mb-8">
          {[
            '적립식에서 98.7%의 진입 시점은 달러 기준과 원화 기준이 1년 이내 차이다',
            '1997~1998년 외환위기 고점(환율 1,400~1,553원)에 시작하면 이후 원화 강세로 인해 원화 기준이 13년 더 걸린 사례가 있다',
            '현재 환율(약 1,350~1,400원)이 고점권인 만큼 이 점을 인식해 두는 것이 좋다',
            '인출식에서는 달러/원화 기준이 수학적으로 동일하다 — IRR과 최종자산이 완전히 같다',
            '단, 위기 때 원화 낙폭이 달러보다 소폭 작다 — 금융위기 기준 3.4%p 완충',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="mt-0.5 shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Callout color="blue">
          <strong>실용적 조언:</strong> 지금 환율이 1,350원이라고 해서 적립을 미룰 필요는 없다.
          역사적으로 가장 극단적인 1,553원에서 시작해도 원화 기준으로 15년이면 10억에 도달했다.
          달러 기준 백테스트(중간 5.62년, 최장 14.37년)와 크게 다르지 않은 범위다.
          적립을 지속하는 것이 타이밍을 재는 것보다 낫다.
        </Callout>

        {/* 관련 글 */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-10 mt-10">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">관련 글</p>
          <div className="space-y-2">
            {[
              { href: '/posts/accumulation-guide', title: '적립식 방법론', desc: 'TQQQ 장기 적립의 전체 설계도 — 매일 자동 적립이 핵심' },
              { href: '/posts/real-vs-synthetic', title: '백테스트의 TQQQ는 실제 TQQQ를 얼마나 잘 따라갔나', desc: '2010년 이후 실제 vs 합성 TQQQ 직접 비교' },
              { href: '/posts/withdrawal-guide', title: '인출식 방법론', desc: '25% 룰 전략 전체 설계도' },
            ].map(({ href, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
              >
                <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
