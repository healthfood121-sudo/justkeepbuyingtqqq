import Link from 'next/link'
import Header from '@/components/Header'
import Rule25PeriodTable from '@/components/Rule25PeriodTable'
import WithdrawalExecTable from '@/components/WithdrawalExecTable'

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
            <span className="text-sm text-gray-400">2026-10-01 · 최종수정 2026-10-14</span>
            {['인출식', '25% 룰', '동적인출률', 'FIRE', 'TQQQ', '방법론'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <Callout color="purple">
          <strong>이 방법론은 확정이 아닙니다.</strong><br />
          백테스트를 거치며 계속 개선 중입니다.
          더 나은 방법이 발견될 때마다 업데이트하고, 각 연구 단계의 근거는 아래 링크에서 확인할 수 있습니다.
        </Callout>

        {/* ── 현재 권장 전략 ───────────────────────────────────── */}
        <div id="recommended" className="scroll-mt-28" />
        <H2>현재 권장 전략: 25% 룰 + 동적 인출</H2>
        <P>
          <strong>25% 룰</strong>은 나스닥100이 52주 최고 종가보다 25% 낮게 끝나면 TQQQ를 전부 팔고, 200일 평균선 위로 돌아오면 다시 사는 규칙이다.
        </P>

        <Callout color="blue">
          <strong>규칙은 세 줄이다.</strong><br /><br />
          ① <strong>매도</strong> — 나스닥100 종가가 최근 1년 최고 종가보다 25% 이상 낮게 끝나면 → 다음 거래일에 TQQQ 전량 매도, 현금(외화RP)으로 보관<br />
          ② <strong>매수</strong> — 나스닥100이 200일 평균선 위로 15거래일 연속 마감하면 → 다음 거래일에 전액 TQQQ 매수<br />
          ③ <strong>생활비</strong> — 매달 총자산의 0.3%(10억 미만) / 0.5%(10~20억) / 0.7%(20억 이상)를 꺼낸다. 상한 없음<br /><br />
          신호 확인은 일주일에 한 번 <Link href="/" className="underline">홈 화면 &lsquo;오늘의 신호&rsquo;</Link>로 충분하다. 매매는 55년 동안 매도 15번(10년에 약 3번) — <Link href="/posts/withdrawal-guide/tradelog" className="underline">시작 시점별 거래 로그 전체 보기</Link>.
        </Callout>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-4 mb-6 px-1">
          💡 <strong>생활비 안정 팁:</strong> ③을 매달 계산하는 대신, 매년 한 번만 계산해 12개월 동안 고정하면 수익률 손해 없이 생활비 변동이 줄어든다 — <Link href="/posts/living-stability" className="underline">비교 →</Link>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: '인출 포함 연 수익률', value: '21.5%', sub: '하위 10%도 16.2%' },
            { label: '20년간 꺼내 쓴 돈', value: '65.8억', sub: 'S0 40억 · D10GK 41억' },
            { label: '남은 자산 10억 미만', value: '41가지', sub: '548가지 중' },
            { label: '현금으로 있는 기간', value: '13%', sub: '나머지는 TQQQ 보유' },
          ].map(c => (
            <div key={c.label} className="bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-3 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{c.label}</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{c.value}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{c.sub}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
          초기 10억 · 1971~2016년 매달 시작해 2026-10까지 보유 · <Link href="/posts/tqqq-cost" className="underline hover:text-blue-500">스왑금리</Link> · 모든 매도 양도세 22% · 현금 외화RP 이자(세후) · 신호 다음 거래일 매매 반영.
          인출 포함 연 수익률 = 10억을 넣고 매달 생활비를 받고 마지막 남은 자산까지 돌려받았을 때의 연 수익률.
        </p>

        <H3>왜 25% 룰인가 — ① 꺼내 쓰는 돈이 가장 많다</H3>
        <P>
          같은 날 시작한 경우끼리 비교하면, 25% 룰은 20년 동안 S0보다 약 1.3배 많이 꺼내 쓴다. D10GK는 30년이 넘어가야 25% 룰을 앞지른다.
          은퇴 초반의 삶의 질을 생각하면 25% 룰이 맞다.
        </P>
        <Rule25PeriodTable part="withdrawn" />

        <H3>왜 25% 룰인가 — ② 닷컴버블이 아닌 구간에서도 대체로 낫다</H3>
        <P>
          25% 룰의 좋은 성적이 닷컴버블 한 번 덕분인지 확인하려고, 2000~2002년을 거치지 않는 구간만 따로 봤다.
          닷컴버블을 건드리지 않는 모든 10년 구간에서 25% 룰이 S0보다 나은 경우가 80%였고, 2003년 이후 시작은 S0·D10GK보다 전부 나았다.
          TQQQ를 신호 없이 계속 들고 가는 쪽이 더 높은 구간(1987, 2020처럼 빨리 회복한 폭락)도 있지만,
          1973~74 같은 긴 하락장에서는 10년 연 −4.7%였고 전체 기간으로는 42%가 10억 미만으로 끝난다.
        </P>
        <Rule25PeriodTable part="periods" />

        <Callout color="yellow">
          <strong>25% 룰을 고르면 감수해야 할 것</strong><br />
          · <strong>자산이 크게 줄어드는 시기가 온다.</strong> 1990년 시작 예: 2000년 3월 999억 → 2008년 9월 45억(−95%). 닷컴버블과 금융위기가 연달아 오면서 8년 반에 걸쳐 줄었고,
          그동안 생활비로 110억을 꺼내 썼다. <Link href="/posts/experience-1990" className="underline">이 36년을 한 달씩 넘겨 보기</Link>. 나스닥100이 25% 빠져야 팔기 때문에 그때 TQQQ는 이미 60% 넘게 빠진 상태다.<br />
          · <strong>생활비도 자산 따라 줄어든다.</strong> 매달 그 시점 자산 기준으로 계산하기 때문에, 자산이 빠지면 생활비도 바로 따라 줄어든다 — <Link href="/posts/living-stability" className="underline">생활비 규칙 비교</Link>.<br />
          · <strong>매도 4번 중 1번은 산 지 5거래일 안에 다시 판다.</strong> 하락장 중간 반등에서 샀다가 다시 빠지는 경우다.<br />
          · <strong>1970~80년대 같은 시장에서는 S0와 비슷하다</strong>(10년 구간 9.8% vs 9.9%). 우위가 가장 큰 건 2003년 이후 대세 상승장이다.<br />
          · <strong>성적이 몇 번의 하락에 기대고 있다.</strong> 과거의 빠른 하락 네 번이 −22~−23%에서 멈춰서 25%가 22%보다 나았다. 기준을 23~33%로 바꿔도 결과는 비슷하다 —{' '}
          <Link href="/posts/rule25-sensitivity" className="underline">기준값을 바꿔 본 검증</Link>.<br />
          · <strong>1929년 같은 폭락은 막지 못한다.</strong> 하루 −10%대가 연달아 오면 신호가 뜨기 전에 TQQQ가 대부분 녹는다. 가상 데이터로 1929년 9월에 시작하면 10억이 776만원까지 줄었다 —{' '}
          <Link href="/posts/withdrawal-1929" className="underline">1929년 대공황 인출 시나리오</Link>.<br />
          · <strong>전량 매도한 해의 세금이 크다.</strong> 쌓인 이익이 한꺼번에 실현돼 다음 해 5월 자산의 10~26%를 세금으로 낸다. 그 몫은 재매수 때 남겨 둔다 —{' '}
          <Link href="/posts/withdrawal-tax" className="underline">세금은 얼마나, 언제 내나</Link>.
        </Callout>

        <H3>다른 선택지</H3>
        <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed list-disc pl-5">
          <li><strong>25% 룰 + 자산별 현금 비중</strong> — 총자산 50억↑ TQQQ ⅔, 200억↑ ⅓. 연 20.2%로 1.3%p 낮지만 낙폭이 −96% → −80%로 얕아진다. 큰돈을 지키고 싶을 때.</li>
          <li><strong>D10GK</strong> — 연 19.8%. 현금일 때 매일 밤 LOC 주문이 필요하고, 초반 생활비가 25% 룰보다 적다.</li>
          <li><strong>S0 (200일선 15일)</strong> — 연 16.7%. 매수 직후 재매도가 한 번도 없는 가장 단순한 규칙 (<Link href="/posts/withdrawal-guide/tradelog?st=s0" className="underline">거래 로그</Link>).</li>
        </ul>
        <P>
          16가지 전략 전체 비교와 10·20·30·40·50년 시점별 변화는{' '}
          <Link href="/posts/withdrawal-full-period" className="text-blue-600 dark:text-blue-400 underline">모든 인출 전략 전체 기간 비교</Link>에 있다.
          아래 표는 매매 시점(신호 당일 / 다음날 / LOC)에 따라 결과가 어떻게 달라지는지 보여준다.
        </P>
        <WithdrawalExecTable />

        {/* ── 연구 흐름 ────────────────────────────────────────── */}
        <H2>연구 흐름: 어떻게 여기까지 왔나</H2>

        <div className="space-y-3 mb-8">
          {[
            {
              step: '1단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: 'SP500 낙폭 기반 전략 (v1)',
              result: '중간값 1.4억 (스왑금리 반영) · 운용보수만 12.7억',
              desc: 'SP500이 −20% 이상 하락하면 인출 중단하는 방식. 하락 중에도 TQQQ를 보유해 손실이 누적됐다.',
              href: '/posts/withdrawal-comparison',
              link: '비교 분석 →',
            },
            {
              step: '2단계',
              color: 'border-blue-300 dark:border-blue-700',
              badge: 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
              title: '★ EMA200 연속 15일 + 동적 인출률 (S0) — 당시 채택',
              result: '중간값 130억 (스왑금리·양도세 반영) · 초기 계산 1,109억 · 생존율 100%',
              desc: '나스닥100이 EMA200 아래에서 15거래일 연속이면 전액 현금 전환. 95가지 설정값 조합 탐색에서 최적 조합. 매수 후 1일 재매도 사례 없음 — 구조적 안전장치.',
              href: '/posts/withdrawal-new-ideas',
              link: '아이디어 8가지 →',
            },
            {
              step: '3단계',
              color: 'border-purple-200 dark:border-purple-800/50',
              badge: 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
              title: '8가지 새 아이디어 테스트',
              result: 'RSI 조기 재진입 → 중간값 724억 (스왑금리 반영) · 운용보수만 3,232억',
              desc: '골든크로스, 분할 재진입, 동적 레버리지 등 8가지를 비교. RSI가 30 미만으로 떨어지면 EMA200 신호를 기다리지 않고 즉시 재매수하는 방식이 압도적 우세.',
              href: '/posts/withdrawal-new-ideas',
              link: '테스트 결과 →',
            },
            {
              step: '4단계',
              color: 'border-green-300 dark:border-green-700',
              badge: 'bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400',
              title: 'RSI + 200일선 대비 −10% 필터 + Guyton-Klinger (D10GK)',
              result: '★ 중간값 332억 (스왑금리·양도세 반영) · 초기 계산 3,741억',
              desc: 'RSI 신호에 "EMA200보다 10% 이상 떨어진 상태"라는 조건을 추가해 가짜 신호를 줄였다. 자산이 많이 늘었을 때 인출을 자동으로 줄여주는 Guyton-Klinger 규칙도 결합. 과최적화 여부도 검증 완료.',
              href: '/posts/withdrawal-new-ideas',
              link: '상세 분석 →',
            },
            {
              step: '5단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: '트레일링 스탑·단계적 현금화·레버리지 하향 검증',
              result: '추가 아이디어 3가지 — 운용보수만 기준으로는 모두 기준선 미달',
              desc: '3가지 새 아이디어(25%·20%·15% 룰(트레일링 스탑), 단계적 현금화 GRAD, 자산 규모별 레버리지 하향 DLEV)를 668가지 진입 시점으로 테스트. 운용보수만 반영하면 모두 기준선을 넘지 못했다. 단, 스왑금리·양도세를 반영하면 DLEV(160억)가 S0(130억)를 앞선다 — 큰 자산을 스왑 비용이 없는 나스닥100(1배)으로 옮기기 때문. 25% 룰은 거래 12회로 가장 단순하다.',
              href: '/posts/withdrawal-new-ideas2',
              link: '검증 결과 →',
            },
            {
              step: '6단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: 'TQQQ 자체 신호 · 인출 시작 지연 검증',
              result: 'TQQQ 신호: 기준의 1/4 수준 열등 · 인출 2년 지연: +13%',
              desc: 'TQQQ 합성가격 기준 EMA200 신호는 레버리지 잡음으로 매매가 너무 잦아 완전히 열등. 반면 다른 수입원이 있어 인출을 1~2년 미룰 수 있는 경우, 최종 자산이 7~13% 늘어나는 효과가 있다.',
              href: '/posts/withdrawal-signal-test',
              link: '검증 결과 →',
            },
            {
              step: '7단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: '금리 연동 레버리지 검증 (스왑금리 반영)',
              result: '채택 안 함 — 기준금리 기준값에 따라 결과가 들쭉날쭉',
              desc: '신호는 S0 그대로 두고, 기준금리가 높을 때만 TQQQ(3배) 대신 QLD(2배)를 들고 가는 방식. 갈아탈 때 양도세 22%까지 반영했다. 기준을 6~7%로 잡으면 중간값 311~350억으로 S0(226억, 현금 전환 매도세 미반영 기준)보다 높았지만, 4~5%에서는 153~155억으로 오히려 낮았다. 기준값을 조금만 바꿔도 결과가 뒤집혀 우연에 가깝다고 판단. 항상 QLD(2배)는 중간값 177억으로 낮지만 20년 뒤 원금 미만으로 끝난 경우가 0가지다.',
            },
            {
              step: '8단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: '현실 기준 재검증 + 자산이 커지면 일부 현금화',
              result: 'S0 130억 · D10GK 332억 · 현금 비중 규칙 S0 148억 / D10GK 295억',
              desc: '스왑금리와 모든 매도의 양도세(하락 신호로 전량 현금 전환할 때 포함)를 넣어 다시 계산했다. 순위는 그대로이고 D10GK가 S0의 2.6배. 함께 검증한 규칙: 총자산 50억 이상이면 TQQQ ⅔ + 현금 ⅓, 200억 이상이면 TQQQ ⅓ + 현금 ⅔로 매월 맞춘다. 나스닥100으로 바꿔 드는 것(DLEV 160억)과 결과가 거의 같으면서 현금이라 언제든 쓸 수 있다. S0에 붙이면 중간값이 오르고(130→148억), D10GK에 붙이면 중간값은 내려가지만(332→295억) 하위 10% 경우가 20억→30억으로 좋아진다. 단, 50억에 도달하지 못한 나쁜 시작 시점은 보호하지 못한다.',
            },
            {
              step: '9단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: '실제로 가능한 매매 시점 + 오늘까지 보유로 재검증',
              result: '인출 포함 연 수익률 25% 룰 21.5% · D10GK(LOC) 19.8% · S0 16.7%',
              desc: '신호는 종가가 확정돼야 알 수 있으므로 신호 다음 거래일에 매매하도록 바꿨다. D10GK의 조기 재매수만 조건을 가격으로 환산한 LOC 주문으로 당일 종가에 산다. 20년에서 자르면 결과가 매매일 하루 이틀 차이에도 크게 흔들려, 1971년 이후 매달 시작해 오늘까지 보유한 인출 포함 연 수익률로 비교했다 (월 1,500만원 인출 상한도 없앰). 이 기준에서는 순위가 25% 룰 > D10GK > S0로 바뀌었다.',
            },
            {
              step: '10단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: '초기 현금버퍼 체계적 실험 — EARLY24 발견',
              result: '6·12개월 버퍼 효과 없음 · 24개월 버퍼(처음 5년) IRR +0.8%p · 별도 RP/VOO 버퍼는 오히려 악화',
              desc: '하락장 진입 시 생활비를 위해 포트에 현금을 미리 쌓아두는 버퍼 전략을 체계적으로 테스트했다. 6·12개월 버퍼는 EMA200이 이미 하락 방어를 담당하므로 추가 효과가 없었다. 단 한 가지 예외: 처음 5년간 24개월치를 포트폴리오 내 현금으로 유지하는 방식(EARLY24)은 IRR 21.1%→21.9%로 +0.8%p 개선이 확인됐다. 반면 별도 RP 계좌로 꺼내두거나(IRR 16.6%), VOO로 분산하는 방식(15.6%)은 TQQQ 복리를 이탈해 오히려 성적이 크게 낮아진다.',
            },
            {
              step: '현재',
              color: 'border-blue-300 dark:border-blue-700',
              badge: 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
              title: '★ 전체 기간 재검증 → 25% 룰을 권장 전략으로',
              result: '인출 상한 없음 · 인출 포함 연 21.5% · 20년간 꺼내 쓴 돈 65.8억',
              desc: '16가지 전략을 오늘까지 끝까지 들고 가며 10~50년 시점을 비교했다. 월 1,500만원 인출 상한을 없애고 꺼내 쓴 돈과 남은 자산을 함께 봤다. 닷컴버블을 거치지 않는 구간에서도 25% 룰이 S0보다 대체로 나았다(10년 구간의 80%). 현금 비중·버퍼 같은 장치는 수익을 낮추는 대신 낙폭을 줄이는 정도라 기본 권장에서는 뺐다.',
              href: '/posts/withdrawal-full-period',
              link: '전체 비교 →',
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

        {/* ── 다음 단계 ──────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">관련 분석 글</p>
          <div className="space-y-0">
            <AnalysisLink
              href="/posts/withdrawal-new-ideas"
              title="인출 전략 새 아이디어 8가지 테스트"
              desc="S0(EMA200 15일)를 기준으로 RSI 조기 재진입·골든크로스·동적 레버리지 등 8가지 비교. D10GK는 수익 극대화 옵션."
            />
            <AnalysisLink
              href="/posts/withdrawal-new-ideas2"
              title="더 나을 줄 알았던 전략 3가지를 테스트해봤다"
              desc="트레일링 스탑·단계적 현금화·레버리지 하향 — 668가지 진입 시점으로 모두 검증. 25% 룰이 가장 단순한 대안."
            />
            <AnalysisLink
              href="/posts/withdrawal-signal-test"
              title="10억 달성 후 바로 꺼낼까, 1~2년 더 기다릴까"
              desc="인출 시작을 1~2년 미루면 최종 자산 +7~13%. 다른 수입원이 있는 경우에만 유효한 전략."
            />
            <AnalysisLink
              href="/posts/tqqq-cost"
              title="TQQQ 비용 구조: 운용보수 0.82% + 스왑 파이낸싱"
              desc="3배 레버리지의 실제 비용 — 스왑 스프레드(SOFR+0.5%) 포함 총비용 계산. 스프레드 반영 전후 시뮬레이션 결과 비교."
            />
            <AnalysisLink
              href="/posts/withdrawal-comparison"
              title="인출 전략 비교: SP500 기반 vs NDX 200MA 기반"
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
