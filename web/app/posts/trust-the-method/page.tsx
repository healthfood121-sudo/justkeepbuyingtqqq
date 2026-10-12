import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '뉴스를 보지 말고 방법론을 지켜라',
  description: '백테스트 안에는 이미 모든 뉴스가 담겨 있다. 전쟁, 공황, 금리 충격, 버블 붕괴 — 그 모든 것을 겪고도 시장지수는 우상향했다.',
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}

function Callout({ color = 'blue', children }: { color?: 'blue' | 'yellow' | 'red' | 'green'; children: React.ReactNode }) {
  const styles = {
    blue:  'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow:'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    red:   'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200',
    green: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
  }
  return (
    <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>
      {children}
    </div>
  )
}

const EVENTS = [
  { year: '1973', event: '1차 오일쇼크 — 유가 4배 폭등, 나스닥 −60%' },
  { year: '1987', event: '블랙먼데이 — 하루 만에 −22%' },
  { year: '1990', event: '걸프전 · 일본 버블 붕괴' },
  { year: '1998', event: '러시아 디폴트 · 롱텀캐피털 붕괴' },
  { year: '2000', event: '닷컴버블 붕괴 — 나스닥 −83%' },
  { year: '2001', event: '9·11 테러' },
  { year: '2008', event: '글로벌 금융위기 — 리먼 브라더스 파산' },
  { year: '2011', event: '미국 신용등급 강등 · 유럽 재정위기' },
  { year: '2018', event: '미중 무역전쟁 시작' },
  { year: '2020', event: 'COVID-19 팬데믹 — 33일 만에 −34%' },
  { year: '2022', event: '미 연준 급격한 금리 인상 — 나스닥 −33%' },
  { year: '2025', event: '트럼프 관세 충격 — 나스닥 −23%' },
]

export default function TrustTheMethodPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-16">

        {/* 헤더 */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">적립식</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">원칙 03</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">뉴스를 보지 말고 방법론을 지켜라</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-12</p>
        </div>

        <P>
          투자를 하면서 뉴스를 보지 않기란 쉽지 않다. "이번엔 진짜 다를 것 같다"는 생각이 든다.
          전쟁이 났고, 금리가 올랐고, 경기침체 신호가 나오고 있다.
          지금 팔지 않으면 손해볼 것 같은 느낌이 든다.
        </P>

        <P>
          하지만 그 느낌은 대부분 틀렸다. 그리고 그 느낌이 맞았던 때보다 틀렸던 때의 손해가 훨씬 크다.
        </P>

        <H2>백테스트 안에는 이미 모든 뉴스가 담겨 있다</H2>

        <P>
          이 사이트의 백테스트는 1971년부터 지금까지 모든 날의 데이터를 사용한다.
          그 기간 동안 어떤 일들이 있었는지 보자.
        </P>

        <div className="mb-8 space-y-0">
          {EVENTS.map((e, i) => (
            <div key={i} className={`flex gap-4 py-2.5 border-b border-gray-100 dark:border-gray-800 ${i === 0 ? 'border-t' : ''}`}>
              <span className="font-mono text-xs font-bold text-gray-400 dark:text-gray-500 w-10 shrink-0 pt-0.5">{e.year}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{e.event}</span>
            </div>
          ))}
        </div>

        <P>
          이 모든 사건이 백테스트 데이터 안에 이미 들어있다.
          그리고 그 모든 것을 겪은 후 나스닥100은 지금 이 자리에 있다.
          전쟁이 났을 때 판 사람, 금리가 오를 때 판 사람, 팬데믹 때 판 사람 — 모두 틀렸다.
        </P>

        <Callout color="blue">
          백테스트 결과가 좋다는 것은 단순히 "과거에 수익이 났다"는 뜻이 아니다.
          저 모든 사건을 하나하나 겪으면서도 전략이 살아남았다는 뜻이다.
          그 결과를 믿는다면, 다음 위기가 왔을 때도 같은 믿음을 유지해야 한다.
        </Callout>

        <H2>뉴스에 반응하면 어떻게 되는가</H2>

        <P>
          뉴스에 반응해 매매를 바꾸는 행동을 <strong>행동 편향</strong>이라고 한다.
          이것이 수익률에 어떤 영향을 미치는지 실제 데이터로 잘 알려져 있다.
        </P>

        <P>
          미국 펀드평가사 달바(DALBAR)의 연구에 따르면,
          S&P500 지수 자체는 지난 30년간 연평균 약 10%를 벌었지만
          실제 개인 투자자의 평균 수익률은 연 4% 수준에 불과했다.
          차이는 종목 선택이 아니라 <strong>사고 팔고를 반복한 타이밍</strong>에서 났다.
          하락할 때 팔고, 올라간 다음에 다시 샀기 때문이다.
        </P>

        <Callout color="yellow">
          <strong>뉴스를 보면 생기는 일</strong><br />
          1. 나쁜 뉴스가 나온다<br />
          2. 불안해진다<br />
          3. "이번엔 다를 것 같다"는 생각이 든다<br />
          4. 판다 — 그런데 이미 많이 내려간 뒤다<br />
          5. 반등이 시작된다<br />
          6. "좀 더 오르면 사야지"라고 생각한다<br />
          7. 이미 많이 오른 뒤에 다시 산다<br />
          8. 반복
        </Callout>

        <P>
          이 패턴은 개인의 의지 문제가 아니다. 인간의 뇌가 손실에 이익보다 2배 이상 민감하게 반응하도록
          진화했기 때문에 생기는 구조적인 문제다. 뉴스를 보면 볼수록 이 패턴에 빠질 확률이 높아진다.
        </P>

        <H2>방법론을 지키는 것의 의미</H2>

        <P>
          원칙 03의 핵심은 "뉴스를 무시하라"가 아니다.
          <strong>"뉴스에 반응해서 매매를 바꾸지 말라"</strong>는 것이다.
        </P>

        <P>
          뉴스를 보고 세상이 어떻게 돌아가는지 아는 것은 괜찮다.
          문제는 그 뉴스가 매매 결정에 영향을 줄 때다.
          매일 자동 매수, 25% 룰 신호만 확인 — 이 두 가지를 지키면
          뉴스가 무엇을 말하든 행동이 바뀌지 않는다.
        </P>

        <Callout color="green">
          <strong>실전에서 지키는 방법</strong><br />
          적립 단계: 자동매수 설정 후 확인하지 않는다. 하락해도 추가로 더 사거나, 공포에 팔거나 하지 않는다.<br />
          인출 단계: 일주일에 한 번 홈 화면의 신호만 본다. 신호가 없으면 아무것도 하지 않는다.
        </Callout>

        <P>
          "이번엔 다를 것 같다"는 생각이 들 때가 방법론을 지켜야 하는 정확한 타이밍이다.
          그 생각이 드는 이유는 상황이 실제로 다르기 때문이 아니라,
          지금 시장이 많이 내려가서 불안하기 때문이다.
        </P>

        {/* 관련 글 */}
        <div className="mt-14 border-t border-gray-200 dark:border-gray-800 pt-10">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">관련 글</p>
          <div className="space-y-3">
            <Link
              href="/posts/experience-1990"
              className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
            >
              <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  −96%를 견딜 수 있나 — 1990년 은퇴자의 36년을 한 달씩
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">방법론을 지켰을 때와 안 지켰을 때의 실제 결과</div>
              </div>
            </Link>
            <Link
              href="/posts/withdrawal-guide"
              className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
            >
              <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  인출식 방법론: 25% 룰 신호 기준
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">일주일에 한 번 확인하는 신호의 정확한 기준</div>
              </div>
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
