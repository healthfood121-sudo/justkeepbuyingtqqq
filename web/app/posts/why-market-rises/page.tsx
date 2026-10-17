import Header from '@/components/Header'
import WorldPopCounter from '@/components/WorldPopCounter'
import GlobalLiquidityCounter from '@/components/GlobalLiquidityCounter'
import GlobalDebtCounter from '@/components/GlobalDebtCounter'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '시장지수는 왜 장기적으로 우상향하는가',
  description: '인구 증가, 기술 생산성, 기업 이익의 복리 성장, 인플레이션 — 시장지수가 장기적으로 우상향할 수밖에 없는 네 가지 구조적 이유.',
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

const POP_HISTORY = [
  { year: '1800년', pop: '10억', note: '산업혁명 시작' },
  { year: '1900년', pop: '16억', note: '100년에 +6억' },
  { year: '1950년', pop: '25억', note: '50년에 +9억' },
  { year: '2000년', pop: '61억', note: '50년에 +36억' },
  { year: '2026년', pop: '82억', note: '26년에 +21억' },
]

export default function WhyMarketRisesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-16">

        {/* 헤더 */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">적립식</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">시장지수는 왜 장기적으로 우상향하는가</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-12</p>
        </div>

        <P>
          백테스트 결과를 믿으려면 먼저 한 가지 질문에 답할 수 있어야 한다.
          "왜 시장지수는 앞으로도 계속 오를 것인가?"
        </P>
        <P>
          과거에 올랐다고 미래에도 오른다는 보장은 없다 — 이 반론은 틀리지 않다.
          하지만 시장지수가 우상향하는 데는 단순히 "과거가 그랬으니까"가 아닌,
          구조적인 이유가 네 가지 있다.
        </P>

        {/* ① 인구 */}
        <H2>① 인구 증가 — 소비자가 계속 늘어난다</H2>

        <div className="my-6">
          <WorldPopCounter />
        </div>

        <P>
          경제의 크기는 결국 사람의 수와 비례한다. 사람이 많아질수록 물건을 사는 사람,
          서비스를 쓰는 사람, 스마트폰을 사는 사람이 늘어난다.
          그 매출이 기업의 수익이 되고, 기업의 수익이 지수의 상승으로 이어진다.
        </P>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">시점</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">세계 인구</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">비고</th>
              </tr>
            </thead>
            <tbody>
              {POP_HISTORY.map((row, i) => (
                <tr key={i} className={`border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-900/40'}`}>
                  <td className="py-2 px-3 font-mono font-bold text-gray-900 dark:text-white">{row.year}</td>
                  <td className="py-2 px-3 text-right font-bold text-green-600 dark:text-green-400">{row.pop}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-xs">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">출처: UN DESA World Population Prospects 2024</p>
        </div>

        <P>
          단, 인구 증가만으로는 나스닥100을 설명하기 부족하다.
          나스닥100에 담긴 기업들 — Apple, Nvidia, Google, Amazon — 은 미국 내수가 아닌
          전 세계를 시장으로 한다. 인구가 줄어드는 일본이나 유럽에서도
          아이폰을 사고, 유튜브를 보고, AWS를 쓴다.
          인구 증가는 시장지수 우상향의 여러 이유 중 하나다.
        </P>

        {/* ② 기술 생산성 */}
        <H2>② 기술 생산성 향상 — 같은 사람이 더 많이 만든다</H2>

        <P>
          경제학에서 GDP 성장을 설명할 때 쓰는 공식이 있다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 font-mono text-sm text-gray-700 dark:text-gray-300">
          GDP 성장 = 인구 증가 + 1인당 생산성 향상
        </div>

        <P>
          인구가 줄어드는 나라에서도 경제가 성장하는 이유가 바로 이 두 번째 항목이다.
          기술이 발전할수록 같은 사람이 같은 시간에 더 많은 가치를 만들어낼 수 있다.
        </P>

        <P>
          그리고 나스닥100은 이 기술 생산성 향상의 최전선에 있는 기업들로 구성된다.
          증기기관이 산업혁명을 만들었듯, 인터넷이 닷컴 시대를 만들었듯,
          지금의 AI와 클라우드가 다음 생산성 도약을 만들고 있다.
        </P>

        <Callout color="blue">
          <strong>나스닥100이 S&P500보다 장기 수익률이 높은 이유</strong><br />
          S&P500은 미국 전체 경제를 담는다. 나스닥100은 그 중에서도
          기술 생산성 향상을 직접 만들어내는 기업들만 담는다.
          기술 생산성이 경제 성장의 핵심 동력인 시대에, 그 동력 자체를 보유하는 것이다.
        </Callout>

        {/* ③ 기업 이익의 복리 */}
        <H2>③ 기업 이익의 복리 — 벌어서 더 크게 번다</H2>

        <P>
          기업은 이익을 그냥 쌓아두지 않는다. 새로운 제품에 투자하고, 다른 회사를 인수하고,
          더 나은 기술을 개발한다. 이 재투자가 다음 해의 더 큰 이익을 만들고,
          그 이익이 또 재투자된다.
        </P>

        <P>
          개인이 예금에 이자를 붙여 복리로 불리듯, 기업도 이익을 사업에 복리로 재투자한다.
          지수를 보유한다는 것은 이 복리 성장 과정을 자동으로 따라가는 것이다.
        </P>

        <Callout color="green">
          Warren Buffett이 "주식을 장기 보유하라"고 말하는 핵심 이유가 바로 이것이다.
          단기적으로는 감정과 심리에 의해 가격이 흔들리지만, 장기적으로 주가는
          기업 이익을 따라간다. 그리고 우량 기업의 이익은 복리로 성장한다.
        </Callout>

        {/* ④ 인플레이션 */}
        <H2>④ 인플레이션 — 돈의 가치가 하락한다</H2>

        <P>
          1970년에 짜장면 한 그릇이 100원이었다면, 지금은 7,000원이다.
          짜장면이 더 맛있어져서가 아니라 돈의 가치가 떨어졌기 때문이다.
          이것이 인플레이션이다.
        </P>

        <P>
          인플레이션은 기업 매출에도 같이 작용한다. 물가가 오르면 기업이 파는 물건의 가격도 오르고,
          명목 매출도 오른다. 지수는 이 명목 수치를 반영하기 때문에, 설령 실물 성장이 없어도
          인플레이션만큼은 지수가 오른다.
        </P>

        <P>
          반면 은행 예금이나 현금을 들고 있으면 인플레이션만큼 실질 가치가 줄어든다.
          주식 지수는 이 인플레이션에 자동으로 올라타는 자산이다.
        </P>

        <H2>④-1. 인플레이션은 왜 생기는가 — 통화량 증가</H2>

        <P>
          인플레이션의 가장 큰 원인 중 하나는 통화량 증가다.
          전 세계 통화량(M2)은 지금 이 순간에도 늘어나고 있다.
        </P>

        <div className="my-6">
          <GlobalLiquidityCounter />
          <GlobalDebtCounter />
        </div>

        <P>
          중앙은행의 통화 공급과 은행의 신용 창출이 합쳐져 전 세계 M2는 연 약 6%씩 증가한다.
          그렇다고 내 현금이 매년 6%씩 줄어드는 건 아니다.
          경제가 성장하면서 새로 풀린 돈을 일부 흡수하기 때문이다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 font-mono text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <div>M2 +6%</div>
          <div className="pl-4 text-gray-400 dark:text-gray-500">→ 경제 실질 성장 ~2–3% 흡수</div>
          <div className="pl-4 text-gray-400 dark:text-gray-500">→ 실제 물가 상승(인플레이션) ~2–3%</div>
        </div>

        <P>
          현금 희석 속도는 인플레이션율(연 2~3%)에 가깝다.
          그렇다면 기업은? 물가가 3% 오르면 기업이 파는 물건 가격도 3% 오른다.
          실질 성장이 전혀 없는 기업이라도 명목 매출은 인플레이션만큼 자동으로 오른다.
          주가는 이 명목 수치를 반영하기 때문에, 지수는 최소 인플레이션만큼은 자동으로 오르는 구조다.
        </P>

        <Callout color="yellow">
          <strong>현금 vs 주식 지수</strong><br />
          <span className="font-mono">현금 보유 = 매년 인플레이션(~2–3%)만큼 실질 가치 감소</span><br />
          <span className="font-mono">주식 지수 = 인플레이션 자동 반영 + 실질 성장</span><br /><br />
          현금을 들고 있는 것은 매년 2~3%씩 손해를 확정하는 선택이다.
        </Callout>

        <Callout color="yellow">
          <strong>네 가지 힘이 동시에 작용한다</strong><br />
          단기적으로는 어느 한 요소가 꺾일 수 있다. 인구 성장이 둔화되거나,
          기술 발전이 정체되거나, 경기침체로 기업 이익이 줄거나, 디플레이션이 올 수도 있다.
          하지만 네 가지가 동시에, 영구적으로 모두 반전되려면 문명 자체가 후퇴해야 한다.
          그 상황이라면 어떤 자산도 안전하지 않다.
        </Callout>

        {/* 마무리 */}
        <H2>그래서 뉴스에 흔들리지 않는다</H2>

        <P>
          전쟁이 났다, 금리가 올랐다, 경기침체가 온다 — 이 뉴스들은 네 가지 구조적 힘을
          일시적으로 흔들 수는 있지만, 방향을 바꾸지는 못한다.
          1971년 이후 나스닥100은 수십 번의 위기를 거쳤고, 그때마다 "이번엔 다르다"는 말이 있었다.
          하지만 결국 지수는 새로운 고점을 만들었다.
        </P>

        <P>
          이 네 가지 이유 — 인구, 생산성, 복리, 인플레이션 — 가 작동하는 한,
          시장지수의 장기 우상향을 믿을 근거는 충분하다.
        </P>

        {/* 관련 글 */}
        <div className="mt-14 border-t border-gray-200 dark:border-gray-800 pt-10">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">관련 글</p>
          <div className="space-y-3">
            {[
              { href: '/posts/why-index', title: '왜 개별주가 아니라 시장지수인가', desc: '생존 편향과 지수의 자동 구성 재조정' },
              { href: '/posts/trust-the-method', title: '뉴스를 보지 말고 방법론을 지켜라', desc: '백테스트에 담긴 역사적 사건 목록' },
              { href: '/posts/accumulation-guide', title: '적립식 방법론: 어떤 종목을, 얼마씩, 어떻게 매수하나', desc: 'TQQQ 장기 적립의 전체 설계도' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
              >
                <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{link.title}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{link.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
