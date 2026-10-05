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

function DataLink({ label = '데이터 →' }: { label?: string }) {
  return (
    <Link
      href="/posts/withdrawal-new-ideas/data"
      className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap"
    >
      {label}
    </Link>
  )
}

export default function WithdrawalNewIdeasPage() {
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
            인출 전략 새 아이디어 8가지를 테스트해봤다
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-01</span>
            {['RSI', '인출식', 'EMA200', 'Guyton-Klinger', 'DCA', '백테스트'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <LegacyResearchNote />

        <Callout color="green">
          <strong>핵심 발견: RSI 조기 재진입이 압도적으로 우세</strong><br />
          418가지 시작 시점 기준 중앙값 <strong>3,232억</strong> (현재 최선 EMA200-15일 대비 +175%). 생존율 100%.
          RSI 14일 지수가 30 미만으로 떨어질 때 EMA200 조건 전이라도 즉시 재매수하는 방식이 검증됐다.
        </Callout>

        {/* ── 1. 왜 새 아이디어를 테스트했나 ─────────────────── */}
        <H2>1. 기존 연구의 한계</H2>
        <P>
          기존 그리드 서치(95개 조합)는 EMA/SMA × 연속일 × 인출률 구간을 탐색했지만,
          신호 구조 자체는 바꾸지 않았다. 항상 "NDX가 이동평균 아래에서 N일 연속이면 현금 전환,
          위에서 N일 연속이면 재매수"라는 단순 이진 로직이었다.
        </P>
        <P>
          이번에는 그 로직 바깥을 테스트했다. 재진입 방식, 인출률 조정 규칙, 레버리지 단계 전환 등
          8가지 독립 아이디어를 현재 최선(S0)과 나란히 비교했다.
        </P>

        {/* ── 2. 테스트 방법 ───────────────────────────────── */}
        <H2>2. 테스트 설정</H2>
        <P>
          모든 전략을 동일한 418개 시작 시점(1985~2005년 매월 시작, 20년 시뮬레이션)에 적용했다.
          초기 투자금 10억, NDX 3배(TQQQ 모사, 연 수수료 0.88%), 외화RP 이자(연방기금금리 −0.4%),
          양도세 22%(연 250만 공제), 거래 수수료 0.07%로 동일하게 적용했다.
          기준선(S0)은 EMA200 연속 15일 + 동적 인출률 0.3/0.5/0.7%다.
        </P>

        {/* ── 3. 전략 목록 ─────────────────────────────────── */}
        <H2>3. 8가지 아이디어 요약</H2>

        <div className="space-y-3 mb-8">
          {[
            { code: 'S1', label: '골든/데스크로스', desc: 'EMA50이 EMA200을 상향 돌파 → 매수, 하향 돌파 → 매도. 연속일 필터 없이 교차 자체를 신호로 쓴다.' },
            { code: 'S2', label: '분할재진입 3개월', desc: '매수 신호 후 전액을 즉시 투자하지 않고 3개월에 걸쳐 1/3씩 나눠서 매수. 고점 재진입 리스크를 줄이는 것이 목적.' },
            { code: 'S3', label: '분할재진입 6개월', desc: '같은 DCA 아이디어를 6개월로 늘린 버전.' },
            { code: 'S4', label: 'Guyton-Klinger', desc: '초기 인출액 대비 현재 인출액이 120% 초과 시 20% 감액, 80% 미만 시 10% 증액. 수익률 음수 연도는 동결. 학계 검증 방법론.' },
            { code: 'S5', label: '변동성 기반 인출', desc: '30일 실현 변동성이 역사적 평균 대비 1.5배 이상이면 인출률 30% 감소, 0.7배 미만이면 20% 증가.' },
            { code: 'S6', label: '동적 레버리지', desc: 'EMA200 대비 +5% 이상이면 TQQQ(3배), 미만이면 QQQ(1배) 보유. 경계 근접 시 자동으로 레버리지를 줄인다.' },
            { code: 'S7', label: 'RSI 조기 재진입', desc: '현금 보유 중 RSI(14일)가 30 미만으로 떨어지면, EMA200 15일 필터를 기다리지 않고 즉시 재매수. 과매도 바닥을 빠르게 잡는 것이 목적.' },
            { code: 'S8', label: 'Floor 보장형', desc: '자산이 작아도 최소 500만/월을 보장해서 인출한다. 생활비 하한선을 없애지 않는다는 원칙.' },
          ].map(({ code, label, desc }) => (
            <div key={code} className="flex gap-3 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
              <span className="font-mono text-sm font-bold text-gray-400 dark:text-gray-500 shrink-0 mt-0.5 w-6">{code}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── 4. 결과 ──────────────────────────────────────── */}
        <H2>4. 결과 (418가지 시작 시점, 초기 10억, 20년)</H2>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">전략별 요약</span>
          <DataLink />
        </div>

        <Table
          headers={['전략', '설명', '생존율', '중앙값', '연평균 수익률', '거래수']}
          rows={[
            [
              <strong key="s7n" className="text-purple-600 dark:text-purple-400">★ S7</strong>,
              'RSI 조기 재진입',
              '100%',
              <strong key="s7v" className="text-purple-600 dark:text-purple-400">3,232억</strong>,
              <strong key="s7c" className="text-purple-600 dark:text-purple-400">30.2%</strong>,
              '57회',
            ],
            ['S4', 'Guyton-Klinger', '100%', '1,269억', '26.7%', '21회'],
            ['S0', '현재 최선 (기준선)', '100%', '1,176억', '26.0%', '21회'],
            ['S5', '변동성 조정 인출', '100%', '1,171억', '25.9%', '21회'],
            ['S8', 'Floor 보장형', '97.1%', '1,123억', '25.5%', '20회'],
            ['S2', '분할재진입 3개월', '100%', '684억', '22.6%', '41회'],
            ['S1', '골든/데스크로스', '100%', '646억', '22.5%', '22회'],
            ['S3', '분할재진입 6개월', '100%', '341억', '18.6%', '68회'],
            ['S6', '동적 레버리지 TQQQ↔QQQ', '100%', '215억', '18.1%', '229회'],
          ]}
        />

        <P>
          중앙값 기준으로 S7이 S0보다 <strong className="text-gray-900 dark:text-white">2.75배</strong> 앞선다.
          반면 분할재진입·골든크로스·동적레버리지는 기준선보다 크게 뒤처진다.
          같은 EMA200 신호를 쓰면서 인출률만 조정한 S4·S5는 기준선과 거의 비슷하다.
        </P>

        {/* ── 5. RSI 조기 재진입 ────────────────────────────── */}
        <H2>5. RSI 조기 재진입: 왜 이렇게 좋은가</H2>

        <FormulaBlock>
          기존 S0: NDX {'>'} EMA200이 15거래일 연속 → 재매수<br />
          S7 추가:  현금 보유 중 RSI(14일) {'<'} 30 → 즉시 재매수 (EMA200 조건 무시)
        </FormulaBlock>

        <P>
          RSI 14일이 30 미만이라는 것은 최근 2주 동안 하락일이 압도적으로 많았다는 뜻이다.
          통계적으로 이 구간은 과매도 상태로, 단기 반등 확률이 높다.
          S0에서는 이 반등을 모두 놓쳤다. 현금 전환 후 15일을 기다리는 사이
          가격이 다시 EMA200 위로 올라가면, 이미 상당한 반등을 놓친 후에야 재진입하기 때문이다.
        </P>
        <P>
          S7은 RSI 과매도 신호를 추가로 감지해 하락 중에도 즉시 재진입한다.
          만약 반등이 지속되면 그대로 보유하다가 상승 추세를 타게 된다.
          반등이 지속되지 않고 다시 하락하면, EMA200 15일 조건에 걸려 다시 현금 전환한다.
          이 "적극적 바닥 매수 + 하락 추세 재인식" 구조가 거래 횟수를 57회(S0 대비 2.7배)로 늘리면서도
          전체 수익률을 끌어올린다.
        </P>

        <H3>주요 시나리오 비교</H3>
        <Table
          headers={['진입 시점', '상황', 'S0 (현재 최선)', 'S7 (RSI 재진입)']}
          rows={[
            ['1996-10', '닷컴버블 직전',  '1,892억', '2,840억 (+50%)'],
            ['1999-03', '버블 상승 중',   '180억',   '381억 (+112%)'],
            ['2000-03', '버블 정점',      '22억',    '30억 (+36%)'],
            ['2003-03', '버블 붕괴 이후', '252억',   '151억 (−40%)'],
            ['2009-03', '금융위기 바닥',  '(미포함)', '(미포함)'],
          ]}
        />

        <Callout color="yellow">
          <strong>S7의 약점: 버블 붕괴 이후 진입</strong><br />
          2003-03처럼 닷컴버블이 이미 붕괴한 뒤 진입하면, 이후 추가 하락 구간에서 RSI가 자주
          30 미만으로 떨어진다. 매번 재진입하지만 추세 하락이 지속되어 3배 레버리지 손실이 쌓인다.
          S7은 <strong>상승 추세 중 일시 급락</strong>에서 가장 강하고,
          <strong>장기 하락 추세 초기</strong>에서 가장 약하다.
        </Callout>

        <H3>RSI 재진입 직후 빠른 재매도 — 설계된 자동 손절</H3>
        <P>
          RSI 조기 재진입 다음날 곧바로 재매도 신호가 뜨는 경우가 있다. 닷컴버블(2000~2002) 구간에서는
          이 사이클이 8번 반복됐고, 그 중 3번은 매수한 다음날 바로 재매도였다.
          처음엔 버그처럼 보이지만, 수정하면 어떻게 되는지 직접 테스트했다.
        </P>
        <P>
          원인은 EMA200 카운터 구조에 있다. 매도 후 현금을 보유하는 동안에도 "EMA200 아래 연속일"
          카운터가 계속 쌓인다. RSI 신호로 재매수할 때 이 카운터를 리셋하지 않기 때문에,
          재진입 직후에도 카운터가 이미 15일 이상이면 다음날 곧바로 재매도 조건이 충족된다.
        </P>
        <Callout color="blue">
          <strong>수정하면 어떻게 되나? — 테스트 결과</strong><br />
          카운터를 재매수 시 리셋하도록 수정하자 668가지 시작 시점 중앙값이 <strong>2,994억 → 681억</strong>으로
          4.4배 악화됐다. 거의 모든 시작 시점에서 결과가 나빠졌다.<br /><br />
          이유: 재진입이 틀렸을 때(시장이 계속 하락) 카운터가 즉시 재매도를 발동시켜 추가 손실을 막는다.
          리셋하면 재진입 후 최소 15거래일은 팔 수 없어 하락장에 더 오래 노출된다.
          <strong>"1일 후 재매도"는 버그가 아니라 잘못된 재진입을 빠르게 되돌리는 자동 손절</strong>이다.
        </Callout>

        {/* ── 6. 분할재진입은 왜 역효과 ────────────────────── */}
        <H2>6. 왜 분할재진입은 역효과인가</H2>
        <P>
          직관적으로 분할재진입은 "고점에서 전액 매수하는 실수"를 방지하는 것처럼 보인다.
          하지만 3배 레버리지 환경에서는 결과가 반대다.
        </P>
        <P>
          TQQQ는 복리 효과가 강한 상품이다. 1일이라도 일찍 투자할수록 복리 기간이 늘어난다.
          EMA200 15일 신호가 이미 "반등이 시작됐음"을 확인하는 필터인데, 그 이후에도
          3~6개월 분할하면 확인된 상승 추세의 앞부분을 현금으로 날리는 셈이다.
          분할재진입 6개월은 중앙값이 341억으로 S0(1,176억)의 29% 수준에 불과하다.
        </P>

        {/* ── 7. 동적 레버리지의 함정 ──────────────────────── */}
        <H2>7. 동적 레버리지(TQQQ↔QQQ)의 함정</H2>
        <P>
          EMA200 근처에서 QQQ(1배)로 전환하는 아이디어는 합리적으로 보인다.
          레버리지 위험을 줄이고 반복 매매를 막는다는 취지다.
          하지만 실제 결과는 중앙값 215억으로 S0의 18% 수준이었다.
        </P>
        <P>
          문제는 두 가지다. 첫째, 매일 EMA200 기준 5% 경계를 체크해서 TQQQ↔QQQ를 전환하므로
          평균 229회 거래가 발생한다(S0의 11배). 거래 수수료가 성능을 갉아먹는다.
          둘째, 상승 추세에서 EMA200 근처에 머무는 구간이 길수록 QQQ로 대부분의 시간을 보내는데,
          이때 TQQQ의 3배 복리 효과를 전혀 누리지 못한다.
        </P>

        {/* ── 8. 나머지 전략 ────────────────────────────────── */}
        <H2>8. 나머지 전략 요약</H2>

        <H3>S4 Guyton-Klinger: 소폭 개선</H3>
        <P>
          1,269억으로 S0(1,176억)보다 약 8% 앞선다. 인출률이 초기 기준의 120%를 초과하면
          자동으로 20% 감액하는 메커니즘이 과잉 인출을 억제해 자산 보존에 도움이 된다.
          신호 구조와 거래 횟수는 S0과 동일(21회)하다. 다만 개선폭이 작아 방법론 변경의
          실익이 크지 않다.
        </P>

        <H3>S5 변동성 조정: 거의 동일</H3>
        <P>
          1,171억으로 S0과 사실상 같다. 변동성 높을 때 인출을 줄이는 효과와
          낮을 때 더 받아가는 효과가 상쇄된다. 변동성 자체가 인출 결과에 큰 변수가 아님을 보여준다.
        </P>

        <H3>S8 Floor 보장형: 생존율 감소</H3>
        <P>
          생존율이 97.1%로 S0(100%)보다 낮다. 자산이 작아질 때도 강제로 500만을 인출하면
          포트폴리오가 더 빠르게 소진된다. 나쁜 진입 시점(2000-03 등)에서 파산 사례가 발생한다.
        </P>

        <H3>S1 골든/데스크로스: 느린 신호</H3>
        <P>
          646억으로 S0의 절반 수준. EMA50×EMA200 교차는 느리다. 하락이 확인되어 매도할 때는
          이미 상당히 떨어진 뒤이고, 상승이 확인되어 매수할 때는 이미 많이 오른 뒤다.
          EMA200 15일 연속 필터가 속도와 안정성의 균형을 더 잘 잡는다.
        </P>

        {/* ── 9. RSI 파라미터 최적화 (후속 연구) ─────────────── */}
        <H2>9. RSI 설정값 최적화 결과</H2>

        <P>
          RSI&lt;30 아이디어가 유효하다는 것을 확인한 뒤, 임계값·200일선 대비 하락폭 필터·주봉/일봉 여부·Guyton-Klinger 결합을
          체계적으로 그리드 서치했다. 총 23개 조합, 418가지 시작 시점.
        </P>

        <Callout color="green">
          <strong>최종 최선: 일봉 RSI(14일) {'<'} 30 + 200일선 대비 −10% 이하 + Guyton-Klinger</strong><br />
          중앙값 <strong>3,918억</strong> · 생존율 100% · 연평균 수익률 32.4% · 47회 거래/20년<br />
          2000-03(버블 정점) 46억 · 2003-03(버블 붕괴 후) 231억
        </Callout>

        <Table
          headers={['조합', '설명', '중앙값', '연평균 수익률', '2000-03', '2003-03']}
          rows={[
            [<strong key="d10gk" className="text-green-600 dark:text-green-400">★ D10GK</strong>,
             '일봉RSI<30 + 200일선 대비 −10% 이하 + GK',
             <strong key="d10gkv" className="text-green-600 dark:text-green-400">3,918억</strong>,
             '32.4%', '46억', '231억'],
            ['D10',   '일봉RSI<30 + 200일선 대비 −10% 이하',         '3,689억', '31.8%', '35억', '173억'],
            ['R30',   '일봉RSI<30 (순수)',                 '3,232억', '30.2%', '30억', '151억'],
            ['S0',    '기준선 EMA200-15일',                '1,176억', '26.0%', '22억', '252억'],
            ['W20',   '주봉RSI(14주)<20',                 '1,176억', '25.9%', '22억', '252억'],
            ['W30',   '주봉RSI(14주)<30',                  '935억',  '23.5%', '9억',  '132억'],
          ]}
        />

        <H3>200일선 대비 하락폭 필터: −10%가 스위트스팟</H3>
        <P>
          200일선 대비 하락폭 필터(EMA200 대비 X% 이상 하락 시에만 RSI 신호 허용)를 6%~12% 범위로 테스트한 결과,
          −10%가 최적이었다. −6%, −7%는 너무 느슨해 가짜 신호가 많고(약 3,580억),
          −12%는 너무 엄격해 진짜 과매도를 놓친다(약 3,028억).
          −10%가 "충분히 떨어진 뒤 과매도" 신호만 걸러내는 균형점이다.
        </P>

        <H3>주봉 RSI는 왜 역효과인가</H3>
        <P>
          주봉 RSI(14주 ≈ 3.5개월)는 일봉보다 훨씬 느리다.
          주봉 RSI가 30 미만으로 떨어지려면 3~4개월 동안 하락세가 지속되어야 하는데,
          그 시점에는 이미 대형 하락장 한가운데다. 3배 레버리지로 그 자리에서 진입하면
          추가 하락 리스크가 높고, 기존 EMA200 신호와 비교해 이점이 없다.
          주봉 RSI{'<'}20은 너무 드물게 발생해 중앙값이 S0과 동일(1,176억)했다.
        </P>

        <H3>Guyton-Klinger와의 결합이 효과적인 이유</H3>
        <P>
          D10 단독(3,689억)에 GK를 더하면 3,918억으로 230억 추가 개선된다.
          GK는 인출률이 초기 기준의 120%를 초과할 때 자동으로 20% 감액한다.
          RSI 조기 재진입으로 자산이 크게 성장할 때 과잉 인출을 억제해 복리 효과를 보존하는 역할이다.
          2003-03 취약 시점에서 173억 → 231억으로 개선된 것이 이를 보여준다.
        </P>

        {/* ── 10. 결론 ─────────────────────────────────────── */}
        <H2>10. 결론</H2>

        <Callout color="purple">
          <strong>D10GK를 새 최선 후보로 검토 중</strong><br />
          중앙값 3,918억(기존 S0 대비 +233%), 생존율 100%.
          2000-03 버블 정점 진입 시 46억(S0보다 2배 우세), 2003-03 붕괴 직후 231억(S0의 91%).
          유일한 미해결 케이스는 2003-03처럼 이미 하락이 상당 진행된 뒤 시작하는 경우뿐이다.
        </Callout>

        <ul className="list-none space-y-3 mb-8">
          {[
            { q: '확인된 것', a: '일봉RSI(14일)<30 + 200일선 대비 −10% 이하 + GK 조합. 주봉 RSI는 역효과. 200일선 대비 −10%가 스위트스팟.' },
            { q: '아직 열린 것', a: '2003-03처럼 대형 하락 직후 진입 케이스에서 S0(252억)보다 약간 낮은 231억. 장기 하락 추세 초기 진입의 약점을 보완할 방법 탐색 중.' },
          ].map(({ q, a }) => (
            <li key={q} className="border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a}</p>
            </li>
          ))}
        </ul>

        {/* ── 11. 과최적화 검증 ─────────────────────────────── */}
        <H2>11. 이 전략, 데이터에 과하게 맞춘 건 아닐까?</H2>

        <P>
          D10GK는 나스닥100 데이터 1985~2005년 구간에서 가장 좋은 결과를 낸 조합을 골라낸 것이다.
          그러면 당연한 의문이 생긴다. "그 기간에만 잘 맞는 숫자 아닌가?"
          이 걱정을 세 가지 방법으로 검증했다.
        </P>

        <Callout color="green">
          <strong>결론: 과최적화 가능성 낮음 (3가지 중 2가지 통과)</strong><br />
          SP500 3배에서 1950~2005년 전 기간 중 83%의 시작 시점에서 D10GK가 기준 전략을 앞섰다.
          1929년 대공황까지 포함한 가상 나스닥100 데이터에서도 통과.
          RSI 기준값(30)을 낮추면 성능이 크게 떨어지는 점만 주의가 필요하다.
        </Callout>

        <H3>검증 1 — S&P500 3배 레버리지로 테스트 ✅</H3>
        <P>
          나스닥100이 아닌 S&P500에 똑같은 전략을 적용해봤다. 1950년부터 2005년 사이 매월 시작하는
          662가지 경우를 모두 시뮬레이션했다.
        </P>
        <P>
          처음엔 1985~2005년 구간만 비교했더니 D10GK 중앙값(111억)이 기준 전략(133억)보다 낮았다.
          하지만 1985년 이전 구간까지 포함하면 결과가 역전됐다.
        </P>

        <Table
          headers={['시작 시점 범위', '경우 수', '기준 전략 중간값', 'D10GK 중간값', '시작 시점별 승률']}
          rows={[
            [<strong key="all" className="text-green-600 dark:text-green-400">전체 (1950~2005)</strong>, '662가지', '47.7억', <strong key="allv" className="text-green-600 dark:text-green-400">88.1억 ✅</strong>, '83.1%'],
            [<strong key="oos" className="text-green-600 dark:text-green-400">1985년 이전</strong>, '410가지', '43.7억', <strong key="oosv" className="text-green-600 dark:text-green-400">80.6억 ✅</strong>, '82.9%'],
            ['1985~2005', '252가지', '132.8억', '111.0억', '83.3%'],
          ]}
        />

        <P>
          1985~2005 구간은 같은 날 시작한 경우끼리 비교하면 D10GK가 83%에서 이겼는데도, 중간값은 기준 전략이 더 높다.
          중간값은 각 전략의 결과를 따로 줄 세워 가운데를 고르는 것이라, 두 전략의 &lsquo;가운데 경우&rsquo;가 서로 다른 시작 시점이기 때문이다.
          D10GK가 지는 경우는 크게 진다. 예를 들어 1987년 8월 시작은 기준 전략 106억, D10GK 71억이다.
          그 해 10월 블랙먼데이(단 하루에 −22.6%) 이후 S&P500이 V자 반등하는 과정에서
          RSI 신호가 너무 자주 켜져 반복 매매 손실이 쌓였다.
        </P>

        <Table
          headers={['시작 시점', '기준 전략', 'D10GK', '결과']}
          rows={[
            ['1973년 1월 (오일쇼크)', '28.6억', '51.8억', 'D10GK ✅'],
            ['1980년 1월 (고금리 시대)', '492억', '1,201억', 'D10GK ✅'],
            ['1987년 8월 (블랙먼데이 직전)', '105.9억', '71.2억', '기준 전략 ❌'],
            ['2000년 3월 (닷컴버블 정점)', '9.1억', '12.8억', 'D10GK ✅'],
            ['2003년 3월 (버블 붕괴 이후)', '9.3억', '21.5억', 'D10GK ✅'],
          ]}
        />

        <H3>검증 2 — 1929년 대공황까지 포함한 가상 데이터 ✅</H3>
        <P>
          나스닥100 지수는 1971년에 만들어졌다. 그 이전은 실제 데이터가 없어서
          S&P500과 나스닥100의 관계(β=1.244)를 이용해 가상의 나스닥100 가격을 역산했다.
          이 가상 데이터는 전략 최적화에 전혀 사용하지 않았으므로 완전히 독립적인 검증이다.
        </P>

        <Table
          headers={['시작 시점 범위', '전략', '중간값', '연평균 수익률']}
          rows={[
            ['1971년 이전 (가상 데이터)', '기준 전략', '526억', '23.0%'],
            ['1971년 이전 (가상 데이터)', <strong key="d10gk2" className="text-green-600 dark:text-green-400">D10GK ✅</strong>, <strong key="d10gkv2" className="text-green-600 dark:text-green-400">612억</strong>, '23.6%'],
            ['1985~2005 (실제 데이터)', '기준 전략', '1,447억', '26.7%'],
            ['1985~2005 (실제 데이터)', 'D10GK', '3,295억', '30.7%'],
          ]}
        />

        <P>
          대공황(1929), 2차대전(1937~), 전후 호황(1946~) 등 현대와 전혀 다른 시장 환경에서도
          D10GK가 앞섰다. RSI 과매도 반등이라는 원리는 특정 기간에만 통하는 패턴이 아니라
          시장 심리의 더 근본적인 특성을 포착하고 있을 가능성이 높다.
          단, 1929년 9월(대공황 정점 직후) 시작 시뮬레이션에서는 두 전략 모두 20년 안에 0에 수렴했다.
          이 정도 폭락은 어떤 전략도 막기 어렵다.
        </P>

        <H3>검증 3 — 기준값을 살짝 바꾸면 결과가 많이 달라지나? ⚠</H3>
        <P>
          RSI 30, 200일선 대비 −10% 등 D10GK의 주요 설정값을 한 단계씩 바꿔보며 결과 변화를 측정했다.
        </P>

        <Table
          headers={['설정 변경', '중간값', '기준 대비']}
          rows={[
            [<strong key="d10gkstar" className="text-purple-600 dark:text-purple-400">★ D10GK (기준)</strong>, '3,295억', '—'],
            ['RSI 기준 35로 올림', '2,682억', '−18.6%'],
            ['200일선 대비 기준 −8%로 올림', '3,062억', '−7.1%'],
            ['200일선 대비 기준 −12%로 내림', '3,295억', '0.0%'],
            ['Guyton-Klinger 제거', '3,236억', '−1.8%'],
            [<span key="d10gkr25" className="text-red-500">RSI 기준 25로 내림</span>, '1,522억', <span key="d10gkr25v" className="text-red-500 font-semibold">−53.8% ⚠</span>],
          ]}
        />

        <P>
          200일선 대비 기준이나 Guyton-Klinger는 바꿔도 결과가 거의 안 변한다(0~7%).
          문제는 RSI 기준값이다. 30을 25로 낮추면 성능이 54% 급락한다.
          나스닥100에서 RSI가 25 미만으로 떨어지는 일이 2년에 한 번도 안 생기기 때문이다.
          조기 재진입 신호가 너무 드물게 발생해서 전략 자체가 무력화된다.
          "30이 최적"이라고 확신하기보다는 "25~35 사이 어딘가가 나스닥100에 맞는 구간"
          정도로 이해하는 것이 정직하다.
        </P>

        <H3>종합</H3>
        <P>
          세 가지 검증 중 두 가지를 통과했다. RSI 조기 재진입이라는 아이디어 자체는
          특정 기간 데이터에 억지로 맞춘 것이 아니라 시장의 과매도 반등 현상이라는
          일반적인 원리를 활용하는 것으로 보인다.
          다만 RSI 기준값 30은 나스닥100의 변동성 특성에 맞게 조정된 수치라는 점,
          블랙먼데이처럼 단기 급반등 뒤 재하락하는 패턴에서는 약점이 있다는 점을 염두에 두어야 한다.
        </P>

        {/* ── 하단 링크 ────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">관련 분석 글</p>
          <AnalysisLink
            href="/posts/withdrawal-guide"
            title="인출식 방법론: 10억 달성 후 어떻게 꺼내 쓰나"
            desc="현재 최선 후보(EMA200 15일 + 동적인출)의 설계 근거와 95개 조합 그리드 서치 결과."
          />
          <AnalysisLink
            href="/posts/withdrawal-new-ideas/data"
            title="전체 시작 시점 데이터 →"
            desc="418개 시작 시점별 9개 전략 결과를 모두 볼 수 있는 데이터 뷰어."
          />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/posts/withdrawal-guide"
              className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors text-center"
            >
              <div className="text-xs text-gray-400 dark:text-gray-500 font-bold mb-1">이전</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">← 인출식 방법론 (현재 최선)</div>
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
