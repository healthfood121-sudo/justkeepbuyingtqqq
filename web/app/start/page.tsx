import Link from 'next/link'
import Header from '@/components/Header'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata(
  '/start',
  '처음 오셨나요',
  '이 사이트를 어디서부터 읽으면 되는지, 지금 내 상황에 맞는 페이지와 자주 나오는 용어 풀이.',
)

const STEPS = [
  {
    who: '아직 투자를 시작하지 않았다',
    color: 'border-blue-200 dark:border-blue-500/30',
    tag: 'text-blue-600 dark:text-blue-400',
    links: [
      { href: '/posts/accumulation-guide', label: '적립식 방법론', desc: '무엇을, 얼마씩, 어떻게 사나 — 매일 자동 적립' },
      { href: '/simulator/custom', label: '적립 시뮬레이터', desc: '내 금액으로 10억까지 몇 년 걸렸나' },
      { href: '/posts/real-vs-synthetic', label: '백테스트를 믿어도 되나', desc: '실제 TQQQ와 비교한 검증' },
    ],
  },
  {
    who: '매일 적립하고 있다',
    color: 'border-blue-200 dark:border-blue-500/30',
    tag: 'text-blue-600 dark:text-blue-400',
    links: [
      { href: '/posts/strategy-abc', label: '목돈이 생기면', desc: '한 번에 넣을까, 5년에 나눠 넣을까' },
      { href: '/posts/synthetic-ndx-1929', label: '최악의 경우', desc: '1929년 대공황이 다시 오면 몇 년 걸리나' },
      { href: '/posts/withdrawal-guide', label: '미리 읽어 둘 인출 방법', desc: '10억이 되면 무엇을 바꾸나' },
    ],
  },
  {
    who: '목표에 도달해 꺼내 쓰려 한다',
    color: 'border-purple-200 dark:border-purple-500/30',
    tag: 'text-purple-600 dark:text-purple-400',
    links: [
      { href: '/posts/withdrawal-guide', label: '인출식 방법론', desc: '25% 룰 세 줄 규칙과 감수해야 할 것' },
      { href: '/', label: '오늘의 신호', desc: '홈 화면 — 일주일에 한 번 확인' },
      { href: '/simulator/withdrawal', label: '인출 시뮬레이터', desc: '내 시작 시점·금액으로 돌려 보기' },
      { href: '/posts/rule25-sensitivity', label: '왜 25%인가', desc: '기준값을 바꿔 본 검증' },
    ],
  },
]

const TERMS: [string, string][] = [
  ['나스닥100', '미국 나스닥 시장의 큰 회사 100개로 만든 지수. QQQ가 이 지수를 그대로 따라가는 ETF다.'],
  ['TQQQ · QLD', '나스닥100 하루 수익률의 3배(TQQQ), 2배(QLD)를 따라가는 ETF. 하루 −10%면 TQQQ는 약 −30%.'],
  ['합성 가격', 'TQQQ는 2010년에 나왔다. 그 전은 나스닥100 하루 수익률에 3배를 곱해 만든 가상 가격으로 계산한다. 실제 TQQQ보다 연 2%p 정도 보수적으로 나온다.'],
  ['변동성 끌림', '오르내림이 심하면 3배 상품은 지수의 3배보다 덜 번다. 지수가 −10%, +11.1%로 제자리여도 3배 상품은 손해를 본다. 합성 가격에 저절로 반영된다.'],
  ['스왑금리', 'TQQQ가 3배를 만들려고 빌리는 돈의 이자. 사이트는 기준금리 × 2로 계산해 수익에서 뺀다.'],
  ['200일 평균선 · 200일 지수이동평균(EMA200)', '최근 200거래일(약 10개월) 종가의 평균. 최근 값에 무게를 더 두는 방식(지수이동평균)을 쓴다. 지수가 이 선 위에 있으면 상승 흐름으로 본다.'],
  ['25% 룰', '권장 인출 전략. 나스닥100이 1년 최고 종가보다 25% 낮게 끝나면 TQQQ를 전부 팔고, 200일 평균선 위로 15일 연속 마감하면 다시 산다.'],
  ['S0', '200일 평균선 아래로 15일 연속이면 팔고, 위로 15일 연속이면 사는 규칙. 25% 룰 이전의 권장 전략.'],
  ['D10GK', 'S0에 급락 때 조기 재매수(LOC 주문)와 생활비 조절을 더한 전략. 매일 밤 주문이 필요하다.'],
  ['시작 시점', '1971년부터 매달 한 번씩 시작했다고 가정한 각각의 경우. 668가지 시작 시점이면 668번 따로 계산한 것이다.'],
  ['중간값 · 하위 10%', '모든 시작 시점을 결과순으로 줄 세웠을 때 가운데 값, 아래에서 10% 지점의 값. 평균은 일부 극단적인 경우 때문에 왜곡되기 쉬워 중간값을 쓴다.'],
  ['인출 포함 연 수익률', '10억을 넣고, 매달 생활비를 꺼내 쓰고, 마지막에 남은 자산까지 돌려받았을 때의 연 수익률. 꺼내 쓴 돈과 남은 돈을 함께 본다.'],
  ['최대 낙폭', '가장 높았던 때보다 가장 많이 줄어든 비율. −96%면 100억이 4억까지 줄었던 적이 있다는 뜻이다.'],
  ['외화RP', '현금으로 있을 때 달러를 넣어 두는 증권사 상품. 기준금리 근처의 이자를 받는다.'],
  ['LOC 주문', '"종가가 이 가격 이하이면 종가에 사라"는 주문. 장이 끝나기 전에 넣어 두면 그날 종가로 체결된다.'],
  ['양도세', '해외 ETF를 팔아 생긴 이익에서 연 250만원을 빼고 22%. 다음 해 5월에 신고한다. 사이트 결과에는 모든 매도에 반영되어 있다.'],
]

export default function StartPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header maxWidth="max-w-4xl" />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black leading-tight mb-4">처음 오셨나요</h1>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-10">
          이 사이트는 TQQQ를 매일 사서 목표 자산을 만들고(적립식), 목표에 닿으면 규칙대로 꺼내 쓰는(인출식) 방법을
          1971년 이후 모든 시작 시점으로 검증한 기록이다. 지금 상황에 맞는 곳부터 읽으면 된다.
        </p>

        <div className="space-y-4 mb-14">
          {STEPS.map((s, i) => (
            <div key={s.who} className={`border rounded-2xl px-5 py-4 ${s.color}`}>
              <p className={`text-xs font-bold mb-2 ${s.tag}`}>{i + 1}. {s.who}</p>
              <div className="space-y-2">
                {s.links.map(l => (
                  <Link key={l.label} href={l.href} className="flex items-baseline gap-2 group">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:underline whitespace-nowrap">{l.label} →</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{l.desc}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-4">자주 나오는 말</h2>
        <dl className="divide-y divide-gray-100 dark:divide-gray-800 mb-12">
          {TERMS.map(([t, d]) => (
            <div key={t} className="py-3 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-0">{t}</dt>
              <dd className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{d}</dd>
            </div>
          ))}
        </dl>

        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl px-5 py-4 text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
          모든 결과는 과거 데이터로 계산한 것이고 미래를 보장하지 않는다. 3배 상품은 자산이 한때 90% 넘게 줄어드는 시기를 견뎌야 한다.
          권장 전략이 어떻게 바뀌어 왔는지는 <Link href="/changelog" className="underline">변경 이력</Link>에 있다.
        </div>
      </main>
    </div>
  )
}
