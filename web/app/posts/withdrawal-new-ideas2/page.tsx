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

function DataLink() {
  return (
    <Link
      href="/posts/withdrawal-new-ideas2/data"
      className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap"
    >
      데이터 →
    </Link>
  )
}

export default function WithdrawalNewIdeas2Page() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6 inline-block">
            ← 목록으로
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/30">
              새 실험
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight mb-4">
            더 나을 줄 알았던 전략 3가지를 테스트해봤다
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
            트레일링 스탑 / 단계적 현금화 / 자산 규모별 레버리지 하향
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-02</span>
            {['인출식', 'EMA200', '트레일링스탑', '백테스트'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <Callout color="yellow">
          <strong>핵심 결론: 세 가지 모두 기존 최선보다 나쁘다</strong><br />
          직관적으로 합리적인 아이디어였지만 418가지 진입 시점 시뮬레이션 결과, 현재 최선(D10GK 3,918억)은
          물론 기준선(EMA200 15일 전략, 1,176억)도 넘지 못했다.
          특히 단계적 현금화는 예상을 뒤엎고 134억으로 가장 낮았다.
        </Callout>

        {/* ── 1. 배경 ─────────────────────────────────────────── */}
        <H2>1. 왜 또 새 아이디어를 테스트했나</H2>
        <P>
          지금까지 인출 전략 연구에서 가장 좋은 결과가 나온 것은
          &ldquo;나스닥100이 EMA200(지수이동평균 200일) 아래에서 14일 RSI가 30 미만으로 떨어질 때,
          그리고 현재가가 EMA200보다 10% 이상 낮을 때 즉시 재매수&rdquo; 방식이었다.
          여기에 Guyton-Klinger 인출 규칙을 결합한 D10GK가 연평균 수익률 32.4%, 중앙값 3,918억이었다.
        </P>
        <P>
          좋은 결과가 나왔으면 거기서 멈춰도 된다. 하지만 직관적으로 합리적인 아이디어 세 가지가
          아직 테스트되지 않았다. &ldquo;고점 추적 이탈 시 즉시 판다&rdquo;,
          &ldquo;한 번에 전량 현금화하는 대신 조금씩 단계적으로 조정한다&rdquo;,
          &ldquo;자산이 충분히 쌓이면 레버리지를 낮춰 안전하게 간다&rdquo;는 아이디어들이다.
          어떤 결과가 나올지 확인해봤다.
        </P>

        {/* ── 2. 세 가지 아이디어 ──────────────────────────────── */}
        <H2>2. 세 가지 아이디어</H2>

        <div className="space-y-4 mb-8">
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm font-bold text-gray-400">T15·T20·T25</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">트레일링 스탑</span>
            </div>
            <P>
              52주(약 1년) 동안의 최고점 대비 일정 비율 이상 하락하면 즉시 전량 매도한다.
              기존 전략(EMA200 아래 15거래일 연속)은 신호가 느리다는 약점이 있었다.
              고점 추적 방식은 이보다 빠르게 탈출 신호를 낼 수 있어서 버블 정점 근처
              진입자에게 유리할 것으로 예상했다.
            </P>
            <FormulaBlock>
              T15: 52주 최고점 대비 −15% 이하로 떨어지면 전량 매도<br />
              T20: 52주 최고점 대비 −20% 이하로 떨어지면 전량 매도<br />
              T25: 52주 최고점 대비 −25% 이하로 떨어지면 전량 매도<br />
              재매수: 공통으로 EMA200 위 15거래일 연속 (기존과 동일)
            </FormulaBlock>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm font-bold text-gray-400">GRAD</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">단계적 현금화</span>
            </div>
            <P>
              기존 전략은 신호가 나오는 순간 전량을 한꺼번에 팔고 전량을 한꺼번에 산다.
              이 방식은 타이밍 실수의 폭이 크다. 대신 나스닥100이 EMA200보다
              얼마나 떨어졌는지에 따라 조금씩 단계적으로 현금 비율을 늘리면 어떨까?
            </P>
            <FormulaBlock>
              EMA200 대비 −5% 이내:  TQQQ 100% 유지<br />
              EMA200 대비 −5~−10%:  TQQQ 67%, 현금 33%<br />
              EMA200 대비 −10~−15%: TQQQ 33%, 현금 67%<br />
              EMA200 대비 −15% 이하: 완전 현금 전환<br />
              재매수: EMA200 위 15거래일 연속 → 즉시 전량 재투자
            </FormulaBlock>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm font-bold text-gray-400">DLEV</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">자산 규모별 레버리지 하향</span>
            </div>
            <P>
              자산이 50억이 넘으면 이미 목표를 5배 이상 달성한 상태다.
              더 벌려는 욕심 대신 잃지 않는 것을 우선해야 하지 않을까?
              자산 규모가 커질수록 3배 레버리지를 줄이고 안전한 1배(나스닥100)로 비중을 옮기는 방식이다.
            </P>
            <FormulaBlock>
              자산 50억 미만: TQQQ 100% (3배 레버리지 유지)<br />
              자산 50~200억:  TQQQ 50% + QQQ 50% (평균 2배)<br />
              자산 200억 이상: QQQ 100% (1배로 완전 전환)<br />
              월 1회 비율 점검, 5% 이상 차이 시 재조정
            </FormulaBlock>
          </div>
        </div>

        {/* ── 3. 결과 ─────────────────────────────────────────── */}
        <H2>3. 결과 (418가지 진입 시점, 초기 10억, 20년)</H2>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">전략별 요약</span>
          <DataLink />
        </div>

        <Table
          headers={['전략', '설명', '생존율', '중앙값', '연평균 수익률', '거래 횟수']}
          rows={[
            [
              <strong key="d10gk" className="text-green-600 dark:text-green-400">★ D10GK</strong>,
              '기존 최선 (RSI<30+이격도<−10%+GK)',
              '100%',
              <strong key="d10gkv" className="text-green-600 dark:text-green-400">3,741억</strong>,
              '32.1%',
              '48회',
            ],
            ['S0', '기준선 (EMA200 15일)', '100%', '1,109억', '25.7%', '21회'],
            ['T25', '트레일링 스탑 −25%', '100%', '1,064억', '25.8%', <strong key="t25t">12회</strong>],
            ['T20', '트레일링 스탑 −20%', '100%', '610억', '22.5%', '22회'],
            ['T15', '트레일링 스탑 −15%', '100%', '572억', '22.9%', '40회'],
            ['DLEV', '자산 규모별 레버리지 하향', '100%', '474억', '21.2%', '35회'],
            [
              <span key="grad" className="text-red-500">GRAD</span>,
              '단계적 현금화',
              '100%',
              <span key="gradv" className="text-red-500 font-semibold">131억</span>,
              '13.9%',
              '54회',
            ],
          ]}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          668가지 진입 시점 기준 (20년 완료 428개 + 진행 중 240개). 중앙값은 완료 428개 기준.
        </p>

        <P>
          모든 전략이 생존율 100%로 안정적이다. 하지만 중앙값 기준으로는
          D10GK는 물론 기준선(1,176억)조차 넘은 전략이 없다.
          특히 단계적 현금화(GRAD, 134억)는 기준선의 11% 수준으로 예상을 훨씬 밑돌았다.
        </P>

        {/* ── 4. 단계적 현금화 ─────────────────────────────────── */}
        <H2>4. 단계적 현금화가 왜 이렇게 나쁜가</H2>
        <P>
          직관적으로 단계적 현금화는 합리적으로 보인다.
          &ldquo;전량을 한꺼번에 팔았다가 다시 사는 대신, 조금씩 조정하면 타이밍 실수를 줄일 수 있다&rdquo;는 논리다.
          하지만 실제 결과는 반대였다. 이유가 무엇인지 분석해봤다.
        </P>

        <H3>문제 1 — &ldquo;조금씩 파는&rdquo; 것 자체가 더 많이 손해볼 때 행동을 느리게 만든다</H3>
        <P>
          EMA200보다 −5% 하락 시 33%만 현금화하는 것은, 다시 말해 아직 67%가 TQQQ에 남아 있다는 뜻이다.
          그 뒤 시장이 계속 떨어지면 남은 67%가 3배 레버리지로 손실을 쌓는다.
          기존 전략이 &ldquo;EMA200 아래 15일 연속&rdquo;에 전량 매도하는 건 느리게 보여도,
          일단 신호가 나면 확실하게 빠져나온다. 단계적으로는 확실한 탈출이 없다.
        </P>

        <H3>문제 2 — &ldquo;조금씩 사는&rdquo; 기회를 놓친다</H3>
        <P>
          GRAD에서 재매수 시점은 &ldquo;EMA200 위 15거래일 연속&rdquo;으로 기존과 동일하다.
          하지만 그 전에 이격도가 −10%에서 −5%로 개선되면 자동으로 일부를 다시 사게 된다.
          이것이 문제다. 아직 EMA200 아래에 있는데도 33%를 다시 TQQQ로 전환하는 것은
          &ldquo;바닥인 줄 알고 들어갔다가 추가 하락에 당하는&rdquo; 패턴이다.
        </P>

        <H3>문제 3 — 54회 거래가 수수료를 갉아먹는다</H3>
        <P>
          EMA200과의 거리가 구간 경계를 오락가락할 때마다 거래가 발생한다.
          평균 54회로 기준선(21회)의 2.5배다. 거래 수수료 0.07%가 반복적으로 누적된다.
          TQQQ처럼 복리 효과가 강한 자산에서 수수료 누적은 치명적이다.
        </P>

        <Callout color="red">
          <strong>GRAD의 핵심 문제: &ldquo;조금씩&rdquo;이 두 가지를 모두 망친다</strong><br />
          하락 시: 손실을 천천히 키운다 (빠른 탈출 실패)<br />
          반등 시: EMA200 아래에서 섣불리 재진입한다 (조기 진입 실패)<br />
          결과적으로 이진 전환(전량 매도 → 전량 매수)이 단계적 전환보다 더 깔끔하게 작동한다.
        </Callout>

        {/* ── 5. 트레일링 스탑 ──────────────────────────────────── */}
        <H2>5. 트레일링 스탑: 빠른 탈출의 장단점</H2>
        <P>
          T25(−25%)는 중앙값 1,110억으로 기준선(1,176억)에 가장 근접했다.
          그런데 거래 횟수가 12회로 7가지 전략 중 가장 적다. 무슨 의미인가?
        </P>

        <H3>T25는 사실 기준선과 거의 같이 행동한다</H3>
        <P>
          나스닥100이 52주 고점 대비 −25% 하락한다는 것은 상당히 큰 하락이다.
          대부분의 경우 EMA200 15일 신호와 거의 같은 시점에 신호가 발생한다.
          그래서 거래 횟수도 비슷하고, 결과도 기준선과 비슷하다.
          다만 엄밀히 판정 방식이 달라서 일부 진입 시점에서 차이가 난다.
        </P>

        <H3>T15·T20는 왜 더 나쁜가</H3>
        <P>
          −15%, −20%로 기준을 낮추면 신호가 더 자주 발생한다.
          T15는 40회, T20은 22회로 기준선(21회)보다 잦다.
          문제는 TQQQ 환경에서 잦은 탈출·재진입이 복리 손실로 이어진다는 점이다.
          자주 빠져나올수록 반등 초기를 놓치고, 자주 들어올수록 반등 실패 시 손실이 쌓인다.
        </P>

        <H3>흥미로운 예외: 2003년 3월 진입</H3>
        <P>
          닷컴버블이 붕괴하고 바닥에서 막 올라오기 시작하던 2003년 3월에 시작한 경우를 보면,
          T20가 322억으로 기존 최선 D10GK(231억)보다 높았다.
        </P>

        <Table
          headers={['전략', '2003-03 진입 시 20년 후', '특징']}
          rows={[
            ['T20', <strong key="t20v" className="text-blue-600 dark:text-blue-400">322억</strong>, '닷컴 이후 하락 재개 시 빠른 탈출'],
            ['S0', '252억', '기준선'],
            ['T25', '225억', ''],
            [<strong key="d10gk2" className="text-green-600 dark:text-green-400">D10GK</strong>, '231억', '2003-03이 D10GK의 유일한 약점'],
            ['T15', '162억', '너무 잦은 진입·탈출'],
          ]}
        />

        <P>
          닷컴버블 이후 시장은 반등과 재하락을 반복했다.
          RSI 신호(D10GK)는 이 반등 때마다 재진입하다가 추가 하락에 당했다.
          반면 T20는 고점 대비 −20% 기준을 쓰기 때문에, 반등이 작을 때는 신호가 발생하지 않는다.
          &ldquo;충분히 올라야만 재매수한다&rdquo;는 EMA200 15일 조건과의 결합이 이 특정 구간에서 D10GK보다 유리하게 작동했다.
          다만 이것은 특수한 경우이고, 전체 668가지 진입 시점에서는 T20가 기준선보다 낮다.
        </P>

        <H3>반대 사례: 2009년 3월 (금융위기 바닥)</H3>
        <P>
          2009년 3월에 시작한 경우는 정반대 결과가 나왔다.
          금융위기 바닥에서 시작하면 이후 10년 이상 상승장이 이어지는데,
          이 구간에서 T25가 2,675억으로 D10GK(1,588억)보다 68% 앞섰다.
        </P>

        <Table
          headers={['전략', '2009-03 진입 시 결과', '특징']}
          rows={[
            ['T25', <strong key="t25v09" className="text-blue-600 dark:text-blue-400">2,675억</strong>, '상승장에서 오래 보유, 12회 거래'],
            ['D10GK', '1,588억', 'RSI 신호로 중간 탈출·재진입 반복'],
            ['S0', '1,435억', '기준선'],
            ['T20', '1,319억', ''],
            ['T15', '950억', '잦은 거래로 손실'],
          ]}
        />

        <P>
          T25는 52주 고점 대비 −25% 하락 시에만 매도한다.
          금융위기 이후 장기 상승장에서는 52주 고점이 꾸준히 올라가기 때문에
          −25% 신호가 거의 발생하지 않는다. 결과적으로 20년간 단 12회만 거래하면서
          전체 상승을 최대한 흡수했다.
          D10GK는 RSI 과매도 신호에 반응해 중간 조정 때마다 탈출·재진입을 반복(약 48회)하는데,
          장기 상승장에서는 이 과정의 마찰 비용이 쌓인다.
        </P>

        {/* ── 6. 자산 연동 레버리지 ───────────────────────────── */}
        <H2>6. 자산 규모별 레버리지 하향은 왜 역효과인가</H2>
        <P>
          자산이 50억을 넘으면 TQQQ 50%만 유지하고 나머지 50%는 나스닥100(1배)로 전환하는 전략이다.
          &ldquo;이미 충분히 이겼으니 잃지 말자&rdquo;는 원칙은 일상 재정 계획에서는 옳다.
          그런데 왜 TQQQ 환경에서는 역효과가 났을까?
        </P>

        <H3>이유 1 — 50억이 되는 시점이 상승장 한가운데다</H3>
        <P>
          자산이 10억에서 50억으로 5배 성장하려면 보통 상승장이 길게 이어지는 구간이다.
          그 시점에서 레버리지를 절반으로 줄이면, 남은 상승장의 절반만 3배로 누릴 수 있다.
          예를 들어 1996년에 시작한 경우, 1999~2000년 닷컴버블 막바지의 폭등 구간에서
          이미 &ldquo;200억 이상&rdquo; 기준에 걸려 QQQ만 보유하게 된다.
          S0가 1,892억인데 DLEV는 726억으로, 상승장 막바지 수익을 크게 놓쳤다.
        </P>

        <H3>이유 2 — 레버리지 하향이 하락 방어를 보장하지 않는다</H3>
        <P>
          레버리지를 줄여도 하락 탈출 신호(EMA200 15일)는 동일하게 적용된다.
          탈출 직전에 TQQQ 50%+QQQ 50%를 보유하든, 전량 TQQQ를 보유하든
          신호가 나면 전액 현금으로 전환하는 건 똑같다.
          하락 방어 효과는 없으면서 상승 참여만 줄어드는 셈이다.
        </P>

        <Table
          headers={['진입 시점', 'S0 (기준선)', 'DLEV (레버리지 하향)', '차이']}
          rows={[
            ['1996-10 (닷컴 버블 전)', '1,892억', '726억', '−62%'],
            ['1999-03 (버블 상승 중)', '180억', '314억', '+75%'],
            ['2000-03 (버블 정점)', '22억', '25억', '+14%'],
            ['2003-03 (버블 붕괴 후)', '252억', '210억', '−17%'],
            ['2009-03 (금융위기 바닥)', '1,435억', '425억', '−70%'],
          ]}
        />

        <P>
          흥미롭게도 DLEV는 1999-03처럼 이미 레버리지가 낮아진 상태(자산 50억 이상)로 버블 정점을 맞이한
          경우에는 오히려 유리했다. 50억 이상이면 QQQ 위주라서 폭락 충격이 줄고,
          이후 반등을 안정적으로 탈 수 있었다.
          하지만 전체 418가지 진입 시점으로 보면 이런 경우가 소수여서 중앙값이 낮게 나왔다.
        </P>

        {/* ── 7. 종합 비교 ──────────────────────────────────────── */}
        <H2>7. 진입 시점별 최선 전략은 다르다</H2>
        <P>
          어떤 하나의 전략이 모든 진입 시점에서 최선인 경우는 없다.
          D10GK가 전체 중앙값에서는 압도적이지만 2003-03처럼 장기 하락 직후 진입 시점에서는
          기준선보다 약하다. T20는 역으로 그 구간에서 강하다.
        </P>

        <Callout color="blue">
          <strong>언제 어떤 전략이 유리한가</strong><br />
          <br />
          상승 추세 중 단기 급락: D10GK가 강함 (RSI 과매도 바닥을 빠르게 잡음)<br />
          버블 붕괴 이후 저점 진입: T20가 강함 (충분히 회복될 때까지 기다렸다가 진입)<br />
          긴 상승 막바지 진입: DLEV가 부분적으로 유리 (고점 폭락 충격 축소)
        </Callout>

        <P>
          문제는 실제로 지금 어느 국면인지 알 수 없다는 것이다.
          &ldquo;닷컴버블 직후 저점인지, 아니면 일시적 조정인지&rdquo;를 사전에 알고 전략을 선택할 수 없다.
          모든 진입 시점을 합산했을 때 D10GK가 가장 좋았다는 것이 지금까지의 결론이다.
        </P>

        {/* ── 8. 결론 ─────────────────────────────────────────── */}
        <H2>8. 결론</H2>

        <Callout color="purple">
          <strong>D10GK가 여전히 최선</strong><br />
          트레일링 스탑, 단계적 현금화, 자산 규모별 레버리지 하향 세 가지를 추가 검증했으나
          418가지 진입 시점 중앙값 기준으로 기존 최선(D10GK 3,918억)은 물론
          기준선(1,176억)도 넘지 못했다.
          탈출·재진입 신호는 이진 방식(전량 현금 ↔ 전량 투자)이 단계적 방식보다 강하고,
          레버리지는 자산이 커져도 줄이는 것이 이득이 아니었다.
        </Callout>

        <ul className="list-none space-y-3 mb-8">
          {[
            { q: '확인된 것', a: 'EMA200·RSI 기반 이진 신호가 단계적 현금화보다 강하다. 자산 규모별 레버리지 자동 하향은 상승장 수익을 깎는 부작용이 더 크다.' },
            { q: 'T25의 의의', a: '거래 12회로 가장 단순. 장기 상승장 초입 진입 시(2009-03 기준 2,675억) D10GK(1,588억)를 크게 앞서는 강점. 반면 닷컴버블 등 상승장 중반 이후 진입 시에는 기준선 이하.' },
            { q: '아직 열린 질문', a: '2003-03처럼 대형 하락 직후 진입과, 2009-03처럼 상승장 초입 진입 두 경우를 모두 잘 처리하는 전략 조합 탐색 여지 있음.' },
          ].map(({ q, a }) => (
            <li key={q} className="border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a}</p>
            </li>
          ))}
        </ul>

        {/* ── 하단 링크 ────────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">관련 분석 글</p>
          <AnalysisLink
            href="/posts/withdrawal-new-ideas"
            title="인출 전략 새 아이디어 8가지를 테스트해봤다"
            desc="RSI 조기 재진입(D10GK)이 기준선 대비 3배 이상 우세한 근거와 과최적화 검증."
          />
          <AnalysisLink
            href="/posts/withdrawal-guide"
            title="인출식 방법론: 10억 달성 후 어떻게 꺼내 쓰나"
            desc="현재 최선 후보(EMA200 15일 + 동적인출)의 설계 근거."
          />
          <AnalysisLink
            href="/posts/withdrawal-new-ideas2/data"
            title="전체 진입 시점별 데이터 →"
            desc="418가지 진입 시점별 7개 전략 결과를 모두 볼 수 있는 데이터 뷰어."
          />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/posts/withdrawal-new-ideas"
              className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors text-center"
            >
              <div className="text-xs text-gray-400 dark:text-gray-500 font-bold mb-1">이전</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">← 새 아이디어 8가지 실험</div>
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
