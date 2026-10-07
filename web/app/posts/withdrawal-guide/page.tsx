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
            <span className="text-sm text-gray-400">2026-10-01 · 최종수정 2026-10-03</span>
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
        <H2>현재 권장 전략: 25% 룰 + 상한 없는 동적 인출</H2>
        <P>
          <strong>25% 룰</strong>은 나스닥100이 52주 최고 종가보다 25% 낮게 끝나면 TQQQ를 전부 팔고, 200일 평균선 위로 돌아오면 다시 사는 규칙이다.
        </P>

        <Callout color="blue">
          <strong>규칙은 세 줄이다.</strong><br /><br />
          ① <strong>매도</strong> — 나스닥100 종가가 최근 1년 최고 종가보다 25% 이상 낮게 끝나면 → 다음 거래일에 TQQQ 전량 매도, 현금(외화RP)으로 보관<br />
          ② <strong>매수</strong> — 나스닥100이 200일 평균선 위로 15거래일 연속 마감하면 → 다음 거래일에 전액 TQQQ 매수<br />
          ③ <strong>생활비</strong> — 매달 총자산의 0.3%(10억 미만) / 0.5%(10~20억) / 0.7%(20억 이상)를 꺼내 쓴다. 상한 없음<br /><br />
          신호 확인은 일주일에 한 번 <Link href="/" className="underline">홈 화면 &lsquo;오늘의 신호&rsquo;</Link>로 충분하다. 매매는 55년 동안 매도 15번(10년에 약 3번) — <Link href="/posts/withdrawal-guide/tradelog" className="underline">시작 시점별 거래 로그 전체 보기</Link>.
        </Callout>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: '인출 포함 연 수익률', value: '22.4%', sub: '하위 10%도 17.1%' },
            { label: '20년간 꺼내 쓴 돈', value: '74억', sub: 'S0 44억 · D10GK 46억' },
            { label: '남은 자산 10억 미만', value: '0가지', sub: '548가지 중' },
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
          초기 10억 · 1971~2016년 매달 시작해 2026-09까지 보유 · 스왑금리 · 모든 매도 양도세 22% · 현금 외화RP 이자(세후) · 신호 다음 거래일 매매 반영.
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
          · <strong>자산이 크게 줄어드는 시기가 온다.</strong> 1990년 시작 예: 2000년 3월 1,099억 → 2008년 9월 47억(−96%). 닷컴버블과 금융위기가 연달아 오면서 8년 반에 걸쳐 줄었고,
          그동안 생활비로 110억을 꺼내 썼다. <Link href="/posts/experience-1990" className="underline">이 36년을 한 달씩 넘겨 보기</Link>. 나스닥100이 25% 빠져야 팔기 때문에 그때 TQQQ는 이미 60% 넘게 빠진 상태다.<br />
          · <strong>생활비도 자산 따라 줄어든다.</strong> 상한이 없는 대신 하한도 없다. 자산이 반토막 나면 생활비도 반토막이다. 생활비를 1년에 한 번만 정하면 수익률 손해 없이 덜 흔들린다 — <Link href="/posts/living-stability" className="underline">생활비 규칙 비교</Link>.<br />
          · <strong>매도 4번 중 1번은 산 지 5거래일 안에 다시 판다.</strong> 하락장 중간 반등에서 샀다가 다시 빠지는 경우다.<br />
          · <strong>1970~80년대 같은 시장에서는 S0와 비슷하다</strong>(10년 구간 9.8% vs 9.9%). 우위가 가장 큰 건 2003년 이후 대세 상승장이다.<br />
          · <strong>성적이 몇 번의 하락에 기대고 있다.</strong> 과거의 빠른 하락 네 번이 −22~−23%에서 멈춰서 25%가 22%보다 나았다. 기준을 23~33%로 바꿔도 결과는 비슷하다 —{' '}
          <Link href="/posts/rule25-sensitivity" className="underline">기준값을 바꿔 본 검증</Link>.<br />
          · <strong>1929년 같은 폭락은 막지 못한다.</strong> 하루 −10%대가 연달아 오면 신호가 뜨기 전에 TQQQ가 대부분 녹는다. 가상 데이터로 1929년 9월에 시작하면 10억이 776만원까지 줄었다 —{' '}
          <Link href="/posts/withdrawal-1929" className="underline">1929년 대공황 인출 시나리오</Link>.
        </Callout>

        <H3>다른 선택지</H3>
        <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed list-disc pl-5">
          <li><strong>25% 룰 + 자산별 현금 비중</strong> — 총자산 50억↑ TQQQ ⅔, 200억↑ ⅓. 연 20.9%로 1.5%p 낮지만 낙폭이 −96% → −80%로 얕아진다. 큰돈을 지키고 싶을 때.</li>
          <li><strong>D10GK</strong> — 연 20.7%. 현금일 때 매일 밤 LOC 주문이 필요하고, 초반 생활비가 25% 룰보다 적다.</li>
          <li><strong>S0 (200일선 15일)</strong> — 연 17.5%. 매수 직후 재매도가 한 번도 없는 가장 단순한 규칙 (<Link href="/posts/withdrawal-guide/tradelog?st=s0" className="underline">거래 로그</Link>).</li>
        </ul>
        <P>
          16가지 전략 전체 비교와 10·20·30·40·50년 시점별 변화는{' '}
          <Link href="/posts/withdrawal-full-period" className="text-blue-600 dark:text-blue-400 underline">모든 인출 전략 전체 기간 비교</Link>에 있다.
          아래 표는 매매 시점(신호 당일 / 다음날 / LOC)에 따라 결과가 어떻게 달라지는지 보여준다.
        </P>
        <WithdrawalExecTable />

        {/* ── 전체 전략 비교 ───────────────────────────────────── */}
        <H2>지금까지 테스트한 전략 전체 비교 (초기 연구 · 20년 · 신호 당일 매매 가정)</H2>
        <P>
          1단계부터 5단계까지 연구에서 나온 모든 전략의 결과를 한 표에 정리했다.
          이 표는 모두 &lsquo;신호 당일 종가에 매매&rsquo;라는 불가능한 가정의 수치다. 실제로 가능한 방식의 비교는 위 표를 볼 것.
          초기 자산 10억 · 668가지 시작 시점(1971~현재) · 20년 시뮬레이션 기준.
          중앙값은 스왑금리와 모든 매도 양도세를 반영한 값이다. 옆 두 열은 초기 연구의 가정(현금 전환 매도세 미반영 / 운용보수만)으로 계산한 값으로,
          현실 기준으로 다시 계산하지 않은 전략은 &lsquo;—&rsquo;로 표시했다.
        </P>

        <div className="overflow-x-auto mb-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {['전략', '중앙값', '매도세 미반영', '운용보수만', '생존율', '거래/20년', '포스트', '데이터'].map(h => (
                  <th key={h} className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[
                {
                  name: 'SP500 드로다운 v1',
                  step: '1단계',
                  med: '—', medV2: '1.4억', medV1: '12.7억', survival: '100%', trades: '—',
                  post: '/posts/withdrawal-comparison', postLabel: '비교 분석',
                  data: '/posts/withdrawal-comparison/data',
                  dim: true,
                },
                {
                  name: 'NDX SMA200 기준선',
                  step: '1단계',
                  med: '—', medV2: '68억', medV1: '203억', survival: '99.3%', trades: '144회',
                  post: '/posts/withdrawal-comparison', postLabel: '비교 분석',
                  data: '/posts/withdrawal-comparison/data',
                  dim: true,
                },
                {
                  name: 'EMA200 15일 (S0)',
                  step: '2단계',
                  med: '150억', medV2: '266억', medV1: '1,109억', survival: '100%', trades: '21회',
                  post: '/posts/withdrawal-new-ideas', postLabel: '아이디어 8가지',
                  data: '/posts/withdrawal-new-ideas/data',
                  dim: false,
                  rec: true,
                },
                {
                  name: 'RSI<30 조기 재진입',
                  step: '3단계',
                  med: '—', medV2: '724억', medV1: '3,232억', survival: '100%', trades: '57회',
                  post: '/posts/withdrawal-new-ideas', postLabel: '아이디어 8가지',
                  data: '/posts/withdrawal-new-ideas/data',
                  dim: false,
                },
                {
                  name: 'D10GK',
                  step: '4단계',
                  med: '393억', medV2: '841억', medV1: '3,741억', survival: '100%', trades: '48회',
                  post: '/posts/withdrawal-new-ideas', postLabel: '아이디어 8가지',
                  data: '/posts/withdrawal-new-ideas/data',
                  best: true,
                },
                {
                  name: '25% 룰 (트레일링 스탑)',
                  step: '5단계',
                  med: '146억', medV2: '195억', medV1: '1,064억', survival: '100%', trades: '12회',
                  post: '/posts/withdrawal-new-ideas2', postLabel: '새 아이디어',
                  data: '/posts/withdrawal-new-ideas2/data',
                  dim: false,
                },
                {
                  name: 'DLEV 레버리지 하향',
                  step: '5단계',
                  med: '197억', medV2: '281억', medV1: '474억', survival: '100%', trades: '35회',
                  post: '/posts/withdrawal-new-ideas2', postLabel: '새 아이디어',
                  data: '/posts/withdrawal-new-ideas2/data',
                  dim: true,
                },
                {
                  name: 'GRAD 단계적 현금화',
                  step: '5단계',
                  med: '—', medV2: '77억', medV1: '131억', survival: '100%', trades: '54회',
                  post: '/posts/withdrawal-new-ideas2', postLabel: '새 아이디어',
                  data: '/posts/withdrawal-new-ideas2/data',
                  dim: true,
                },
                {
                  name: 'S0 + 자산별 현금 비중',
                  step: '현재',
                  med: '189억', medV2: '—', medV1: '—', survival: '100%', trades: '21회',
                  post: '', postLabel: '', data: '',
                  dim: false,
                },
                {
                  name: 'D10GK + 자산별 현금 비중',
                  step: '현재',
                  med: '309억', medV2: '—', medV1: '—', survival: '100%', trades: '—',
                  post: '', postLabel: '', data: '',
                  dim: false,
                },
              ].map(row => (
                <tr key={row.name} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${row.dim ? 'opacity-50' : ''}`}>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                    <span className={row.best ? 'font-bold text-green-600 dark:text-green-400' : row.rec ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>{row.name}</span>
                    <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-600">{row.step}</span>
                  </td>
                  <td className={`py-2 px-3 font-mono ${row.best ? 'font-bold text-green-600 dark:text-green-400' : row.rec ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{row.med}</td>
                  <td className="py-2 px-3 font-mono text-xs text-gray-400 dark:text-gray-500">{row.medV2}</td>
                  <td className="py-2 px-3 font-mono text-xs text-gray-400 dark:text-gray-500">{row.medV1}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{row.survival}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{row.trades}</td>
                  <td className="py-2 px-3">
                    {row.post && <Link href={row.post} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">{row.postLabel} →</Link>}
                  </td>
                  <td className="py-2 px-3">
                    {row.data && <Link href={row.data} className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-10">흐린 행은 채택되지 않은 전략. 색 표시는 초기 연구 당시의 권장(파란색 S0)과 수익 최선(초록색 D10GK). 중앙값은 20년 완료 기준.</p>

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
              title: '★ EMA200 연속 15일 + 동적 인출률 (S0) — 현재 권장',
              result: '중간값 150억 (스왑금리·양도세 반영) · 초기 계산 1,109억 · 생존율 100%',
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
              result: '★ 중간값 393억 (스왑금리·양도세 반영) · 초기 계산 3,741억',
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
              desc: '3가지 새 아이디어(25%·20%·15% 룰(트레일링 스탑), 단계적 현금화 GRAD, 자산 규모별 레버리지 하향 DLEV)를 668가지 진입 시점으로 테스트. 운용보수만 반영하면 모두 기준선을 넘지 못했다. 단, 스왑금리·양도세를 반영하면 DLEV(197억)가 S0(150억)를 앞선다 — 큰 자산을 스왑 비용이 없는 나스닥100(1배)으로 옮기기 때문. 25% 룰은 거래 12회로 가장 단순하다.',
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
              desc: '신호는 S0 그대로 두고, 기준금리가 높을 때만 TQQQ(3배) 대신 QLD(2배)를 들고 가는 방식. 갈아탈 때 양도세 22%까지 반영했다. 기준을 6~7%로 잡으면 중간값 354~401억으로 S0(266억, 현금 전환 매도세 미반영 기준)보다 높았지만, 4~5%에서는 172~174억으로 오히려 낮았다. 기준값을 조금만 바꿔도 결과가 뒤집혀 우연에 가깝다고 판단. 항상 QLD(2배)는 중간값 193억으로 낮지만 20년 뒤 원금 미만으로 끝난 경우가 0가지다.',
            },
            {
              step: '8단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: '현실 기준 재검증 + 자산이 커지면 일부 현금화',
              result: 'S0 150억 · D10GK 393억 · 현금 비중 규칙 S0 189억 / D10GK 309억',
              desc: '스왑금리와 모든 매도의 양도세(하락 신호로 전량 현금 전환할 때 포함)를 넣어 다시 계산했다. 순위는 그대로이고 D10GK가 S0의 2.6배. 함께 검증한 규칙: 총자산 50억 이상이면 TQQQ ⅔ + 현금 ⅓, 200억 이상이면 TQQQ ⅓ + 현금 ⅔로 매월 맞춘다. 나스닥100으로 바꿔 드는 것(DLEV 197억)과 결과가 거의 같으면서 현금이라 언제든 쓸 수 있다. S0에 붙이면 중간값이 오르고(150→189억), D10GK에 붙이면 중간값은 내려가지만(393→309억) 하위 10% 경우가 23억→35억으로 좋아진다. 단, 50억에 도달하지 못한 나쁜 시작 시점은 보호하지 못한다.',
            },
            {
              step: '9단계',
              color: 'border-gray-300 dark:border-gray-700',
              badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              title: '실제로 가능한 매매 시점 + 오늘까지 보유로 재검증',
              result: '인출 포함 연 수익률 25% 룰 22.4% · D10GK(LOC) 20.7% · S0 17.5%',
              desc: '신호는 종가가 확정돼야 알 수 있으므로 신호 다음 거래일에 매매하도록 바꿨다. D10GK의 조기 재매수만 조건을 가격으로 환산한 LOC 주문으로 당일 종가에 산다. 20년에서 자르면 결과가 매매일 하루 이틀 차이에도 크게 흔들려, 1971년 이후 매달 시작해 오늘까지 보유한 인출 포함 연 수익률로 비교했다 (월 1,500만원 인출 상한도 없앰). 이 기준에서는 순위가 25% 룰 > D10GK > S0로 바뀌었다.',
            },
            {
              step: '현재',
              color: 'border-blue-300 dark:border-blue-700',
              badge: 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
              title: '★ 전체 기간 재검증 → 25% 룰을 권장 전략으로',
              result: '인출 상한 없음 · 인출 포함 연 22.4% · 20년간 꺼내 쓴 돈 74억',
              desc: '16가지 전략을 오늘까지 끝까지 들고 가며 10~50년 시점을 비교했다. 월 1,500만원 인출 상한을 없애고 꺼내 쓴 돈과 남은 자산을 함께 봤다. 닷컴버블을 거치지 않는 구간에서도 25% 룰이 S0보다 대체로 나았다(10년 구간의 80%). 현금 비중·버퍼·생활비 고정 같은 장치는 수익을 낮추는 대신 낙폭을 줄이는 정도라 기본 권장에서는 뺐다.',
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
        <H2>2. S0 — 이전 권장 전략 상세 (참고)</H2>

        <Callout color="blue">
          <strong>EMA200 연속15일 + 동적 인출률 (S0) — 668가지 시작 시점</strong><br />
          스왑금리·양도세 반영: 생존율 100% · 중간값 20년 후 <strong>150억</strong> · 연평균 수익률 14.5% (중간값 기준) · 최솟값 1.16억 · 평균 매매 21회/20년<br />
          <span className="text-xs opacity-80">초기 계산(운용보수만, 현금 전환 매도세 미반영): 중간값 1,109억 · 최솟값 1.68억</span>
        </Callout>

        <H3>2-1. 하락 신호: NDX 지수이동평균(EMA200) 연속 15일 필터</H3>
        <P>
          <strong className="text-gray-900 dark:text-white">NDX(나스닥100) 지수</strong>가 200일{' '}
          <strong className="text-gray-900 dark:text-white">지수이동평균(EMA200)</strong> 아래에서{' '}
          <strong className="text-gray-900 dark:text-white">15거래일(약 3주) 연속 유지</strong>될 때
          TQQQ 전량을 현금으로 전환한다. 반대로 EMA200 위에서 15거래일 연속이면 전액 재매수한다.
          신호는 TQQQ 합성가격이 아닌 <strong className="text-gray-900 dark:text-white">원지수(NDX)로 판단</strong>한다.
        </P>
        <P>
          <strong className="text-gray-900 dark:text-white">EMA200이 SMA200보다 우세한 이유</strong>: EMA는 최근 가격에 더 높은 가중치를 부여하기 때문에
          추세 전환에 더 빠르게 반응한다. 하락 초기에 더 일찍 신호를 주고, 반등 시에도 더 빨리 재진입할 수 있다.
          95개 조합 테스트 결과, EMA200 계열이 SMA200 계열을 전체적으로 압도했다.
        </P>
        <P>
          <strong className="text-gray-900 dark:text-white">15일 연속 필터 이유</strong>: 기준선(EMA200 교차 즉시)을 쓰면 20년에 평균 144번 거래(whipsaw).
          15일 연속 필터를 붙이면 21번으로 줄어들면서도 닷컴버블, 금융위기 같은 큰 하락은
          빠짐없이 포착한다. 10일 필터(25번 거래)보다 더 적은 거래로 더 나은 결과를 냈다.
        </P>
        <FormulaBlock>
          EMA200 = 전날 EMA × (1 − α) + 당일 종가 × α,  α = 2/(200+1)<br />
          <br />
          매도 조건: NDX {'<'} EMA200이 15거래일 연속 → 전량 매도 → 현금(외화RP)<br />
          매수 조건: NDX {'>'} EMA200이 15거래일 연속 → 전액 재매수<br />
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
          인출량을 자동으로 30% 수준으로 줄인다. EMA200 현금 전환(하락 중 팔지 않음)과 결합하면
          하락장에서 두 겹으로 자산을 보호하고, 상승 전환 후 복리 효과를 극대화한다.
        </Callout>

        <H3>2-3. 현금 보유 중: 외화RP 이자</H3>
        <P>
          EMA200 아래에 있어 현금으로 전환된 기간 동안,
          현금은 외화RP(연방기금금리 − 0.4%)로 이자를 받는다.
          668가지 시작 시점 어디서도 현금이 생활비 2년치 아래로 줄어드는 경우가 없었기 때문에,
          현금 잔고 기준으로 생활비를 줄이는 별도 규칙은 시뮬레이션 결과에 영향이 없었다.
          현금이 있는 한 정상적으로 생활비를 쓰면 된다.
        </P>

        <H3>2-4. 세금 처리</H3>
        <P>
          매도 시 수익분(매도가 − 평균매수가)에만 22% 양도세를 적용한다.
          250만원 기본공제는 연말에 일괄 정산해 환급한다.
          하락 신호로 전량 현금 전환할 때도, 생활비를 위해 팔 때도 똑같이 수익분에 과세한다.
          한 해 세금은 다음 해 1월에 현금에서 낸다.
        </P>
        <Callout color="yellow">
          초기 연구(3·4장 표 포함)는 현금 전환 매도에 세금을 매기지 않았다. 실제 세법상 해외 ETF 매도는 목적과 무관하게 과세되므로
          대표 수치는 이 세금을 넣어 다시 계산했다. 같은 계산 방식에서 이 세금 하나로 S0 중간값이 약 248억에서 150억으로,
          20년 뒤 원금 미만으로 끝나는 경우가 25가지에서 50가지로 바뀐다.
        </Callout>

        {/* ── 3. 주요 시나리오 비교 ────────────────────────────── */}
        <H2>3. 주요 시나리오 비교 (초기 10억, 20년)</H2>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">전략별 요약 (418가지 시작 시점)</span>
          <Link href="/posts/withdrawal-comparison/data" className="text-xs text-blue-500 dark:text-blue-400 hover:underline">
            전체 데이터 →
          </Link>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">아래 3·4장 표는 초기 탐색 단계 수치로, 운용보수만 반영(스왑금리·현금 전환 매도세 미반영)한 이론치다. 전략 간 비교용으로만 볼 것.</p>
        <Table
          headers={['전략', '생존율', '중앙값', '연평균 수익률', '최솟값', '거래수']}
          rows={[
            ['SP500기반 (구 v1)',       '100%',   '12.7억',  '4.9%',  '0.002억', '–'],
            ['SMA200 기준선',           '99.8%', '203억',   '17.6%', '0억',      '144'],
            ['SMA200 ±5% 여유폭',      '100%',  '251억',   '16.7%', '0.26억',   '25'],
            ['SMA200 연속10일 (B3)',    '100%',  '328억',   '18.6%', '0.73억',   '26'],
            ['SMA200 + 동적인출 (B3C1)', '100%', '619억',   '22.1%', '1.88억',   '26'],
            ['EMA200 연속10일 + 동적인출', '100%', '798억',  '23.8%', '1.60억',   '29'],
            [<strong key="best" className="text-blue-600 dark:text-blue-400">★ EMA200 연속15일 + 동적인출 (S0)</strong>,
              '100%', <strong key="bv" className="text-blue-600 dark:text-blue-400">1,176억</strong>,
              <strong key="bc" className="text-blue-600 dark:text-blue-400">25.9%</strong>,
              '1.68억', '21'],
          ]}
        />

        <Table
          headers={['진입 시점', '상황', 'v1(SP500기반)', 'SMA200 10일+동적인출', '★ EMA200 15일+동적인출']}
          rows={[
            ['1996-10', '닷컴버블 직전', '1.2억',  '503억',  '1,892억'],
            ['1999-03', '버블 상승 중',  '0.33억', '76억',   '180억'],
            ['2000-03', '버블 정점',     '0.04억', '11.2억', '22.2억'],
            ['2003-03', '버블 이후',     '75억',   '85억',   '252억'],
          ]}
        />

        <P>
          기존 방법론(v1)은 닷컴버블 정점(2000-03) 진입 시 0.04억으로 사실상 파산이었다.
          EMA200 15일 전략으로 22.2억까지 끌어올렸고,
          버블 직전(1996-10) 진입에서는 1,892억(약 190배)을 달성한다.
          버블 이후 저점(2003-03) 진입에서도 EMA200 15일(252억)이 SMA200 10일(85억)보다 크게 높다.
        </P>

        {/* ── 4. 설정값 탐색 세부 결과 ───────────────────────── */}
        <H2>4. 설정값 탐색 — 어떻게 이 조합을 찾았나</H2>

        <P>
          95가지 조합 테스트(EMA/SMA × 연속일 × 인출률 × 구간)와
          이중버퍼 구조 별도 테스트를 통해 각 설계 결정을 데이터로 검증했다.
        </P>

        <H3>4-1. EMA200 vs SMA200 × 연속일 필터</H3>
        <P>
          같은 인출 설정(10억/20억 구간, 월 0.3/0.5/0.7%)에서 EMA200이 SMA200을 일관되게 압도한다.
          연속일 필터는 5~20일을 테스트했고, EMA200은 15일이 가장 좋았다.
        </P>

        <Table
          headers={['이동평균', '연속일', '중앙 최종값', '연평균 수익률', '거래 횟수/20년', '최솟값']}
          rows={[
            ['SMA200', '10일', '619억',   '22.1%', '26회', '1.88억'],
            ['SMA200', '15일', '453억',   '20.4%', '21회', '1.19억'],
            ['SMA200', '20일', '648억',   '23.3%', '19회', '1.00억'],
            ['EMA200', '10일', '798억',   '23.8%', '29회', '1.60억'],
            ['EMA200', '15일', <strong key="w" className="text-green-600 dark:text-green-400">1,176억</strong>,
              <strong key="c" className="text-green-600 dark:text-green-400">25.9%</strong>, '21회', '1.68억'],
          ]}
        />

        <Callout color="blue">
          <strong>왜 EMA200이 SMA200보다 우세한가?</strong><br />
          SMA는 200일 동안 모든 날의 가중치가 동일하다. EMA는 최근 데이터에 더 높은 가중치(α=2/201≈0.01)를 부여해
          추세 전환을 더 빨리 포착한다. 인출 단계에서는 하락 초기에 빨리 현금으로 전환하고,
          반등 초기에 빨리 재진입하는 것이 유리하기 때문에 EMA200이 큰 차이를 만든다.
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
          더 많이 TQQQ를 팔아 VOO로 이동하게 되는데, VOO(1배)가 TQQQ(EMA200 보호 3배)보다
          장기 성장이 느리기 때문이다. EMA200이 이미 하락 방어를 담당하므로
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
          실생활에서 꾸준히 유지할 수 있는 전략인지가 중요하다. 복잡한 규칙은 지키다 지쳐 포기하면 무의미하기 때문이다.
          아래 수치는 모두 실제로 가능한 방식(신호 다음 거래일 매매, D10GK 조기 재매수는 LOC 주문)으로 1971~2016년에 시작해
          오늘까지 보유한 인출 포함 연 수익률 중간값이다(인출 상한 없음). 매매 횟수는 1971~2026년 전체 신호 기록 기준.
        </P>

        <Table
          headers={['전략', '매도 횟수 (55년)', '매수 후 5일 내 재매도', '해야 할 일', '인출 포함 연 수익률']}
          rows={[
            [<strong key="rule25" className="text-blue-600 dark:text-blue-400">25% 룰 (1년 고점 −25%)</strong>,
              '15번', '4번 (27%)', '주 1회 확인', <strong key="rule25v" className="text-blue-600 dark:text-blue-400">22.4%</strong>],
            [<strong key="d10gk" className="text-purple-600 dark:text-purple-400">D10GK</strong>,
              '72번', '18번 (25%)', '현금일 때 매일 밤 LOC 주문', <strong key="d10gkv" className="text-purple-600 dark:text-purple-400">20.7%</strong>],
            ['S0 (EMA200 15일)', '27번', <strong key="s0w" className="text-green-600 dark:text-green-400">0번</strong>, '주 1회 확인', '17.5%'],
          ]}
        />

        <H3>S0 — EMA200 15일, 단순하면서 안정적</H3>
        <FormulaBlock>
          매도: NDX가 EMA200 아래에서 15거래일 연속 → 전량 현금 전환<br />
          매수: NDX가 EMA200 위에서 15거래일 연속 → 전액 재매수
        </FormulaBlock>
        <P>
          매수 조건과 매도 조건이 둘 다 "15일 연속"이라, 매수 직후 최소 15거래일은
          구조적으로 보유가 보장된다. 668가지 시작 시점 전체에서 매수 다음날 재매도된 사례가
          단 한 건도 없다. 매일 확인해야 하지만 앱에서 현재 구간을 표시해주면 부담이 없다.
        </P>

        <H3>25% 룰 — 거래 횟수는 적지만 약점 있음</H3>
        <FormulaBlock>
          매도: 52주(약 1년) 최고가 대비 −25% 이상 하락 → 전량 현금 전환<br />
          매수: EMA200 위 15거래일 연속 회복 → 전액 재매수
        </FormulaBlock>
        <P>
          매매가 가장 적다(55년간 매도 15번). 하지만 매도 4번 중 1번꼴로 매수 직후(5거래일 안에) 다시 판다.
          이유는 52주 고점이 1년간 유지되기 때문이다. 큰 하락 이후 EMA200을 회복해 매수해도,
          1년 전 고점 기준 −25%는 이미 근접해있어 다음날 조금만 빠져도 매도 조건이 충족된다.
          그래도 실제로 가능한 방식으로 오늘까지 들고 가면 연 22.4%로 세 전략 중 가장 높고,
          매매를 1~3일 늦게 해도(22.4~25.1%), 기준을 −20%(20.0%)나 −30%(23.7%)로 바꿔도 S0(17.5%)보다 높다.
          대부분의 시간을 TQQQ로 들고 있다가(현금 기간 13%) 진짜 큰 폭락에서만 빠지는 구조라,
          장기 상승의 혜택을 가장 많이 받는다. 반대로 결과가 몇 번의 큰 폭락에 크게 좌우된다는 한계가 있다.
        </P>

        <H3>D10GK — S0에 급락 때 조기 재매수를 더한 전략</H3>
        <P>
          조기 재매수 조건(RSI 30 미만 + 200일 평균선보다 10% 이상 아래)은 그날 종가가 정해져야 알 수 있다.
          다음날 사면 이점이 상당 부분 사라진다(연 20.7% → 18.5%).
          대신 이 조건은 어제까지의 값으로 &ldquo;오늘 나스닥100이 X 이하로 끝나면 충족&rdquo;이라는 가격으로 바꿀 수 있다.
          그 가격을 TQQQ 가격으로 환산해 <strong className="text-gray-900 dark:text-white">LOC 매수 주문</strong>(종가가 지정가 이하일 때만 체결)을
          걸어두면 조건을 만족한 날 그 종가에 정확히 산다. 환산식은 1971년 이후 13,626거래일에서 실제 조건과 하루도 어긋나지 않았다.
          홈 화면에 매일 이 가격이 나온다.
        </P>
        <Callout color="yellow">
          <strong>닷컴버블 같은 장기 하락에서는 매수 다음날 재매도될 수 있다</strong><br />
          RSI 신호로 재진입했는데 시장이 계속 하락하면, EMA200 아래 연속일 조건이 즉시 충족돼
          1~2일 만에 재매도 신호가 뜬다. 2000~2002년 구간에서 이 사이클이 8번 반복됐다.<br /><br />
          이것은 의도된 구조다. &ldquo;재진입이 틀렸을 때 빠르게 손절&rdquo;하는 자동 안전장치로,
          이 동작을 제거하면 성능이 4.4배 떨어진다는 것이 검증됐다.
          심리적으로 가장 어려운 부분이지만 건드리지 않는 것이 맞다.
        </Callout>

        <Callout color="blue">
          <strong>매도와 200일선 매수는 LOC로 못 건다</strong><br />
          LOC 매수는 &ldquo;종가가 지정가 이하&rdquo;일 때만 체결된다. 그래서 &ldquo;종가가 X보다 낮으면 판다&rdquo;(매도)나
          &ldquo;종가가 X보다 높으면 산다&rdquo;(200일선 위 15일 매수)는 걸 수 없다. 이 둘은 아침에 신호를 보고 다음 거래일에 매매한다.
        </Callout>

        <H3>결론: 무엇을 선택할까</H3>
        <Callout color="blue">
          <strong>권장: 25% 룰 + 상한 없는 동적 인출</strong> — 연 22.4% · 일주일에 한 번 확인 · 매도 10년에 약 3번<br />
          큰돈을 지키고 싶다면 → 25% 룰 + 자산별 현금 비중 — 연 20.9% · 낙폭 −80%<br />
          매수 직후 다시 파는 일이 절대 싫다면 → S0 — 연 17.5%
        </Callout>
        <P>
          초기 연구는 S0를 대부분에게 권했지만, 실제로 가능한 방식으로 다시 계산하면 같은 수고의 25% 룰이 S0보다 꾸준히 높고,
          꺼내 쓰는 돈도 더 많다. D10GK의 높은 수익은 &lsquo;신호 당일 종가 매수&rsquo;에서 나온 것이어서 LOC 주문 없이는 유지되지 않고,
          초반 생활비도 적다. 홈 화면의 신호를 보고 규칙대로만 하면 된다.
        </P>

        {/* ── 7. 아직 해결 안 된 것들 ──────────────────────────── */}
        <H2>7. 아직 해결 안 된 것들</H2>

        <H3>확인된 것</H3>
        <ul className="list-none space-y-3 mb-6">
          {[
            { q: '✅ EMA200 > SMA200', a: 'EMA200 계열이 SMA200 계열을 전 조합에서 압도. 같은 조건(연속10일, 0.3/0.5/0.7%)에서 619억 → 798억으로 상승.' },
            { q: '✅ 15일 연속 필터가 10일보다 우세', a: '더 적은 거래(21회 vs 29회)로 더 높은 중앙값(1,176억 vs 798억). 추가 필터링이 신호 품질을 높였다.' },
            { q: '✅ 0.3/0.5/0.7% 비율 확정 (구간: 10억/20억)', a: '95개 조합 중 이 조합이 최적. 0.2/0.4/0.6%, 0.4/0.6/0.8%, 0.3/0.6/0.9% 등보다 일관되게 우세.' },
            { q: '✅ 단일버퍼(인출 상한 1500만) > 이중버퍼(초과분 VOO 이전)', a: 'TQQQ에서 1500만만 꺼내고 나머지를 3배 레버리지로 복리하는 것이, 더 많이 꺼내 VOO로 분산하는 것보다 중앙값 기준 27% 우세.' },
            { q: '✅ 초기 현금버퍼 불필요', a: '6개월, 12개월 초기 버퍼를 테스트했지만 EMA200 즉시 전환 방식이 더 우세. EMA200이 하락 초기에 알아서 현금 전환하므로 사전 버퍼 필요성 낮음.' },
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
            { q: '20일+ 연속 필터 + EMA200 조합은?', a: '20일 SMA200 조합도 순위권(같은 인출 설정 648억, 인출 구간을 바꾸면 최대 821억)이었지만 EMA200+15일(1,176억)보다 낮았다. EMA200+20일 이상은 미테스트 영역.' },
            { q: '다른 EMA 기간(EMA100, EMA150, EMA250)?', a: 'EMA200 고정 상태에서만 탐색했다. 더 짧거나 긴 EMA 기간의 효과는 검증되지 않았다.' },
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
