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

function B({ children }: { children: React.ReactNode }) {
  return <strong className="text-gray-900 dark:text-white">{children}</strong>
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

function DataLink({ mode, m }: { mode: string; m: string }) {
  return (
    <Link
      href={`/posts/withdrawal-asym-days/data?mode=${mode}&m=${m}`}
      className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap"
    >
      데이터 →
    </Link>
  )
}

const TH = 'py-2 px-2 text-right text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap'
const TD = 'py-2 px-2 text-right font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap'

type Row = {
  label: string; m: string; base?: boolean; dim?: boolean
  med: number; p10: number; minMed: number; b5: number; b3: number; trades: number; whip: number
}

// withdrawal_asym_detail.json — v2(스왑금리 반영) 요약값
const SAME: Row[] = [
  { label: '매도 15일 · 매수 15일 (S0)', m: 'S15B15', base: true, med: 270, p10: 14.2, minMed: 6.2, b5: 32, b3: 8,  trades: 20.6, whip: 1.0 },
  { label: '매도 15일 · 매수 1일',       m: 'S15B1',  med: 441, p10: 20.2, minMed: 4.3, b5: 67, b3: 14, trades: 30.0, whip: 5.2 },
  { label: '매도 15일 · 매수 2일',       m: 'S15B2',  med: 400, p10: 20.5, minMed: 4.6, b5: 59, b3: 13, trades: 28.2, whip: 4.3 },
  { label: '매도 20일 · 매수 1일',       m: 'S20B1',  med: 428, p10: 26.0, minMed: 4.7, b5: 57, b3: 14, trades: 24.4, whip: 2.8 },
  { label: '매도 10일 · 매수 1일',       m: 'S10B1',  med: 374, p10: 34.0, minMed: 6.5, b5: 27, b3: 7,  trades: 37.6, whip: 7.3 },
]

const NEXT: Row[] = [
  { label: '매도 15일 · 매수 15일 (S0)', m: 'S15B15', base: true, med: 209, p10: 11.5, minMed: 5.1, b5: 47, b3: 15, trades: 20.6, whip: 1.0 },
  { label: '매도 15일 · 매수 1일',       m: 'S15B1',  med: 351, p10: 15.0, minMed: 3.6, b5: 75, b3: 33, trades: 30.0, whip: 5.2 },
  { label: '매도 15일 · 매수 2일',       m: 'S15B2',  med: 322, p10: 18.2, minMed: 4.0, b5: 72, b3: 22, trades: 28.2, whip: 4.3 },
  { label: '매도 20일 · 매수 1일',       m: 'S20B1',  med: 307, p10: 19.6, minMed: 3.6, b5: 70, b3: 30, trades: 24.3, whip: 2.8 },
  { label: '매도 10일 · 매수 1일',       m: 'S10B1',  med: 393, p10: 24.7, minMed: 5.9, b5: 36, b3: 8,  trades: 37.6, whip: 7.3 },
]

function ResultTable({ rows, mode }: { rows: Row[]; mode: string }) {
  const base = rows.find(r => r.base)!
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium">조합</th>
            <th className={TH}>20년 후<br />중앙값</th>
            <th className={TH}>하위 10%</th>
            <th className={TH}>최저 자산<br />(중앙값)</th>
            <th className={TH}>5억 아래로<br />떨어진 비율</th>
            <th className={TH}>3억 아래</th>
            <th className={TH}>20년<br />매매 횟수</th>
            <th className="py-2 px-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map(r => (
            <tr key={r.m} className={r.base ? 'bg-blue-50/60 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}>
              <td className="py-2 px-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{r.label}</td>
              <td className={`${TD} font-semibold ${r.med > base.med ? 'text-blue-600 dark:text-blue-400' : ''}`}>{r.med}억</td>
              <td className={TD}>{r.p10}억</td>
              <td className={`${TD} ${r.minMed < base.minMed ? 'text-red-600 dark:text-red-400' : r.minMed > base.minMed ? 'text-green-600 dark:text-green-400' : ''}`}>{r.minMed}억</td>
              <td className={`${TD} font-semibold ${r.b5 > base.b5 ? 'text-red-600 dark:text-red-400' : r.b5 < base.b5 ? 'text-green-600 dark:text-green-400' : ''}`}>{r.b5}%</td>
              <td className={`${TD} ${r.b3 > base.b3 ? 'text-red-600 dark:text-red-400' : r.b3 < base.b3 ? 'text-green-600 dark:text-green-400' : ''}`}>{r.b3}%</td>
              <td className={TD}>{r.trades}회</td>
              <td className="py-2 px-2 text-right"><DataLink mode={mode} m={r.m} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// withdrawal_asym_days.json / run_detail — v2, 당일 체결
const HEAT_SELL = [5, 10, 12, 15, 20, 25]
const HEAT_BUY = [1, 2, 3, 5, 10, 15]
const HEAT_MED = [
  [268, 150, 139, 102, 72, 36],
  [374, 312, 270, 227, 196, 121],
  [401, 423, 358, 302, 284, 276],
  [441, 400, 342, 298, 286, 270],
  [428, 389, 358, 301, 234, 261],
  [338, 308, 289, 242, 213, 300],
]
const HEAT_B5 = [
  [24, 25, 26, 39, 62, 59],
  [27, 30, 31, 36, 47, 34],
  [45, 48, 49, 52, 47, 30],
  [67, 59, 67, 74, 71, 32],
  [56, 58, 57, 63, 66, 37],
  [68, 62, 64, 68, 70, 64],
]

function heatColor(t: number) {
  // t: 0(나쁨) ~ 1(좋음)
  if (t > 0.8) return 'bg-green-200 dark:bg-green-700/60'
  if (t > 0.6) return 'bg-green-100 dark:bg-green-800/40'
  if (t > 0.4) return 'bg-gray-100 dark:bg-gray-800'
  if (t > 0.2) return 'bg-red-100 dark:bg-red-900/40'
  return 'bg-red-200 dark:bg-red-800/60'
}

function Heatmap({ data, unit, higherBetter, lo, hi }: { data: number[][]; unit: string; higherBetter: boolean; lo: number; hi: number }) {
  return (
    <div className="overflow-x-auto mb-2">
      <table className="text-xs border-separate border-spacing-0.5 mx-auto">
        <thead>
          <tr>
            <th className="px-2 py-1 text-gray-400 font-normal text-left whitespace-nowrap">매도↓ 매수→</th>
            {HEAT_BUY.map(b => <th key={b} className="px-2 py-1 text-gray-500 dark:text-gray-400 font-medium">{b}일</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={HEAT_SELL[i]}>
              <td className="px-2 py-1 text-gray-500 dark:text-gray-400 font-medium">{HEAT_SELL[i]}일</td>
              {row.map((v, j) => {
                let t = (v - lo) / (hi - lo)
                t = Math.max(0, Math.min(1, higherBetter ? t : 1 - t))
                const isS0 = HEAT_SELL[i] === 15 && HEAT_BUY[j] === 15
                return (
                  <td key={j} className={`px-2 py-1.5 text-center font-mono rounded ${heatColor(t)} ${isS0 ? 'ring-2 ring-blue-500' : ''} text-gray-800 dark:text-gray-100`}>
                    {v}{unit}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function WithdrawalAsymDaysPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-2">
          <Link href="/posts/withdrawal-guide" className="text-xs text-blue-500 dark:text-blue-400 hover:underline">
            ← 인출식 방법론 허브
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-snug">
          팔 때는 천천히, 살 때는 빨리? — 매도·매수 기준일을 따로 정하면
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">2026-10-03</p>
        <div className="flex flex-wrap gap-1.5 mb-10">
          {['인출식', 'S0', '매수 기준', '매도 기준', 'FIRE', 'TQQQ', '백테스트'].map(t => <Tag key={t}>{t}</Tag>)}
        </div>

        <Callout color="blue">
          <strong>결론 요약</strong><br />
          • 매도는 15일 그대로, 매수만 1~2일로 앞당기면 20년 후 자산 중앙값이 <strong>1.5~1.7배</strong> 커진다.<br />
          • 그런데 그 대가로 <strong>자산이 10억 → 5억 아래까지 떨어지는 경우가 2배</strong>로 늘어난다 (32% → 67%).<br />
          • 인출 생활은 "가장 나빴던 순간"을 버텨야 하는 게임이다. <strong>판정: S0(매도 15일 · 매수 15일) 유지.</strong><br />
          • 매도 10일 · 매수 1일은 두 지표 모두 좋아 보이지만, 하루만 바꿔도 결과가 크게 흔들려 채택하지 않는다.
        </Callout>

        <H2>배경: 왜 매수와 매도가 같은 15일이어야 하나</H2>
        <P>
          현재 권장 전략 S0는 나스닥100 원지수가 200일 지수이동평균 아래에서 <B>15거래일 연속</B>이면 TQQQ를 전부 팔고,
          위에서 <B>15거래일 연속</B>이면 다시 산다. 예전 설정값 탐색에서는 이 "15일"을 매도·매수에 똑같이 적용한 경우만 비교했다.
        </P>
        <P>
          그런데 파는 판단과 사는 판단이 꼭 같은 속도여야 할 이유는 없다. 하락 신호는 신중하게 확인하고,
          반등 신호는 빨리 따라가는 편이 나을 수도 있다. 그래서 매도 기준일과 매수 기준일을 각각
          1·2·3·5·7·10·12·15·20·25·30·40일로 바꿔가며 <B>144가지 조합</B>을 모두 돌려봤다.
        </P>
        <P>
          시뮬레이션은 기존 인출식 글과 같다. 10억으로 시작해 동적 인출률(0.3/0.5/0.7%)로 매달 생활비를 꺼내고,
          세금·수수료·현금 이자를 반영한다. 1971~2004년 매월 시작한 <B>418가지 진입 시점</B>을 각각 20년씩 돌렸다.
          매도 15일 · 매수 15일 조합은 기존 S0 결과(1,176억, 스왑금리 반영 시 270억)를 그대로 재현했다.
        </P>

        <H3>이번에는 보수적으로 본다</H3>
        <P>
          인출 단계는 적립 단계와 다르다. 매달 생활비를 꺼내고 있기 때문에, 자산이 크게 줄어든 상태에서 공포에 질려
          전략을 포기하면 회복이 불가능하다. 20년 후 금액이 커지는 것보다 <B>중간에 멘탈이 무너지지 않는 것</B>이 먼저다.
          그래서 이번 글은 다음 기준으로 판단했다.
        </P>
        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 space-y-1">
          <li><B>스왑금리 반영 수치를 기본으로</B> — 실제 TQQQ는 레버리지 비용(대략 기준금리 × 2)을 낸다. 반영 전 수치는 참고로만 쓴다.</li>
          <li><B>다음날 체결도 확인</B> — 신호가 확인된 날 종가에 바로 사고팔 수 없는 경우를 가정한다.</li>
          <li><B>최저 자산</B> — 20년 동안 총자산이 가장 낮았던 순간. 10억으로 시작했을 때 이게 5억, 3억 아래로 내려가면 버티기 어렵다.</li>
          <li><B>매매 횟수, 산 지 3개월 안에 다시 판 횟수</B> — "괜히 샀다"를 몇 번 겪는지.</li>
        </ul>

        <H2>1. 수익만 보면: "천천히 팔고 빨리 사기"가 압도적</H2>
        <P>
          스왑금리 반영 · 당일 체결 기준, 20년 후 자산 중앙값이다. 파란 테두리가 현재 S0.
        </P>
        <Heatmap data={HEAT_MED} unit="" higherBetter lo={100} hi={440} />
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-6">단위: 억 · 초록일수록 큼</p>
        <P>
          매도 기준을 12~20일로 두고 매수 기준을 1~2일로 줄이면 중앙값이 400억대로 올라간다. 한 칸만 튀는 게 아니라
          넓은 영역이 고르게 좋아서, 우연이라고 보기는 어렵다. 스왑금리 반영 전 수치로도 같은 모양이다
          (S0 1,176억 → 매도 15일 · 매수 1일 2,034억, 진입 시점의 98%에서 S0보다 많이 남음).
        </P>
        <P>
          이유도 단순하다. 하락장에서 팔고 나면, 다시 이동평균 위로 올라왔을 때 15일을 기다리는 동안 3배 레버리지 반등의
          초반을 놓친다. 빨리 사면 그 구간을 먹는다. 매도는 여전히 15일 확인을 거치니 산 다음날 바로 파는 일도 없다.
        </P>

        <H2>2. 그런데 바닥을 보면: 절반 아래로 떨어지는 경우가 2배</H2>
        <P>
          같은 격자에서 이번에는 <B>20년 중 한 번이라도 총자산이 5억 아래로 떨어진 진입 시점의 비율</B>을 봤다.
        </P>
        <Heatmap data={HEAT_B5} unit="%" higherBetter={false} lo={20} hi={70} />
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-6">초록일수록 5억 아래로 떨어진 경우가 적음</p>
        <P>
          그림이 정반대가 된다. 수익이 가장 좋았던 "매도 15일 · 매수 1일"은 <B>67%</B>의 경우 자산이 절반 아래로 내려간다.
          S0는 32%다. 눈에 띄는 건 맨 오른쪽 열(매수 15일)이다. 매도 기준이 10~20일일 때, 매수 기준을 15일로 맞춰두면
          5억 아래로 떨어지는 비율이 30% 안팎으로 가장 낮다. 지금의 S0가 이 지표에서는 이미 좋은 자리에 있다.
        </P>

        <H3>스왑금리 반영 · 당일 체결</H3>
        <ResultTable rows={SAME} mode="v2_same" />
        <H3>스왑금리 반영 · 다음날 체결 (가장 보수적인 가정)</H3>
        <ResultTable rows={NEXT} mode="v2_next" />
        <P>
          다음날 체결로 바꾸면 차이는 더 커진다. 매도 15일 · 매수 1일은 <B>75%</B>가 5억 아래, <B>33%</B>가 3억 아래로 떨어진다.
          S0는 각각 47%, 15%다. 20년 후 중앙값은 1.7배지만, 그 20년 중에 10억이 3억이 되는 걸 볼 확률이 2배 넘게 높다.
        </P>

        <H3>왜 이런 일이 생기나: 하락장 속 반등</H3>
        <P>
          길게 이어지는 하락장(1973~74년, 2000~02년)에는 중간중간 짧은 반등이 여러 번 나온다. 매수 기준이 1일이면
          지수가 하루만 이동평균 위로 올라와도 TQQQ를 산다. 그런데 파는 건 15일 연속을 확인해야 하므로,
          반등이 꺾이면 <B>3배 레버리지로 15일 동안 하락을 고스란히 맞은 뒤에야</B> 빠져나온다. 이걸 몇 번 반복하면 원금이 크게 깎인다.
        </P>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium">진입 시기</th>
                <th className={TH}>S0 (15·15)</th>
                <th className={TH}>매도 15 · 매수 1</th>
                <th className={TH}>매도 10 · 매수 1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[
                ['1971~1979년', 9, 78, 1],
                ['1980~1989년', 75, 92, 64],
                ['1990~1999년', 6, 12, 8],
                ['2000~2004년', 32, 95, 31],
              ].map(([era, a, b, c]) => (
                <tr key={era as string}>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{era}</td>
                  <td className={TD}>{a}%</td>
                  <td className={`${TD} text-red-600 dark:text-red-400 font-semibold`}>{b}%</td>
                  <td className={TD}>{c}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">자산이 5억 아래로 떨어진 진입 시점 비율 · 스왑금리 반영 · 당일 체결</p>
        </div>
        <P>
          1970년대에 시작했다면 S0는 10번 중 1번만 5억 아래를 봤지만, 매수 1일 조합은 10번 중 8번이다.
          2000년대 초 시작은 거의 전부(95%)가 절반 아래로 내려간다. 최종 금액이 커서 "결국 이긴다"고 해도,
          은퇴 첫 몇 년 사이에 10억이 4억이 되는 걸 보며 버틸 수 있는 사람은 많지 않다.
        </P>

        <H2>3. 매도 10일 · 매수 1일은 어떤가</H2>
        <P>
          표에서 유일하게 두 마리 토끼를 잡은 듯한 조합이 있다. <B>매도 10일 · 매수 1일</B>이다.
          스왑금리 반영 · 당일 체결 기준 중앙값 374억(S0 270억), 5억 아래 비율 27%(S0 32%). 다음날 체결에서도
          393억 vs 209억, 36% vs 47%로 앞선다. 하위 10%도 S0보다 2배 이상 높다.
        </P>
        <Callout color="yellow">
          <strong>그래도 채택하지 않는 이유</strong><br /><br />
          <strong>① 하루 차이에 결과가 크게 흔들린다.</strong> 매도 기준을 11일, 12일로 바꾸면 다음날 체결 기준 5억 아래 비율이
          57%, 68%로 치솟는다(S0 47%). 10일만 좋은 건 그 기간 특정 날짜들이 우연히 맞아떨어졌을 가능성이 크다.<br /><br />
          <strong>② 매매가 2배 가까이 많다.</strong> 20년간 평균 38회(S0 21회). 산 지 3개월 안에 다시 파는 일이 평균 7회, 많게는 12회다
          (S0는 평균 1회). "판 가격보다 비싸게 다시 산" 경험도 평균 15회로 S0(8회)의 2배다.<br /><br />
          <strong>③ S&P500 3배로 따로 돌려보면 개선 폭이 작다.</strong> 나스닥100 데이터에 맞춰 고른 조합이라 다른 지수에서도 통하는지 확인했는데,
          스왑금리 반영 중앙값 14억 vs 11억, 5억 아래 비율 52% vs 57%로 소폭 개선에 그쳤다.
        </Callout>

        <H2>4. 따로 확인한 것</H2>
        <H3>스왑금리를 넣어도 매매 시점은 같다</H3>
        <P>
          매매 신호는 나스닥100 원지수로 판단하기 때문에, 스왑금리를 넣든 빼든 <B>언제 사고파는지는 완전히 같다</B>.
          달라지는 건 TQQQ의 수익률뿐이다. 그래서 스왑금리 반영 여부는 순위를 거의 바꾸지 않았다.
          다만 반영하면 보유 비용이 커지기 때문에, 하락장 반등에 잘못 올라탔을 때의 손실도 더 아프다.
          매수 1일 조합의 5억 아래 비율이 반영 전 19% → 반영 후 67%로 크게 뛴 이유다(S0는 12% → 32%).
        </P>
        <H3>어떤 조합이든 생활비가 크게 줄어드는 시기는 온다</H3>
        <Callout color="red">
          스왑금리 반영 시, S0를 포함한 모든 조합에서 월 생활비 한도가 최고점 대비 <strong>80~90% 줄어드는 시기</strong>가
          대부분의 진입 시점에서 한 번은 온다. 동적 인출률은 자산이 줄면 생활비도 같이 줄여서 파산을 막는 구조이기 때문이다.
          매도·매수 기준일 조정으로는 이 부분이 바뀌지 않는다. 인출 단계에 들어가기 전에 생활비를 크게 줄여도 버틸 수 있는
          대비(다른 수입원, 별도 현금)가 필요하다는 점은 어떤 조합을 쓰든 같다.
        </Callout>

        <H2>판정</H2>
        <div className="space-y-3 mb-8">
          {[
            {
              label: '매도 15일 · 매수 15일 (S0)',
              verdict: '유지',
              color: 'border-blue-300 dark:border-blue-700',
              badge: 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
              desc: '20년 후 금액은 가장 크지 않지만, 자산이 절반 아래로 떨어지는 비율이 주변 조합 중 가장 낮은 편이다. 매매도 20년에 21회, 산 지 3개월 안에 파는 일이 거의 없다. 인출 생활자에게 가장 버티기 쉬운 조합.',
            },
            {
              label: '매도 15일 · 매수 1~2일',
              verdict: '비권장',
              color: 'border-red-200 dark:border-red-800/50',
              badge: 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400',
              desc: '중앙값은 1.5~1.7배지만 자산이 5억 아래로 떨어지는 경우가 2배(67~75%), 3억 아래도 2배 안팎. 하락장 속 짧은 반등마다 들어갔다가 15일간 3배로 맞고 나오는 구조. 수익 극대화가 목적이라도 인출 단계에는 맞지 않는다.',
            },
            {
              label: '매도 10일 · 매수 1일',
              verdict: '참고만',
              color: 'border-yellow-300 dark:border-yellow-700/60',
              badge: 'bg-yellow-50 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
              desc: '숫자는 S0보다 모두 좋지만, 매도 기준을 하루만 바꿔도 결과가 무너지고 매매가 2배다. 우연히 맞아떨어진 설정일 가능성이 높아 채택하지 않는다.',
            },
          ].map(({ label, verdict, color, badge, desc }) => (
            <div key={label} className={`border rounded-xl px-4 py-3 ${color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{verdict}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <Callout color="green">
          <strong>한 줄 정리</strong><br />
          빨리 사면 더 많이 남는다. 하지만 인출 중에는 &ldquo;얼마나 남느냐&rdquo;보다 &ldquo;얼마까지 떨어지느냐&rdquo;가 전략을 지키게 해준다.
          매수와 매도를 같은 15일로 두는 S0가 그 균형점이다.
        </Callout>

        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed mb-8">
          데이터: 나스닥100 1971~2026, 418가지 진입 시점 × 20년 · 3배 합성가격(운용보수 0.88%, 스왑금리는 연방기금금리 × 2 일할 차감) ·
          S&P500 3배 검증은 1955~2006년 620가지 진입 시점 · 스크립트 <code>scripts/withdrawal_asym_days.py</code>
        </p>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">관련 글</p>
          <div className="space-y-2">
            <Link href="/posts/withdrawal-asym-days/data" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span className="text-blue-400">→</span> 데이터 뷰어 — 조합별·진입 시점별 최저 자산과 매매 기록
            </Link>
            <Link href="/posts/withdrawal-guide" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span className="text-blue-400">→</span> 인출식 방법론 허브 — 전략 비교 및 연구 흐름 전체
            </Link>
            <Link href="/posts/withdrawal-signal-test" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span className="text-blue-400">→</span> 10억 달성 후 바로 꺼낼까, 1~2년 더 기다릴까
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
