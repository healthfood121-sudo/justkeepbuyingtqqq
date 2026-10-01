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
          </div>
          <h1 className="text-3xl font-black leading-tight mb-4">
            인출식 방법론: 10억 달성 후 어떻게 꺼내 쓰나
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-01</span>
            {['인출식', '버퍼', 'FIRE', 'TQQQ', '방법론'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <Callout color="blue">
          적립식보다 인출식이 더 어렵다. 10억이 있어도 잘못 꺼내면 바닥 난다.
          이 글은 각 설계 결정마다 <strong>왜 그렇게 했는지</strong>를 설명하고,
          그 결정을 검증한 분석 글로 연결한다.
          인출을 시작하기 전에 이 글을 반드시 읽어야 한다.
        </Callout>

        {/* ── 1. 왜 인출식이 더 어려운가 ─────────────────────── */}
        <H2>1. 왜 인출식이 더 어려운가</H2>
        <P>
          적립식은 시장이 내려갈수록 유리하다. 같은 돈으로 더 많이 살 수 있기 때문이다.
          인출식은 반대다. 시장이 내려갈 때 팔면, 포트폴리오가 줄어든 상태에서 더 큰 비율을 팔게 된다.
          이것을 <strong className="text-gray-900 dark:text-white">수익률 순서 리스크(Sequence of Returns Risk)</strong>라고 한다.
        </P>
        <P>
          해결책은 두 가지다. 첫째, 폭락장에서 팔지 않을 수 있는 <strong className="text-gray-900 dark:text-white">현금 버퍼</strong>를 준비한다.
          둘째, 특정 기준이 충족되면 인출을 잠시 멈추고 추가 매수로 전환한다.
          이 두 가지를 조합한 것이 이 방법론의 인출 설계다.
        </P>

        {/* ── 2. 달성 전 확인: 버블 케이스 ──────────────────── */}
        <H2>2. 달성 직후 첫 번째 확인: 버블인가</H2>
        <P>
          10억을 달성했더라도 바로 인출을 시작하면 안 되는 경우가 있다.
          <strong className="text-gray-900 dark:text-white"> 너무 빨리 달성했다면</strong> — 즉 버블 상황에서 고점에 도달했다면,
          다음 달 포트폴리오가 5억, 3억으로 급락할 수 있다.
        </P>
        <P>
          기준은 <strong className="text-gray-900 dark:text-white">적립 소요기간 1.5년 미만</strong>이다.
          너무 빨리 달성했다 = 시장이 비정상적으로 과열됐을 가능성이 높다.
          이 경우 인출을 시작하지 않고, 달성한 금액을 전량 DCA로 재진입한다.
        </P>

        <Callout color="yellow">
          <strong>버블 케이스 재진입 방법은 두 가지다.</strong><br />
          <span className="font-mono">Method A</span> — 2년 대기 후 DCA 시작<br />
          <span className="font-mono">Method B</span> — 즉시 DCA 시작<br />
          어떤 방법이 더 나은지는 백테스트 결과로 비교했다.
        </Callout>

        <AnalysisLink
          href="/posts/withdrawal-strategy"
          title="인출 전략 설계기: 버블 케이스 재진입 방법 비교 (A vs B)"
          desc="버블 케이스를 2년 대기(Method A) vs 즉시 DCA(Method B)로 처리할 때 643가지 코호트에서 어떤 차이가 나는지 분석."
        />

        {/* ── 3. 버퍼 현금 계산 ────────────────────────────── */}
        <H2>3. 버퍼 현금 계산</H2>
        <P>
          버블 케이스가 아니라면 인출을 시작할 수 있다. 단, 먼저 <strong className="text-gray-900 dark:text-white">버퍼 현금</strong>을 확보해야 한다.
          버퍼는 포트폴리오 폭락 시 팔지 않고 생활비를 충당하기 위한 현금이다.
        </P>
        <P>
          버퍼 기간은 적립 소요기간에 따라 결정된다. 빨리 달성할수록 버블 가능성이 높으므로 버퍼를 더 쌓는다.
        </P>
        <FormulaBlock>
          버퍼 기간 = max(0, 기준연수 − 적립 소요기간)<br />
          버퍼 금액 = 버퍼 기간 × 일적립액 × 252
        </FormulaBlock>

        <div className="space-y-2 mb-6 text-sm">
          <div className="flex gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400 font-mono shrink-0 w-28">기준연수 (C전략)</span>
            <span className="text-gray-600 dark:text-gray-300">
              <strong className="text-gray-800 dark:text-gray-200">13년.</strong> C전략 TQQQ worst 소요기간이 약 12.24년이므로 올림.
            </span>
          </div>
          <div className="flex gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400 font-mono shrink-0 w-28">기준연수 (A전략)</span>
            <span className="text-gray-600 dark:text-gray-300">
              <strong className="text-gray-800 dark:text-gray-200">14년.</strong> A전략 TQQQ worst 소요기간이 약 13.74년이므로 올림.
            </span>
          </div>
        </div>

        <P>
          기준연수는 백테스트에서 나온 worst 소요기간에서 도출된다.
          즉, &quot;역사상 가장 최악의 타이밍에 시작해도 이 기간 안에는 달성했다&quot;는 보수적 상한선이 버퍼의 근거다.
        </P>

        {/* ── 4. 인출 시작 ──────────────────────────────────── */}
        <H2>4. 인출 시작 — 월 1%</H2>
        <P>
          버퍼를 확보했으면 인출을 시작한다. 인출률은 <strong className="text-gray-900 dark:text-white">포트폴리오의 1%/월</strong>이다.
          10억이라면 월 1,000만원, 8억이 되면 월 800만원으로 자동 조정된다.
        </P>

        <Callout color="blue">
          <strong>왜 고정 금액이 아닌 비율 인출인가?</strong><br />
          고정 금액 인출은 포트폴리오가 작아질수록 소진 속도가 빨라진다.
          비율 인출은 포트폴리오가 줄어들면 인출액도 줄어들어 소진 위험이 낮아진다.
          단, 생활비가 비율에 연동되므로 포트가 줄면 생활 수준도 같이 낮아진다는 점을 감수해야 한다.
        </Callout>

        {/* ── 5. SP500 −20% 대응 ────────────────────────────── */}
        <H2>5. 조정장 대응 — SP500 −20%</H2>
        <StepCard num="조건" color="yellow" title="S&P500이 고점 대비 −20% 하락">
          공식적인 하락장(bear market) 진입 기준. TQQQ는 이 시점에 이미 −50% 이상일 수 있다.
        </StepCard>
        <StepCard num="행동" color="blue" title="인출 중단 + 1년간 일적립액으로 매수">
          인출을 멈추고 현금 버퍼에서 생활비를 충당한다. 동시에 1년(252거래일)간 일 20만원씩 추가 매수한다.
          하락장 저점에서 물량을 쌓는 것이 목적이다.
        </StepCard>
        <StepCard num="재개" color="blue" title="포트폴리오 8억 회복 시 인출 재시작">
          10억이 아닌 8억 기준으로 재시작하는 이유는, 10억 기준으로 기다리면 복구에 너무 오래 걸릴 수 있기 때문이다.
          8억에서 월 1%면 월 800만원. 생활 수준을 조금 낮추는 대신 인출을 재개한다.
        </StepCard>

        {/* ── 6. SP500 −50% 대응 ────────────────────────────── */}
        <H2>6. 위기장 대응 — SP500 −50%</H2>
        <P>
          SP500 −50%는 공황 수준이다. 1929년, 닷컴버블, 2008년 금융위기가 여기에 해당한다.
          이 때 TQQQ는 −90% 이상이다.
        </P>
        <StepCard num="조건" color="red" title="S&P500이 고점 대비 −50% 하락">
          역사적으로 약 3~4회 발생. 회복까지 수년이 걸린다.
        </StepCard>
        <StepCard num="행동" color="red" title="버퍼 현금을 14년에 걸쳐 분산 매수">
          남아 있는 현금 버퍼를 기준연수(14년)로 나누어 매일 균등하게 매수한다.
          바닥이 어딘지 모르므로 한번에 사지 않고 시간을 분산한다.
          이렇게 하면 공황 저점에서 대규모 물량을 쌓을 수 있다.
        </StepCard>
        <StepCard num="재개" color="blue" title="포트폴리오 8억 회복 시 인출 재시작">
          −20% 대응과 동일한 재개 기준을 적용한다.
        </StepCard>

        <Callout color="yellow">
          <strong>왜 −20%와 −50%를 따로 구분하는가?</strong><br />
          −20%는 흔한 조정이다. 매번 버퍼를 전부 소진하면 진짜 위기(−50%)에 버퍼가 없다.
          −20% 때는 적립 매수만, −50% 때는 버퍼 전체를 동원하는 방식으로 대응 강도를 구분한다.
        </Callout>

        {/* ── 7. 전체 흐름 요약 ─────────────────────────────── */}
        <H2>7. 전체 흐름 요약</H2>
        <div className="space-y-2 mb-6">
          {[
            { step: '①', label: '10억 달성', desc: '적립 소요기간 확인' },
            { step: '②', label: '소요기간 < 1.5년?', desc: '버블 케이스 → 재진입 (Method A or B)' },
            { step: '③', label: '버퍼 현금 계산', desc: 'max(0, 기준연수 − 소요기간) × 일적립액 × 252' },
            { step: '④', label: '월 1% 인출 시작', desc: '조정장은 그냥 맞고 간다' },
            { step: '⑤', label: 'SP500 −20% 발생', desc: '인출 중단 + 1년간 일 20만원 매수 → 8억 회복 시 재개' },
            { step: '⑥', label: 'SP500 −50% 발생', desc: '버퍼를 14년으로 나눠 매일 분산 매수 → 8억 회복 시 재개' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flex gap-3 text-sm">
              <span className="text-blue-500 dark:text-blue-400 font-mono shrink-0 w-6">{step}</span>
              <span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{label}</span>
                <span className="text-gray-500 dark:text-gray-400"> — {desc}</span>
              </span>
            </div>
          ))}
        </div>

        {/* ── 다음 단계 ──────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">설계 결정 분석 글</p>
          <div className="space-y-0">
            <AnalysisLink
              href="/posts/withdrawal-strategy"
              title="인출 전략 설계기: 버블 케이스 재진입 방법 비교 (A vs B)"
              desc="버블 케이스 처리 — 2년 대기(Method A) vs 즉시 DCA(Method B). 643가지 코호트 비교."
            />
            <AnalysisLink
              href="/posts/lump-sum-vs-split"
              title="거치금 2.5억, 한번에 넣을까 vs 3년에 나눠 넣을까"
              desc="인출 버퍼 기준연수의 근거가 된 C전략 worst 케이스(12.24년) 분석."
            />
            <AnalysisLink
              href="/posts/synthetic-ndx-1929"
              title="1929년 대공황 시나리오는 TQQQ에서 얼마나 걸릴까"
              desc="역대 최악의 시나리오에서 이 인출 방법론이 얼마나 버티는지 확인."
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
