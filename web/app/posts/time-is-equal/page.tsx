import Header from '@/components/Header'
import LifeCountdown from '@/components/LifeCountdown'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '남은 여름이 몇 번인지 세어봤다',
  description: '시간은 모두에게 평등한 자원이다. 35세 남성의 통계청 기대여명 기준 남은 여름은 47번. 이 숫자가 투자공부 대신 자동매수를 선택한 이유다.',
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}

function Callout({ color = 'blue', children }: { color?: 'blue' | 'yellow' | 'gray'; children: React.ReactNode }) {
  const styles = {
    blue:  'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow:'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    gray:  'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300',
  }
  return (
    <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>
      {children}
    </div>
  )
}

// 통계청 2024 생명표 (나이, 남자 기대여명, 여자 기대여명)
const LIFE_TABLE = [
  { age: 0,  male: 80.8, female: 86.6 },
  { age: 20, male: 61.2, female: 66.9 },
  { age: 30, male: 51.5, female: 57.1 },
  { age: 35, male: 46.7, female: 52.3 },
  { age: 40, male: 41.9, female: 47.4 },
  { age: 50, male: 32.5, female: 37.8 },
  { age: 60, male: 23.7, female: 28.4 },
  { age: 70, male: 15.5, female: 19.2 },
  { age: 80, male:  7.5, female: 10.8 },
  { age: 90, male:  3.2, female:  5.0 },
]

export default function TimeIsEqualPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-16">

        {/* 헤더 */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">적립식</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">원칙 02</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">남은 여름이 몇 번인지 세어봤다</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-12</p>
        </div>

        {/* 리드 */}
        <P>
          돈은 잃으면 다시 벌 수 있다. 시간은 그렇지 않다. 지나간 1초는 어떤 방법으로도 되돌아오지 않는다.
          그런데도 우리는 수익률 0.1%p를 더 짜내려고 차트를 들여다보고, 뉴스를 읽고, 종목 리포트를 뒤진다.
          그 시간이 얼마인지 한 번도 계산해본 적이 없으면서.
        </P>

        {/* 위젯 */}
        <div className="my-8">
          <LifeCountdown />
        </div>

        <P>
          나이와 성별을 바꿔 보면 자신의 숫자가 나온다. 기준은 통계청 생명표 — 같은 나이, 같은 성별의
          사람이 평균적으로 얼마나 더 사는지를 집계한 공식 자료다.
        </P>

        <H2>통계청이 말하는 기대여명</H2>

        <P>
          통계청은 매년 <strong>생명표</strong>를 발표한다. 지금 몇 살이든, 그 나이에서 평균적으로
          얼마나 더 살 수 있는지를 보여주는 표다. 태어날 때 기대수명이 아니라,
          이미 그 나이까지 살아남은 사람의 잔여 기대수명이다.
        </P>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">나이</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">남자 기대여명</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">여자 기대여명</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">남자 남은 여름</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">여자 남은 여름</th>
              </tr>
            </thead>
            <tbody>
              {LIFE_TABLE.map((row, i) => (
                <tr key={row.age} className={`border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-900/40'}`}>
                  <td className="py-2 px-3 font-mono font-bold text-gray-900 dark:text-white">{row.age}세</td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">{row.male}년</td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">{row.female}년</td>
                  <td className="py-2 px-3 text-right font-bold text-blue-600 dark:text-blue-400">{Math.round(row.male)}번</td>
                  <td className="py-2 px-3 text-right font-bold text-pink-600 dark:text-pink-400">{Math.round(row.female)}번</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">출처: 통계청 생명표 (2024년 기준)</p>
        </div>

        <P>
          40세 남성의 남은 여름은 42번이다. 50세가 되면 32번. 한 해에 여름은 단 한 번뿐이다.
          그 여름을 몇 번이나 더 즐길 수 있는지, 대부분의 사람은 한 번도 숫자로 세어본 적이 없다.
        </P>

        <Callout color="yellow">
          <strong>숫자가 체감되지 않는다면</strong> — 위 위젯의 나이를 바꿔 보자.
          부모님 나이를 넣으면 다른 이야기가 된다.
        </Callout>

        <H2>시간을 낭비하는 두 가지 방법</H2>

        <P>
          투자에서 시간을 낭비하는 방법은 두 가지다.
        </P>

        <P>
          첫 번째는 <strong>너무 많이 공부하는 것</strong>이다. 매크로 분석, 섹터 로테이션, 실적 시즌, 금리 전망.
          이 모든 것을 완벽하게 이해하고 나서 투자하려 하면 평생 준비만 하다 끝난다.
          그리고 그 공부가 수익률에 도움이 된다는 증거도 없다.
        </P>

        <P>
          두 번째는 <strong>결과에 너무 많이 반응하는 것</strong>이다. 하락 때 불안해서 팔고,
          상승 때 흥분해서 더 사고, 뉴스 하나에 포트폴리오를 바꾸는 것.
          이것도 시간이 필요하다. 차트 확인, 뉴스 검색, 커뮤니티 눈팅.
          그 시간을 합산하면 적지 않다.
        </P>

        <Callout color="blue">
          백테스트 안에는 이미 모든 뉴스가 담겨 있다. 전쟁, 공황, 금리 충격, 버블 붕괴 — 역사에 기록된 모든 불확실성이
          지수 데이터에 녹아 있다. 그 모든 것을 겪고도 나스닥100은 우상향했다.
          뉴스를 보는 것은 이미 가격에 반영된 정보를 한 번 더 소비하는 것에 불과하다.
        </Callout>

        <H2>자동매수가 시간을 돌려준다</H2>

        <P>
          이 사이트에서 권장하는 방법은 단순하다. 매일 같은 금액을 자동 매수하고, 신경을 끈다.
          인출 단계에 들어가면 일주일에 한 번 홈 화면의 신호를 확인하고, 그게 전부다.
        </P>

        <P>
          이 방법이 좋은 이유는 수익률만이 아니다. 투자에 쓰는 시간을 거의 제로로 만들기 때문이다.
          그 시간을 그동안 하고 싶었지만 시간이 없어서 못했던 일에 쓸 수 있다.
        </P>

        <P>
          남은 여름이 47번인 사람이 매년 여름을 차트 앞에서 보낼 이유는 없다.
        </P>

        <H2>그래서 원칙 02번이다</H2>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">원칙 02 — 투자공부 대신 행복한 삶을 누리자</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            모든 사람에게 똑같이 주어지는 자원은 시간뿐이다.
            일반인의 투자공부는 지수공부로 충분하고, 그것만 해도 시간이 오래 걸린다.
            나머지 시간은 그동안 하고 싶었지만 시간이 없어서 못했던 일에 쓰자.
          </p>
        </div>

        <P>
          위 위젯의 숫자가 지금도 줄어들고 있다. 이 글을 읽는 동안에도.
        </P>

        {/* 관련 글 */}
        <div className="mt-14 border-t border-gray-200 dark:border-gray-800 pt-10">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">관련 글</p>
          <div className="space-y-3">
            <Link
              href="/posts/accumulation-guide"
              className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
            >
              <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  적립식 방법론: 어떤 종목을, 얼마씩, 어떻게 매수하나
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">자동매수의 전체 설계도</div>
              </div>
            </Link>
            <Link
              href="/"
              className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
            >
              <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  홈으로 — 오늘의 매매 신호 확인
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">일주일에 한 번이면 충분하다</div>
              </div>
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
