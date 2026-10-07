import Link from 'next/link'
import Header from '@/components/Header'
import WithdrawalFullPeriodExplorer from '@/components/WithdrawalFullPeriodExplorer'
import Rule25PeriodTable from '@/components/Rule25PeriodTable'

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
        good: '운 좋은 시점에 시작하면 초반에 많이 꺼내 쓴다 (2009년 바닥 시작이면 연 66%). 그래서 인출 포함 수익률 중간값은 23.0%로 높게 나온다.',
        bad: '548가지 중 232가지(42%)가 남은 자산 10억 미만으로 끝난다. 20년 시점 월 생활비 하위 10%가 7만원 — 사실상 생활비가 끊긴다. 닷컴버블 정점 시작은 연 −7.7%. 운에 거는 방식이다.' },
      { name: 'QLD 계속 보유', data: 'HOLD2',
        rule: '2배를 들고 인출만.',
        good: '연 19.6%, 10억 미만 0가지.',
        bad: '자산이 최고점 대비 −99%까지 줄어드는 시기가 온다. 20년 시점 생활비 중간값이 833만원으로 10년 시점(1,433만원)보다 낮다.' },
      { name: '나스닥100 계속 보유', data: 'HOLD1',
        rule: '1배를 들고 인출만.',
        good: '생활비가 가장 고르다 — 20년 시점 하위 10%도 월 763만원.',
        bad: '연 14.1%로 가장 낮다. 레버리지 없이도 닷컴버블에서 −90% 낙폭.' },
    ],
  },
  {
    group: '200일 평균선 신호',
    items: [
      { name: '200일선 1일 (즉시 반응)', data: 'E1',
        rule: '하루라도 200일선 아래로 끝나면 팔고, 위로 끝나면 산다.',
        good: '연 18.6%, 하위 10%도 14.7%. 코로나(2020-02 시작)에서 가장 강했다.',
        bad: '10년에 58번 매매, 매수 후 5일 안에 다시 파는 비율 41%. 지키기 매우 피곤하고 양도세를 자주 낸다.' },
      { name: 'S0 (200일선 15일)', data: 'S0',
        rule: '200일선 아래 15거래일 연속이면 팔고, 위 15일 연속이면 산다.',
        good: '매수 직후 재매도 0%. 10년에 약 10번 매매. 규칙이 가장 이해하기 쉽다.',
        bad: '연 17.5%로 신호 전략 중 낮은 편. 20년 시점 생활비 하위 10%가 월 203만원으로 낮다.' },
      { name: 'S0 + 인출 조절(GK)', data: 'S4',
        rule: 'S0에 더해, 인출액이 처음보다 20% 넘게 커지면 줄이고 많이 줄면 늘린다(Guyton-Klinger).',
        good: '연 17.8%. 자산이 커질 때 덜 꺼내 30년 이후 자산이 S0보다 크다.',
        bad: '초반 생활비가 S0보다 적다 (10년 시점 1,025만원 vs 1,566만원).' },
    ],
  },
  {
    group: '급락 때 조기 재매수',
    items: [
      { name: 'S0 + RSI 조기 재매수', data: 'S7',
        rule: '현금일 때 RSI가 30 아래로 떨어지면 LOC 주문으로 그날 종가에 산다.',
        good: '연 20.4%.',
        bad: '하위 10%가 연 12.0%로 S0보다 낮다. 하락 중간에 너무 일찍 사는 경우가 많다.' },
      { name: 'D10GK', data: 'D10GK',
        rule: 'RSI 30 미만 + 200일선보다 10% 이상 아래일 때만 조기 재매수(LOC) + 인출 조절(GK).',
        good: '연 20.7%, 최악의 경우도 연 10.8%. 30년 시점 꺼내 쓴 돈 + 남은 자산 중간값 1,322억으로 모든 전략 중 가장 크다.',
        bad: '초반 생활비가 적다 (10년 시점 월 1,111만원, 25% 룰은 2,029만원). 현금일 때 매일 밤 주문을 걸어야 하고 매수 후 5일 내 재매도 22%.' },
    ],
  },
  {
    group: '1년 최고 종가 대비 하락으로 매도',
    items: [
      { name: '15% · 20% 룰', data: 'RULE20',
        rule: '최근 1년 최고 종가보다 15%·20% 낮게 끝나면 판다. 매수는 200일선 위 15일.',
        good: '연 19.4%·20.0%로 S0보다 높다. 닷컴버블 정점 시작에서도 연 10.6~11.8%.',
        bad: '−15%는 매수 직후 재매도가 36%로 잦다. 보통 조정에도 팔게 된다.' },
      { name: '25% 룰 (고점 −25%)', data: 'RULE25',
        rule: '최근 1년 최고 종가보다 25% 낮게 끝나면 판다. 매수는 200일선 위 15일.',
        good: '연 22.4%, 하위 10%도 연 17.1%. 10·20년 시점 생활비가 가장 많은 축(월 2,029만원 → 8,340만원). 10년에 약 5번 매매, 일주일에 한 번 확인으로 충분.',
        bad: '자산 최대 낙폭 중간값 −96% — 닷컴버블(2000~2002)을 거친 경우 거의 다 겪는다(2003년 이후 시작은 −75%). 25% 떨어진 뒤에야 팔기 때문이다. 매도 4번 중 1번은 매수 직후 재매도.' },
      { name: '30% 룰 (고점 −30%)', data: 'RULE30',
        rule: '최근 1년 최고 종가보다 30% 낮게 끝나면 판다.',
        good: '연 23.7%로 신호 전략 중 가장 높다. 10년에 3번도 안 되는 매매.',
        bad: '2022년 하락장 직전 시작은 연 10.5%로 최하위권. 큰 폭락이 아니면 거의 반응하지 않는다. 낙폭은 25% 룰과 같은 −96%.' },
    ],
  },
  {
    group: '자산이 커지면 레버리지 낮춤',
    items: [
      { name: 'S0 + 자산별 현금 / DLEV', data: 'C50',
        rule: '총자산 50억 이상이면 TQQQ ⅔ + 현금(또는 나스닥100) ⅓, 200억 이상이면 TQQQ ⅓.',
        good: '연 17.9~18.0%로 S0(17.5%)와 비슷한데, 자산 최대 낙폭이 −94% → −74%로 크게 얕아진다.',
        bad: '수익을 크게 높여주지는 않는다. 50억에 못 미친 나쁜 시작 시점은 보호하지 못한다.' },
      { name: '25% 룰 + 자산별 현금', data: 'RULE25C50',
        rule: '25% 룰에 자산별 현금 비중을 더함.',
        good: '연 20.9%, 하위 10% 15.8%. 낙폭 −96% → −80%. 20년 시점 생활비 하위 10%가 월 910만원으로 모든 TQQQ 전략 중 가장 높다 — 나쁜 시기에도 생활비가 덜 끊긴다.',
        bad: '25% 룰보다 연 1.5%p 낮다.' },
      { name: 'D10GK + 자산별 현금', data: 'D10C50',
        rule: 'D10GK에 자산별 현금 비중을 더함.',
        good: '낙폭 −87% → −79%.',
        bad: '연 19.0%로 D10GK(20.7%)보다 낮고, 매일 LOC 주문 수고는 그대로다.' },
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
        <p className="text-sm text-gray-400 mb-10">2026-10-03 · 인출식 · 16가지 전략 · 668가지 시작 시점 · 인출 상한 없음</p>

        <Callout color="yellow">
          <strong>왜 다시 했나.</strong> 지금까지 인출 전략은 모두 20년에서 잘라 비교했다. 그런데 20년으로 자르면
          1970년대에 시작한 경우가 고금리기 직후에 끊겨 &lsquo;원금 미만&rsquo;으로 잡히고, 매매를 하루 이틀만 늦게 해도
          중간값이 크게 흔들렸다. 이번에는 모든 시작 시점을 <strong>오늘(2026-09)까지 끝까지</strong> 들고 가고,
          중간에 10·20·30·40·50년 시점을 함께 기록했다. 또 예전에는 월 1,500만원 인출 상한이 있어 자산이 커져도 생활비가 늘지 않았는데,
          이번에는 상한을 없애고 <strong>꺼내 쓴 돈과 남은 자산을 함께</strong> 본다. 결국 목표는 삶의 질이기 때문이다.
        </Callout>

        <Callout color="blue">
          <strong>계산 조건 (모든 전략 공통)</strong><br />
          · 초기 10억, 1971-02 ~ 2026-09 매달 시작 (668가지)<br />
          · <strong>인출: 동적 인출률, 상한 없음</strong> — 매달 총자산의 0.3%(10억 미만) / 0.5%(10~20억) / 0.7%(20억 이상)를 꺼내 쓴다.
          자산이 늘면 생활비도 늘고, 줄면 생활비도 준다<br />
          · TQQQ 운용보수 0.88% + 스왑금리(기준금리 × 2), QLD는 0.95% + 기준금리 × 1<br />
          · 모든 매도에 양도세 22% (연 250만원 공제) — 하락 신호로 전량 팔 때 포함<br />
          · 현금은 외화RP: 기준금리 − 0.4% 이자, 이자소득세 15.4%<br />
          · 매매는 신호 다음 거래일 종가 (조기 재매수만 LOC 주문으로 그날 종가)<br />
          · 금액은 물가 상승을 빼지 않은 금액<br /><br />
          <strong>인출 포함 연 수익률</strong> = 10억을 넣고, 매달 생활비를 받고, 마지막에 남은 자산까지 돌려받았을 때의 연 수익률.
          꺼내 쓴 돈과 남은 자산을 한 숫자로 합친 지표다.
        </Callout>

        <H2>한눈에 보는 결론</H2>
        <ul className="space-y-2 mb-6 text-gray-600 dark:text-gray-300 text-sm leading-relaxed list-disc pl-5">
          <li><strong className="text-gray-900 dark:text-white">신호 있는 전략은 끝까지 들고 가면 남은 자산이 10억 미만인 경우가 0가지다.</strong> 신호 없이 TQQQ만 들고 가면 42%가 10억 미만으로 끝나고, 20년 시점 생활비 하위 10%가 월 7만원이다.</li>
          <li><strong className="text-gray-900 dark:text-white">1년 최고 종가 대비 −25~30%에 파는 전략(25%·30% 룰)이 연 22~24%로 가장 높고, 하위 10%도 연 17%대로 가장 높다.</strong> 초반 10~20년 생활비도 가장 많다. 매매는 10년에 3~5번.</li>
          <li><strong className="text-gray-900 dark:text-white">D10GK는 초반에 덜 쓰고 후반에 크게 불어난다.</strong> 30년 시점 꺼내 쓴 돈 + 남은 자산은 가장 크지만, 10년 시점 생활비는 25% 룰의 절반 수준이다.</li>
          <li><strong className="text-gray-900 dark:text-white">자산이 크게 줄어드는 시기는 피할 수 없다.</strong> 닷컴버블을 거치면 TQQQ 전략은 자산이 최고점 대비 −87~96% 줄어든다. 자산별 현금 비중을 붙이면 −74~80%로 얕아지고, 생활비가 덜 끊긴다.</li>
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

        <H2>그래서 25% 룰을 권장 전략으로 골랐다</H2>
        <P>
          비교 끝에 권장 전략은 <strong>25% 룰 + 상한 없는 동적 인출</strong>로 정했다. 규칙이 세 줄로 끝나고(1년 고점 −25%면 매도,
          200일선 위 15일이면 매수, 매달 자산의 0.3~0.7% 인출), 일주일에 한 번만 확인하면 된다. 근거는 두 가지다.
        </P>
        <h3 className="text-base font-semibold mt-6 mb-2 text-gray-700 dark:text-gray-200">① 꺼내 쓰는 돈이 가장 많다</h3>
        <P>
          결국 목표는 삶의 질이다. 같은 날 시작한 경우끼리 비교하면 25% 룰은 20년 동안 S0보다 약 1.3배 많이 꺼내 쓴다.
          D10GK는 초반 10년에 25% 룰의 68%만 쓰고, 30년이 넘어가야 앞지른다.
        </P>
        <Rule25PeriodTable part="withdrawn" />
        <h3 className="text-base font-semibold mt-8 mb-2 text-gray-700 dark:text-gray-200">② 닷컴버블이 아닌 구간에서도 대체로 낫다</h3>
        <P>
          25% 룰의 성적이 닷컴버블 한 번 덕분인지 보려고 2000~2002년을 거치지 않는 구간만 따로 비교했다.
          그런 10년 구간 전체에서 25% 룰이 S0보다 나은 경우가 80%, 2003년 이후 시작은 S0·D10GK보다 전부 나았다.
          다만 1970~80년대 10년 구간만 보면 S0와 거의 같고(9.8% vs 9.9%), 빨리 회복한 폭락(1987, 2020)에서는 신호 없이 TQQQ를 들고 있는 편이 더 나았다.
          그 대신 신호 없는 보유는 1973~74 같은 긴 하락장에서 무너진다.
        </P>
        <Rule25PeriodTable part="periods" />
        <P>
          권장 전략의 실제 운영 방법과 감수해야 할 점은 <Link href="/posts/withdrawal-guide" className="text-blue-600 dark:text-blue-400 underline">인출식 방법론</Link>에,
          매일 신호는 <Link href="/" className="text-blue-600 dark:text-blue-400 underline">홈 화면</Link>에 있다.
        </P>

        <H2>주의할 점</H2>
        <ul className="space-y-2 mb-6 text-gray-600 dark:text-gray-300 text-sm leading-relaxed list-disc pl-5">
          <li><strong>생활비가 자산에 따라 크게 출렁인다.</strong> 상한이 없으므로 자산이 반토막 나면 생활비도 반토막 난다. 실제로는 월 생활비 하한·상한을 따로 정하는 것이 좋다 (다음 글에서 다룸).</li>
          <li><strong>인출 포함 수익률은 초반에 많이 쓴 경우를 높게 친다.</strong> TQQQ 계속 보유의 중간값이 높게 나오는 이유다. 반드시 하위 10%·최악·10억 미만 개수와 함께 볼 것.</li>
          <li><strong>큰 폭락 몇 번에 결과가 크게 좌우된다.</strong> 55년 동안 나스닥100이 1년 고점 대비 25% 넘게 빠진 큰 하락은 열 번 남짓이다. 25%·30% 룰이 좋았던 이유도 이 몇 번을 잘 피했기 때문이고, 다음 폭락이 다른 모양이면 결과도 달라질 수 있다.</li>
          <li>50년 시점은 1971~1976년 시작분 68가지뿐이다. 1985년 이전 나스닥100 값은 다른 지수로 이어 붙인 값이다.</li>
          <li>TQQQ·QLD 가격은 나스닥100 일별 수익률로 만든 이론 가격이다 (운용보수·스왑금리 반영, 배당 미반영 — 실제 TQQQ보다 연 2%p 정도 보수적).</li>
        </ul>

        <Callout color="green">
          <strong>권장 전략: 25% 룰 + 상한 없는 동적 인출.</strong>{' '}
          자산별 현금 비중·기본 현금 버퍼·생활비 1년 고정 같은 장치도 시험했지만, 수익을 1~2%p 낮추는 대신 낙폭을 줄이는 정도라
          단순함을 우선해 기본 권장에서는 뺐다 (큰돈을 지키고 싶다면 25% 룰 + 자산별 현금 비중).
          매일 신호는 <Link href="/" className="underline">홈 화면</Link>에서, 기존 방법론은 <Link href="/posts/withdrawal-guide" className="underline">인출식 방법론</Link>에서 볼 수 있다.
        </Callout>
      </main>
    </div>
  )
}
