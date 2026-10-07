import Link from 'next/link'
import Header from '@/components/Header'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata(
  '/changelog',
  '권장 전략 변경 이력',
  '권장 전략과 계산 방식이 언제, 왜 바뀌었는지 — 바뀐 것과 그대로 둔 것을 모두 기록한다.',
)

type Kind = '변경' | '유지' | '계산'
interface Entry { date: string; kind: Kind; title: string; body: React.ReactNode; href?: string }

const KIND_STYLE: Record<Kind, string> = {
  '변경': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  '유지': 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  '계산': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}

// 최신이 위. 새 검증·변경이 생기면 맨 위에 추가한다.
const ENTRIES: Entry[] = [
  {
    date: '2026-10-07', kind: '유지', title: '25% 룰의 기준값 검증 — 25%, 15일, 1년 그대로',
    body: <>매도 기준 15~40%, 재매수 5~30일, 최고 종가 기간 6개월~2년을 바꿔 151가지로 다시 돌렸다. 23~33%가 모두 비슷해 25%를 유지한다.
      30%가 나스닥100에서 조금 높았지만 최적화에 쓰지 않은 S&amp;P500에서 원금 아래로 끝나는 경우가 생겨 바꾸지 않았다.</>,
    href: '/posts/rule25-sensitivity',
  },
  {
    date: '2026-10-07', kind: '유지', title: '실제 TQQQ와 합성 가격 비교 — 계산 방식 그대로',
    body: <>2010년 이후 실제 TQQQ는 합성 가격보다 연 2.2%p 높았다(대부분 배당). 백테스트가 보수적이라는 뜻이라 계산 방식을 바꾸지 않았다.
      &lsquo;추적오차 미반영&rsquo; 안내를 &lsquo;배당 미반영(보수적)&rsquo;으로 고쳤다.</>,
    href: '/posts/real-vs-synthetic',
  },
  {
    date: '2026-10-03', kind: '변경', title: '인출 권장 전략: S0 → 25% 룰',
    body: <>매매를 &lsquo;신호가 뜬 날 종가&rsquo;(실제로는 불가능)에서 &lsquo;다음 거래일&rsquo;로 바꾸고, 20년에서 끊지 않고 오늘까지 들고 가고,
      생활비 상한(월 1,500만원)을 없애고, 꺼내 쓴 돈까지 넣은 &lsquo;인출 포함 연 수익률&rsquo;로 다시 비교했다.
      25% 룰 22.4% · D10GK 20.7% · S0 17.5%로 순위가 바뀌어 25% 룰을 권장으로 정했다. 거래도 가장 적다(10년에 약 3번 매도).</>,
    href: '/posts/withdrawal-full-period',
  },
  {
    date: '2026-10-03', kind: '계산', title: '모든 매도에 양도세 · 스왑금리 기본 반영',
    body: <>그전에는 하락 신호로 전량 팔 때 세금을 매기지 않았고, 3배를 만들려고 빌리는 돈의 이자(스왑금리)도 빠져 있었다.
      둘을 넣자 S0 20년 중간값이 1,109억 → 150억으로 크게 줄었다. 이후 모든 대표 수치는 이 기준이다.</>,
  },
  {
    date: '2026-10-03', kind: '변경', title: '적립식 목돈 분할: 3년 → 5년',
    body: <>스왑금리를 넣고 다시 계산하니 3년 분할은 최악 13.3년으로 오히려 늘었다. 5년(60개월) 분할이 최악 9.0년으로 가장 짧아 바꿨다.</>,
    href: '/posts/lump-sum-vs-split',
  },
  {
    date: '2026-10-03', kind: '변경', title: '인출 권장 전략: D10GK → S0',
    body: <>수익은 D10GK가 높았지만, 현금일 때 매일 밤 LOC 주문을 넣어야 하고 매수 다음 날 다시 파는 일이 잦았다.
      규칙이 단순한 S0를 권장으로, D10GK는 수익 극대화 선택지로 내렸다.</>,
    href: '/posts/withdrawal-new-ideas',
  },
  {
    date: '2026-10-01', kind: '변경', title: '첫 권장 후보: D10GK',
    body: <>SP500 낙폭 기준 → 나스닥100 200일 평균선(S0) → RSI 조기 재매수(D10GK) 순서로 연구해 D10GK를 최선 후보로 뒀다.
      당시 수치는 운용보수만 반영하고 신호 당일 종가 매매를 가정한 값이다.</>,
    href: '/posts/withdrawal-strategy',
  },
]

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black leading-tight mb-4">권장 전략 변경 이력</h1>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          권장 전략과 계산 방식이 언제, 왜 바뀌었는지 기록한다. 바꾼 것뿐 아니라 검증해 보고 그대로 둔 것도 남긴다.
        </p>
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl px-5 py-4 mb-10 text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
          <strong>권장을 자주 바꾸는 것 자체가 위험이다.</strong> 같은 과거 데이터로 새 규칙을 계속 시험하다 보면, 과거에만 잘 맞는 규칙을 고르게 된다.
          그래서 앞으로 권장 전략은 <strong>① 계산을 더 현실에 가깝게 고쳤을 때 순위가 바뀌거나 ② 최적화에 쓰지 않은 데이터(S&amp;P500, 1929년 가상 데이터, 사이트 공개 이후 실제 성적)에서도 더 나을 때</strong>만 바꾼다.
        </div>

        <ol className="relative border-l border-gray-200 dark:border-gray-800 ml-2 space-y-8">
          {ENTRIES.map(e => (
            <li key={e.date + e.title} className="pl-6">
              <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-mono text-gray-400">{e.date}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${KIND_STYLE[e.kind]}`}>{e.kind}</span>
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">{e.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{e.body}</p>
              {e.href && <Link href={e.href} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">근거 보기 →</Link>}
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}
