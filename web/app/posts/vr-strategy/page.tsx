import Link from 'next/link'
import Header from '@/components/Header'
import VrHeatmap from './VrHeatmap'

function Tag({ children }: { children: string }) {
  return (
    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
      {children}
    </span>
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

function Callout({
  color = 'blue',
  children,
}: {
  color?: 'blue' | 'yellow' | 'red' | 'green' | 'purple'
  children: React.ReactNode
}) {
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

function ParamCard({
  name,
  range,
  desc,
  note,
}: {
  name: string
  range: string
  desc: string
  note?: string
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-3">
      <div className="flex items-start justify-between gap-4 mb-2">
        <span className="text-sm font-bold text-gray-900 dark:text-white">{name}</span>
        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {range}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
      {note && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 leading-relaxed">{note}</p>
      )}
    </div>
  )
}

function CompareRow({
  label,
  vr,
  s0,
  highlight = false,
}: {
  label: string
  vr: string
  s0: string
  highlight?: boolean
}) {
  return (
    <tr className={highlight ? 'bg-blue-50 dark:bg-blue-500/10' : 'border-b border-gray-100 dark:border-gray-800'}>
      <td className="py-2.5 px-4 text-sm text-gray-600 dark:text-gray-400">{label}</td>
      <td className="py-2.5 px-4 text-sm font-mono text-gray-700 dark:text-gray-300 text-right">{vr}</td>
      <td className="py-2.5 px-4 text-sm font-mono font-bold text-blue-700 dark:text-blue-300 text-right">{s0}</td>
    </tr>
  )
}

export default function VrStrategyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* 헤더 */}
        <div className="mb-12">
          <Link
            href="/posts"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6 inline-block"
          >
            ← 목록으로
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-500/30">
              비교 분석
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight mb-4">
            밸류리밸런싱 인출식 216가지 설정값 테스트
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
            G값 · Pool 비율 · 인출률 조합 — 어떤 조건에서도 인출이 끊기지 않는 설정은 없었다
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-02</span>
            {['인출식', '밸류리밸런싱', 'VR', 'EMA200', '백테스트'].map(t => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>

        <div className="border rounded-xl px-5 py-4 mb-8 text-sm leading-relaxed bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300">
          <strong className="text-gray-800 dark:text-gray-100">초기 연구 기록입니다.</strong>{' '}
          이 글의 수치는 운용보수만 반영(스왑금리·매도세 미반영)하고, 1971~2005년 시작 419가지 경우를 20년에서 자른 당시 계산입니다.
          비교 대상인 S0(나스닥100 200일 지수이동평균(EMA200) 기준 현금 전환 + 동적인출)는 당시 기준 전략이며, 지금 권장 전략은 T25입니다.
          현재 기준의 비교와 권장 전략은{' '}
          <Link href="/posts/withdrawal-full-period" className="underline">모든 인출 전략 전체 기간 비교</Link>와{' '}
          <Link href="/posts/withdrawal-guide" className="underline">인출식 방법론</Link>에 있습니다.
        </div>

        {/* 핵심 결론 */}
        <Callout color="red">
          <strong>핵심 결론: 생존율 100% 조합 없음</strong><br />
          G값(20~100) × Pool 비율(10~80%) × 인출률(0.5~1.5%) 216가지 조합 전부를 419개
          진입 시점으로 테스트했다. 어떤 설정에서도 20년 내내 인출이 한 번도 끊기지 않는
          조합이 없었다. 최선 조합(G=100, P=80%, 월 0.5%)도 인출 유지율 23.6%.
          반면 S0(EMA200 동적인출)는 419가지 경우 전부 생존율 100%.
        </Callout>

        {/* ──────────────────────────────────────── */}
        <H2>밸류리밸런싱(VR) 인출식이란?</H2>

        <P>
          라오어(이상우)가 개발한 투자 방법론 중 인출 단계에 적용하는 방식이다.
          자산을 <strong>V(밸류, 주식 목표금)</strong>와 <strong>P(풀, 현금 보유)</strong>로
          나눠 관리하며, 약 2주마다 한 번 리밸런싱하면서 Pool에서 생활비를 인출한다.
        </P>

        <FormulaBlock>
          <div className="mb-1 text-gray-500 dark:text-gray-500 text-xs">사이클마다 (2주 = 10 영업일):</div>
          <div>① 새 V = 현재 V + P ÷ G − 인출금</div>
          <div>② Pool에서 인출금 차감</div>
          <div>③ 밴드 재설정: 상단 = V × 1.15, 하단 = V × 0.85</div>
          <div>④ 2주간 매일 체크 → 상단 초과 시 매도(차액 Pool 편입), 하단 미만 시 매수</div>
        </FormulaBlock>

        <P>
          상승장에서 주가가 V의 상단(+15%)을 넘으면 차액을 매도해 Pool로 편입한다.
          반대로 하락 시에는 Pool로 주식을 사들여 V 수준을 유지한다.
          Pool은 생활비 인출의 원천이자 하락장 대응 자금이다.
        </P>

        {/* ──────────────────────────────────────── */}
        <H2>테스트한 설정값 3가지</H2>

        <ParamCard
          name="G (기울기)"
          range="20 ~ 100"
          desc="새 V를 얼마나 빠르게 올릴지 결정한다. G=20이면 사이클당 P÷20만큼 V가 오르고, G=100이면 P÷100만큼 오른다. G가 낮을수록 V가 빠르게 성장해 상단 밴드도 높아진다. 라오어 권장 최소값은 20."
          note="G가 낮으면 상단 밴드가 빠르게 올라가 매도가 잘 안 되고 → Pool 보충이 줄어들 수 있다. G가 높으면 V 성장이 느려 상단 밴드가 낮게 유지 → 매도가 더 자주 발생해 Pool이 보충될 여지가 있다."
        />
        <ParamCard
          name="초기 Pool 비율 (P)"
          range="10% ~ 80%"
          desc="전체 자산 10억 중 Pool(현금)이 차지하는 비율. P=20%면 Pool 2억, 주식 8억으로 시작. P가 높을수록 초기 인출 여유가 크지만, 주식 비중이 낮아 상승장 수익이 줄어든다."
          note="P=80%이면 Pool 8억, 주식 2억으로 시작. 초기 인출 여유는 크지만 주식 비중이 너무 낮아 상승 이익 실현이 어렵다."
        />
        <ParamCard
          name="월 인출률"
          range="0.5% ~ 1.5%"
          desc="초기 자산(10억) 대비 매월 인출하는 금액. 월 1%=1,000만원, 연 12% 인출이 라오어 권장 수준. 월 0.5%=500만원(연 6%), 월 1.5%=1,500만원(연 18%)도 테스트했다."
        />

        {/* ──────────────────────────────────────── */}
        <H2>설정값 탐색 — 인터랙티브 히트맵</H2>

        <P>
          아래 히트맵에서 직접 탐색할 수 있다. 인출률 탭을 선택하고 보고 싶은 지표를 고르면
          G(열) × Pool 비율(행) 격자에 값이 표시된다. 색상이 초록에 가까울수록 S0(EMA200 동적인출) 수준에 근접.
        </P>

        <VrHeatmap />

        {/* ──────────────────────────────────────── */}
        <H2>왜 어떤 조합에서도 생존율이 낮은가?</H2>

        <P>
          VR 인출식에서 Pool 소진을 막으려면 상승장에서 매도를 통해 Pool을 충분히 보충해야 한다.
          그런데 TQQQ 같은 고변동성 자산에서는 이 보충이 구조적으로 어렵다.
        </P>

        <H3>문제 1: V 상단이 매도를 막는다</H3>
        <P>
          사이클마다 V = V + P÷G − 인출금 공식으로 갱신된다. P가 크면(예: P=80%) P÷G도 커져서
          V가 빠르게 올라간다. V가 올라가면 상단 밴드(V×1.15)도 덩달아 올라가
          주가가 상단을 돌파하기 어려워진다. 매도가 발생하지 않으면 Pool은 인출로만 줄어든다.
        </P>

        <H3>문제 2: 한 번의 큰 하락이 치명적이다</H3>
        <P>
          닷컴버블(1999~2002)이나 금융위기(2007~2009)처럼 TQQQ가 90% 이상 폭락하는 구간에서는
          하락 시 매수를 반복하다 Pool이 빠르게 소진된다. 그 이후 상승장이 와도 주식 수량이
          적어서 상단 돌파가 어려워진다.
        </P>

        <H3>문제 3: 인출 자체가 Pool을 소모한다</H3>
        <P>
          월 1% 기준으로 10억의 1%=1,000만원을 매월 인출하면, Pool이 2억(P=20%)일 경우 약 20개월이면 소진된다.
          상승장 매도로 보충이 안 되면 이 속도를 늦출 수 없다.
          Pool을 80%로 키워도(P=80%, Pool=8억), 13년이면 바닥난다.
        </P>

        {/* ──────────────────────────────────────── */}
        <H2>S0(EMA200 동적인출)와 비교</H2>

        <P>
          같은 조건(초기 자산 10억, 시뮬레이션 기간 20년, 419개 진입 시점)에서 비교했다.
        </P>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                <th className="py-2.5 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">지표</th>
                <th className="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400 font-medium">VR 최선 조합</th>
                <th className="py-2.5 px-4 text-right text-blue-600 dark:text-blue-400 font-medium">S0 (EMA200 동적인출)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <CompareRow label="설정" vr="G=100, P=80%, 월 0.5%" s0="EMA200 15일 기준 + 동적인출" />
              <CompareRow label="인출 유지율" vr="23.6%" s0="100%" highlight />
              <CompareRow label="평균 인출 총액" vr="9억" s0="557억" highlight />
              <CompareRow label="중앙값 최종 자산" vr="22억" s0="829억" highlight />
              <CompareRow label="연평균 수익률" vr="6.9%" s0="24.2%" />
              <CompareRow label="진입 시점 수" vr="419" s0="419" />
            </tbody>
          </table>
        </div>

        <Callout color="yellow">
          <strong>인출 총액 격차가 가장 크다</strong><br />
          VR 최선 조합은 월 500만원(연 6%)씩 20년 인출하면 최대 12억이다.
          하지만 실제로는 Pool 소진으로 인출이 중단되어 평균 9억만 받는다.
          S0는 동적 인출률로 557억을 받으면서 자산도 829억으로 불어난다.
        </Callout>

        {/* ──────────────────────────────────────── */}
        <H2>결론</H2>

        <P>
          밸류리밸런싱 인출식은 변동성이 낮은 일반 주식이나 채권에는 잘 작동할 수 있다.
          하지만 TQQQ 같은 3배 레버리지 ETF에서는 구조적인 어려움이 있다.
        </P>

        <P>
          V 상단 메커니즘이 상승장 이익 실현을 제한하고, 큰 하락에서 Pool이 빠르게 소진되기 때문이다.
          216가지 조합 전부를 테스트했지만 20년 내내 인출이 끊기지 않는 조합은 없었다.
        </P>

        <P>
          TQQQ 인출식에서는 시장 상황에 따라 100% 현금 전환과 재진입을 반복하는
          신호 기반 전략이 훨씬 안정적이고 수익도 높다. 이후 전체 기간·실제 비용으로 다시 비교해
          지금은 T25(1년 최고가 대비 25% 하락 시 현금 전환)를 권장한다.
        </P>

        <Callout color="green">
          <strong>데이터 직접 탐색</strong><br />
          위 히트맵에서 인출률 탭과 지표를 바꿔가며 216가지 조합을 직접 확인할 수 있다.
          어떤 설정이 가장 &ldquo;덜 나쁜가&rdquo;에 관심 있다면 인출 유지율 + 인출 총액 탭을 비교해보면 된다.
        </Callout>

        {/* 관련 포스트 */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-bold tracking-widest text-gray-400 dark:text-gray-600 uppercase mb-4">관련 글</p>
          <div className="space-y-2">
            {[
              { href: '/posts/withdrawal-guide', title: '인출식 방법론: 10억 달성 후 어떻게 꺼내 쓰나', desc: '권장 전략 T25 + 상한 없는 동적 인출의 전체 설계' },
              { href: '/posts/withdrawal-full-period', title: '모든 인출 전략을 1971년부터 오늘까지', desc: '16가지 인출 전략을 실제 비용으로 끝까지 비교' },
              { href: '/posts/withdrawal-new-ideas', title: '인출 전략 새 아이디어 8가지 테스트', desc: 'RSI 조기재진입이 3,231억으로 현재 최선' },
              { href: '/posts/withdrawal-new-ideas2', title: '더 나을 줄 알았던 전략 3가지', desc: '트레일링 스탑 · 단계적 현금화 · 레버리지 하향' },
            ].map(({ href, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
              >
                <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                  </div>
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
