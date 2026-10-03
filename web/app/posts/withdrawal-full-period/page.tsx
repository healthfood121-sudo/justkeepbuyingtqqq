import Link from 'next/link'
import Header from '@/components/Header'
import WithdrawalFullPeriodExplorer from '@/components/WithdrawalFullPeriodExplorer'

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}

function Callout({ color = 'blue', children }: { color?: 'blue' | 'yellow' | 'green'; children: React.ReactNode }) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    green:  'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
  }
  return <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>{children}</div>
}

const FEATURES: { group: string; items: { name: string; rule: string; good: string; bad: string; data: string }[] }[] = [
  {
    group: '기준: 신호 없이 계속 보유',
    items: [
      { name: 'TQQQ 계속 보유', data: 'HOLD3',
        rule: '아무 신호 없이 TQQQ를 들고 매달 인출만 한다.',
        good: '2009년 바닥처럼 운 좋은 시점에 시작하면 연 47%.',
        bad: '연 8.2%로 가장 낮고, 원금 미만으로 끝난 경우 24가지. 거의 모든 경우가 한 번은 자산이 사실상 0 가까이(최대 낙폭 −100%) 떨어진다. 인출 단계에서 신호 없는 3배는 쓰면 안 된다.' },
      { name: 'QLD 계속 보유', data: 'HOLD2',
        rule: '2배를 들고 인출만.',
        good: '연 11.9%, 원금 미만 0가지.',
        bad: '최대 낙폭 −99%. 닷컴버블 정점 시작이면 26년 동안 연 0.9%.' },
      { name: '나스닥100 계속 보유', data: 'HOLD1',
        rule: '1배를 들고 인출만.',
        good: '하위 10%가 연 5.4%로 기준 셋 중 가장 고르다.',
        bad: '연 8.0%. 레버리지 없이도 닷컴버블에서는 −85% 낙폭.' },
    ],
  },
  {
    group: '200일 평균선 신호',
    items: [
      { name: '200일선 1일 (즉시 반응)', data: 'E1',
        rule: '하루라도 200일선 아래로 끝나면 팔고, 위로 끝나면 산다.',
        good: '연 16.3%로 S0보다 높고, 코로나(2020-02 시작)에서 연 32%로 가장 강했다.',
        bad: '10년에 58번 매매, 매수 후 5일 안에 다시 파는 비율 41%. 실제로 지키기 매우 피곤하고 양도세를 자주 낸다.' },
      { name: 'S0 (200일선 15일)', data: 'S0',
        rule: '200일선 아래 15거래일 연속이면 팔고, 위 15일 연속이면 산다.',
        good: '매수 직후 재매도 0%. 10년에 약 10번 매매. 규칙이 가장 이해하기 쉽다.',
        bad: '연 15.1%로 신호 전략 중 낮은 편. 닷컴버블 정점 시작이면 연 5.3%.' },
      { name: 'S0 + 인출 조절(GK)', data: 'S4',
        rule: 'S0에 더해, 인출액이 처음보다 20% 넘게 커지면 줄이고 많이 줄면 늘린다(Guyton-Klinger).',
        good: '연 15.9%로 S0보다 조금 높다. 매매는 S0와 같다.',
        bad: '인출액이 매년 바뀌어 생활비 계획이 어렵다. 효과는 크지 않다.' },
    ],
  },
  {
    group: '급락 때 조기 재매수',
    items: [
      { name: 'S0 + RSI 조기 재매수', data: 'S7',
        rule: '현금일 때 RSI가 30 아래로 떨어지면 LOC 주문으로 그날 종가에 산다.',
        good: '연 16.5%. 블랙먼데이 직전 시작에서 강했다(연 16.8%).',
        bad: '하위 10%가 연 9.9%로 S0보다 나쁘다. 하락 중간에 너무 일찍 사는 경우가 많다.' },
      { name: 'D10GK', data: 'D10GK',
        rule: 'RSI 30 미만 + 200일선보다 10% 이상 아래일 때만 조기 재매수(LOC) + 인출 조절(GK).',
        good: '연 18.5%. 30년 시점 중간값 1,650억으로 S0(378억)의 4배.',
        bad: '현금일 때 매일 밤 주문을 걸어야 한다. 매수 후 5일 내 재매도 22%. 금융위기 직전 시작(연 11.5%)은 S0보다 낮다.' },
    ],
  },
  {
    group: '1년 최고 종가 대비 하락으로 매도',
    items: [
      { name: 'T15 · T20', data: 'T20',
        rule: '최근 1년 최고 종가보다 15%·20% 낮게 끝나면 판다. 매수는 200일선 위 15일.',
        good: '연 16.5%·17.4%로 S0보다 높다. 닷컴버블 정점 시작에서도 연 9~11%.',
        bad: '−15%는 매수 직후 재매도가 36%로 잦다. 보통 조정에도 팔게 된다.' },
      { name: 'T25 (고점 −25%)', data: 'T25',
        rule: '최근 1년 최고 종가보다 25% 낮게 끝나면 판다. 매수는 200일선 위 15일.',
        good: '연 22.1%, 하위 10%도 연 18.3%로 모든 전략 중 가장 높은 축. 7가지 나쁜 시작 시점 중 4곳에서 1~2위. 10년에 약 5번 매매, 일주일에 한 번 확인으로 충분.',
        bad: '자산 최대 낙폭 중간값 −91% — 25% 떨어진 뒤에야 팔기 때문에 TQQQ는 이미 크게 빠진 상태다. 매도 4번 중 1번은 매수 직후 재매도.' },
      { name: 'T30 (고점 −30%)', data: 'T30',
        rule: '최근 1년 최고 종가보다 30% 낮게 끝나면 판다.',
        good: '연 22.7%로 가장 높다. 10년에 3번도 안 되는 매매.',
        bad: '2022년 하락장 직전 시작은 연 8.0%로 최하위권. 큰 폭락이 아니면 거의 반응하지 않는다.' },
    ],
  },
  {
    group: '자산이 커지면 레버리지 낮춤',
    items: [
      { name: 'S0 + 자산별 현금 / DLEV', data: 'C50',
        rule: '총자산 50억 이상이면 TQQQ ⅔ + 현금(또는 나스닥100) ⅓, 200억 이상이면 TQQQ ⅓.',
        good: '최대 낙폭 중간값 −73%로 TQQQ 전략 중 가장 얕다. 30~40년 시점 하위 10%가 S0보다 높다.',
        bad: '연 12.6~12.8%로 S0보다 낮다. 오래 들고 갈수록 현금으로 빼둔 만큼 덜 번다.' },
      { name: 'D10GK · T25 + 자산별 현금', data: 'T25C50',
        rule: '조기 재매수나 고점 −25% 매도에 자산별 현금 비중을 더함.',
        good: '최대 낙폭이 −79~80%로 원래 전략보다 10%p 얕다. 닷컴버블 정점 시작에서 연 9~10%로 버틴다.',
        bad: '연 13.9%·15.8%로 원래 전략(18.5%·22.1%)보다 크게 낮다.' },
    ],
  },
]

export default function WithdrawalFullPeriodPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-5xl" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6 inline-block">← 목록으로</Link>
        <h1 className="text-3xl font-black leading-tight mb-4">
          모든 인출 전략을 1971년부터 오늘까지: 10·20·30·40·50년에 어떻게 달라졌나
        </h1>
        <p className="text-sm text-gray-400 mb-10">2026-10-03 · 인출식 · 16가지 전략 · 668가지 시작 시점</p>

        <Callout color="yellow">
          <strong>왜 다시 했나.</strong> 지금까지 인출 전략은 모두 20년에서 잘라 비교했다. 그런데 20년으로 자르면
          1970년대에 시작한 경우가 고금리기 직후에 끊겨 &lsquo;원금 미만&rsquo;으로 잡히고, 매매를 하루 이틀만 늦게 해도
          중간값이 크게 흔들렸다. 이번에는 모든 시작 시점을 <strong>오늘(2026-09)까지 끝까지</strong> 들고 가고,
          중간에 10·20·30·40·50년 시점의 자산을 함께 기록했다.
        </Callout>

        <Callout color="blue">
          <strong>계산 조건 (모든 전략 공통)</strong><br />
          · 초기 10억, 1971-02 ~ 2026-09 매달 시작 (668가지)<br />
          · <strong>인출: 동적 인출률</strong> — 매달 총자산의 0.3%(10억 미만) / 0.5%(10~20억) / 0.7%(20억 이상), 월 최대 1,500만원.
          현금으로 있을 때 현금이 2년치 생활비보다 적으면 인출을 줄인다<br />
          · TQQQ 운용보수 0.88% + 스왑금리(기준금리 × 2), QLD는 0.95% + 기준금리 × 1<br />
          · 모든 매도에 양도세 22% (연 250만원 공제) — 하락 신호로 전량 팔 때 포함<br />
          · 현금은 외화RP: 기준금리 − 0.4% 이자, 이자소득세 15.4%<br />
          · 매매는 신호 다음 거래일 종가 (조기 재매수만 LOC 주문으로 그날 종가)<br />
          · 금액은 물가 상승을 빼지 않은 금액
        </Callout>

        <H2>한눈에 보는 결론</H2>
        <ul className="space-y-2 mb-6 text-gray-600 dark:text-gray-300 text-sm leading-relaxed list-disc pl-5">
          <li><strong className="text-gray-900 dark:text-white">끝까지 들고 가면 신호가 있는 전략은 원금 미만이 0가지다.</strong> 20년에서 자를 때 나왔던 &lsquo;망한 경우&rsquo;는 대부분 기간을 자른 탓이었다. 신호 없이 TQQQ만 들고 가면 24가지가 원금 미만이다.</li>
          <li><strong className="text-gray-900 dark:text-white">1년 최고 종가 대비 −25~30%에 파는 전략(T25·T30)이 연 22% 수준으로 가장 높고, 하위 10%도 연 18%대로 가장 높다.</strong> 매매도 10년에 3~5번으로 가장 적다.</li>
          <li><strong className="text-gray-900 dark:text-white">대신 자산이 크게 줄어드는 구간은 피할 수 없다.</strong> TQQQ를 쓰는 모든 전략에서 자산이 최고점 대비 −70~90% 줄어드는 시기가 한 번은 온다. 자산별 현금 비중이 이 낙폭을 가장 많이 줄이지만 수익도 줄어든다.</li>
          <li>전략 간 차이는 10~20년 시점에는 작고, <strong className="text-gray-900 dark:text-white">30년 이후 크게 벌어진다.</strong> 복리 차이가 쌓이기 때문이다.</li>
        </ul>

        <H2>전체 비교</H2>
        <WithdrawalFullPeriodExplorer />

        <H2>전략별 특징</H2>
        {FEATURES.map(g => (
          <div key={g.group} className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">{g.group}</h3>
            <div className="space-y-3">
              {g.items.map(it => (
                <div key={it.name} className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                  <div className="flex justify-between items-baseline gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{it.name}</p>
                    <Link href={`/posts/withdrawal-full-period/data?s=${it.data}&y=full`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{it.rule}</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300"><span className="text-green-600 dark:text-green-400 font-semibold">강점</span> {it.good}</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5"><span className="text-red-600 dark:text-red-400 font-semibold">약점</span> {it.bad}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <H2>주의할 점</H2>
        <ul className="space-y-2 mb-6 text-gray-600 dark:text-gray-300 text-sm leading-relaxed list-disc pl-5">
          <li><strong>인출 상한 때문에 후반 숫자가 비현실적으로 커진다.</strong> 월 1,500만원 상한이 있어 자산이 수백억이 되면 인출 비중이 거의 0이 된다. 40·50년 시점의 수천억·수조 원은 &lsquo;전략 간 차이가 얼마나 벌어지나&rsquo;를 보는 용도로만 볼 것.</li>
          <li><strong>큰 폭락 몇 번에 결과가 크게 좌우된다.</strong> 55년 동안 나스닥100이 1년 고점 대비 25% 넘게 빠진 큰 하락은 열 번 남짓이다. T25·T30이 좋았던 이유도 이 몇 번을 잘 피했기 때문이고, 다음 폭락이 다른 모양이면 결과도 달라질 수 있다.</li>
          <li>50년 시점은 1971~1976년 시작분 68가지뿐이다. 1985년 이전 나스닥100 값은 다른 지수로 이어 붙인 값이다.</li>
          <li>TQQQ·QLD 가격은 나스닥100 일별 수익률로 만든 이론 가격이다 (운용보수·스왑금리 반영, 추적오차 미반영).</li>
        </ul>

        <Callout color="green">
          <strong>다음 글:</strong> 이 결과를 바탕으로 권장 전략을 새로 짠다.
          지금 기준으로 단순함과 수익을 모두 갖춘 후보는 T25이고, 낙폭을 줄이는 장치(자산별 현금 비중 등)를 어디까지 붙일지가 남은 문제다.
          매일 신호는 <Link href="/" className="underline">홈 화면</Link>에서, 기존 방법론은 <Link href="/posts/withdrawal-guide" className="underline">인출식 방법론</Link>에서 볼 수 있다.
        </Callout>
      </main>
    </div>
  )
}
