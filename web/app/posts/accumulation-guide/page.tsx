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

export default function AccumulationGuidePage() {
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
          </div>
          <h1 className="text-3xl font-black leading-tight mb-4">
            적립식 방법론: 어떤 종목을, 얼마씩, 어떤 전략으로
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-01</span>
            {['적립식', 'A전략', 'B전략', 'C전략', 'TQQQ', '방법론'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <Callout color="blue">
          이 사이트의 모든 백테스트가 전제하는 적립식 설계의 뼈대다.
          각 설계 결정마다 <strong>왜 그렇게 했는지</strong>를 설명하고,
          그 결정을 뒷받침하는 분석 글로 연결한다.
          숫자를 보기 전에 이 글을 먼저 읽어야 결과가 의미 있게 보인다.
        </Callout>

        {/* ── 1. 왜 지수인가 ──────────────────────────────── */}
        <H2>1. 왜 지수를 사는가</H2>
        <P>
          개별 주식은 망한다. 인텔도, 노키아도, 시어스도 한때는 세상에서 가장 강한 기업이었다.
          지수는 망하지 않는다. 약한 기업은 빠지고 강한 기업이 들어오는 구조이기 때문이다.
          나스닥100은 미국 기술·성장 섹터 상위 100개 기업의 집합이다.
        </P>
        <P>
          레버리지 ETF는 이 지수의 <strong className="text-gray-900 dark:text-white">일일 수익률</strong>에 배수를 곱한다.
          하루 +1%이면 TQQQ는 +3%, 하루 −1%이면 −3%다.
          장기 우상향이라는 전제가 성립한다면, 레버리지가 클수록 장기 복리 수익도 커진다.
          단 변동성이 클수록 복리 수익은 산술 기대값보다 낮아진다(변동성 끌림).
          이 손해를 감수하고도 레버리지가 남는지를 과거 데이터로 검증하는 것이 이 사이트의 목적이다.
        </P>

        {/* ── 2. 합성가격 ──────────────────────────────────── */}
        <H2>2. 왜 1971년부터 테스트하는가 — 합성가격</H2>
        <P>
          TQQQ는 2010년에 출시됐다. 실제 거래 데이터만 쓰면 닷컴버블(2000년)이 빠진다.
          닷컴버블은 나스닥 −83%라는 역대 최악의 하락이었다.
          이를 테스트에서 빼면 방법론이 얼마나 험한 상황을 버티는지 알 수 없다.
        </P>
        <P>
          그래서 이 사이트는 NDX 일별 수익률에 레버리지를 곱한 <strong className="text-gray-900 dark:text-white">합성가격</strong>을 사용한다.
        </P>
        <FormulaBlock>
          합성가격₀ = 100<br />
          합성가격ₜ = 합성가격ₜ₋₁ × (1 + NDX 일수익률 × 레버리지)
        </FormulaBlock>
        <P>
          변동성 끌림은 이 누적 곱셈에 자동 반영된다. 단, 운용비용(TQQQ 0.88%/년)·스왑금리·추적오차는
          미반영이므로 실제 TQQQ 성과는 이론치보다 소폭 낮다.
        </P>

        <Callout color="yellow">
          <strong>NDX 데이터 스플라이스 보정.</strong> 1985-10-01에 원본 데이터에 −60% 급락처럼 보이는
          소스 전환 오류가 있다. 이 사이트는 해당 지점을 비율 보정해 연속 수익률로 변환한 뒤 사용한다.
        </Callout>

        <P>
          나스닥100 데이터가 1971년까지밖에 없어서 1929년 대공황을 직접 테스트할 수 없다.
          SP500과 NDX의 베타 회귀로 합성 pre-1971 NDX를 만들어 1929년도 검증했다.
        </P>
        <AnalysisLink
          href="/posts/synthetic-ndx-1929"
          title="1929년 대공황 시나리오는 TQQQ에서 얼마나 걸릴까"
          desc="SP500으로 합성한 가상 NDX로 1929년 진입 시나리오를 테스트. 최근 베타 기준 오히려 닷컴버블보다 빨리 끝난다."
        />

        {/* ── 3. 세 가지 전략 ──────────────────────────────── */}
        <H2>3. 세 가지 전략 — A / B / C</H2>
        <P>
          시드 유무와 목돈 크기에 따라 세 전략 중 하나를 고른다.
          목표금액은 10억 원이다. 인출 단계에서 포트폴리오의 1%/월이면 월 1,000만원이 나온다.
        </P>

        <H3>A전략 — 순수 적립, 시드 없음</H3>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 mb-6 text-sm space-y-2">
          <div className="flex gap-3">
            <span className="text-blue-500 dark:text-blue-400 font-mono shrink-0 w-12">방법</span>
            <span className="text-gray-600 dark:text-gray-300">매일 20만원씩 적립. 누적 투자금 2.5억 도달 시 추가 매수 중단.</span>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-500 dark:text-blue-400 font-mono shrink-0 w-12">이유</span>
            <span className="text-gray-600 dark:text-gray-300">
              2.5억까지만 원금을 넣고, 이후는 복리만으로 굴린다. 일 20만원 기준 약 1,250 거래일(5년)이면 한도 도달.
              총 투자원금을 제한함으로써 리스크를 통제한다.
            </span>
          </div>
        </div>

        <H3>B전략 — 거치 + 계속 적립</H3>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 mb-6 text-sm space-y-2">
          <div className="flex gap-3">
            <span className="text-emerald-600 dark:text-emerald-400 font-mono shrink-0 w-12">방법</span>
            <span className="text-gray-600 dark:text-gray-300">첫날 2.5억 거치 + 이후 매일 20만원 무한 적립.</span>
          </div>
          <div className="flex gap-3">
            <span className="text-emerald-600 dark:text-emerald-400 font-mono shrink-0 w-12">이유</span>
            <span className="text-gray-600 dark:text-gray-300">
              목돈이 있을 때 초반 복리 베이스를 크게 시작하면 달성 속도가 훨씬 빨라진다.
              A전략에 비해 중앙값 달성기간이 수년 단축된다.
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-500 dark:text-yellow-400 font-mono shrink-0 w-12">주의</span>
            <span className="text-gray-600 dark:text-gray-300">
              고점에 전액 거치하면 닷컴버블 같은 상황에서 최악이 길어진다.
              <strong className="text-gray-800 dark:text-gray-200"> 거치금은 3년(756거래일) 균등 분할 진입을 권장한다.</strong>
            </span>
          </div>
        </div>

        <AnalysisLink
          href="/posts/lump-sum-vs-split"
          title="거치금 2.5억, 한번에 넣을까 vs 3년에 나눠 넣을까"
          desc="668가지 시작 시점 백테스트. 3년 시간 분할이 TQQQ worst 케이스를 12.24년 → 8.82년으로 3.4년 단축. 왜 3년인지 데이터로 확인."
        />

        <H3>C전략 — 한도 없이 계속 적립</H3>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 mb-6 text-sm space-y-2">
          <div className="flex gap-3">
            <span className="text-purple-500 dark:text-purple-400 font-mono shrink-0 w-12">방법</span>
            <span className="text-gray-600 dark:text-gray-300">매일 20만원씩, 목표 달성까지 중단 없이 계속 적립.</span>
          </div>
          <div className="flex gap-3">
            <span className="text-purple-500 dark:text-purple-400 font-mono shrink-0 w-12">이유</span>
            <span className="text-gray-600 dark:text-gray-300">
              장기 하락장에서 꾸준한 매수로 평균단가를 낮춘다. 목돈이 없고 꾸준한 현금흐름만 있는 사람에게 적합.
              단, TQQQ 기준 worst(닷컴버블 1998-06 진입)는 약 13.7년으로 A전략보다 길다.
            </span>
          </div>
        </div>

        {/* ── 4. 종목 선택 ──────────────────────────────────── */}
        <H2>4. 종목 선택 — QQQ vs QLD vs TQQQ</H2>
        <P>
          세 종목 중 무엇을 선택할지는 백테스트 결과를 직접 보고 결정하길 권장한다.
          숫자만 보면 TQQQ가 항상 유리해 보이지만, worst 케이스의 고통은 숫자로 다 전달되지 않는다.
        </P>

        <div className="space-y-3 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs text-gray-400 dark:text-gray-600">1×</span>
              <span className="font-bold text-gray-900 dark:text-white">QQQ</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              변동성 끌림 없음. 달성 속도가 가장 느리지만 worst 케이스 소요기간도 가장 짧다.
              레버리지가 처음이라면 QQQ부터 시작하고 데이터를 직접 본 뒤 판단하라.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs text-gray-400 dark:text-gray-600">2×</span>
              <span className="font-bold text-gray-900 dark:text-white">QLD</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              속도와 리스크가 모두 중간. 3배 레버리지의 심리적 부담을 감당하기 어렵다면 현실적인 선택지.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs text-gray-400 dark:text-gray-600">3×</span>
              <span className="font-bold text-gray-900 dark:text-white">TQQQ</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              중앙값 달성 속도가 가장 빠르다. 하지만 닷컴버블 고점 진입 시 B전략 기준 약 12년,
              C전략 기준 약 14년을 버텨야 한다. 그 기간 동안 −90% 이상 구간을 지나칠 수 있다.
              TQQQ를 선택한다는 것은 이 시나리오를 받아들인다는 뜻이다.
            </p>
          </div>
        </div>

        <Callout color="yellow">
          <strong>운용비용 주의.</strong> TQQQ 연 운용보수 0.88%.
          이 사이트의 합성가격은 운용비용·스왑금리·추적오차를 반영하지 않는다.
          실제 TQQQ 성과는 이론치보다 소폭 낮다.
        </Callout>

        {/* ── 5. 코호트 방식 ──────────────────────────────── */}
        <H2>5. 어떻게 테스트하는가 — 코호트 방식</H2>
        <P>
          백테스트 결과를 "특정 시점 1개"로 판단하면 운에 좌우된다.
          이 사이트는 1971년부터 2026년까지 <strong className="text-gray-900 dark:text-white">매월 첫 거래일</strong>을 진입 시점으로 삼아
          가능한 모든 시작점(수백 개)을 전부 테스트한다. 이것을 코호트라고 부른다.
        </P>
        <P>
          평가 기준은 두 가지다.
        </P>
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400 font-mono shrink-0 w-28">완료율</span>
            <span className="text-gray-600 dark:text-gray-300">테스트 기간 내 목표 달성 비율. 100%가 아니면 데이터가 충분히 길지 않거나, 아직 진행 중인 코호트가 있다는 뜻.</span>
          </div>
          <div className="flex gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400 font-mono shrink-0 w-28">worst 소요기간</span>
            <span className="text-gray-600 dark:text-gray-300">모든 코호트 중 가장 오래 걸린 진입 시점의 달성 연수. 방법론 설계는 평균이 아닌 <strong className="text-gray-800 dark:text-gray-200">worst를 기준</strong>으로 한다. 내가 언제 시작할지 모르기 때문이다.</span>
          </div>
        </div>

        {/* ── 6. 실천 지침 ──────────────────────────────────── */}
        <H2>6. 실천 지침</H2>

        <H3>뉴스를 보지 않는다</H3>
        <P>
          백테스트 안에는 이미 모든 뉴스가 들어 있다. 전쟁, 인플레이션, 금리 인상, 테러, 팬데믹.
          나스닥100은 그 모든 것을 겪고도 우상향했다. 뉴스 때문에 매수를 멈추면
          worst 케이스를 자기 손으로 만드는 것이다.
        </P>

        <H3>절대 멈추지 않는다</H3>
        <P>
          TQQQ가 −50%든 −90%든 계속 산다. 오히려 이때 평균단가가 가장 빠르게 내려간다.
          닷컴버블에서도, 금융위기에서도, 매수를 멈추지 않은 코호트는 결국 달성했다.
          멈추는 순간 백테스트의 전제가 깨진다.
        </P>

        <H3>목표는 10억 기준 — 조정하려면 시뮬레이터에서</H3>
        <P>
          이 사이트의 모든 백테스트는 기본값 목표금액 10억 원, 일 적립액 20만원을 기준으로 한다.
          숫자를 바꾸면 소요기간도 달라지므로, 시뮬레이터에서 직접 입력해 확인하라.
        </P>

        {/* ── 다음 단계 ──────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">다음으로 읽을 글</p>
          <div className="space-y-3 mb-8">
            <AnalysisLink
              href="/posts/withdrawal-guide"
              title="[필독] 인출식 방법론: 10억 달성 후 어떻게 꺼내 쓰나"
              desc="적립이 끝난 뒤의 설계. 버퍼 계산, 월 1% 인출, 위기 대응까지 전체 인출 방법론."
            />
          </div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">설계 결정 분석 글</p>
          <div className="space-y-0">
            <AnalysisLink
              href="/posts/lump-sum-vs-split"
              title="거치금 2.5억, 한번에 넣을까 vs 3년에 나눠 넣을까"
              desc="668가지 시점 백테스트. B전략 거치금 진입 방식 설계의 근거."
            />
            <AnalysisLink
              href="/posts/synthetic-ndx-1929"
              title="1929년 대공황 시나리오는 TQQQ에서 얼마나 걸릴까"
              desc="합성 NDX로 1929년 포함 스트레스 테스트. worst 케이스가 닷컴버블인 이유."
            />
            <AnalysisLink
              href="/posts/withdrawal-strategy"
              title="인출 전략 설계기: 버블 케이스 재진입 방법 비교 (A vs B)"
              desc="10억 달성 직후 인출 방법론의 핵심 설계 결정 기록."
            />
          </div>
          <div className="mt-6">
            <Link
              href="/simulator"
              className="block bg-blue-600 hover:bg-blue-500 text-white text-center py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              시뮬레이터에서 내 숫자로 확인 →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
