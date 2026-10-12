import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '왜 개별주가 아니라 시장지수인가',
  description: '개별주 투자를 금지한 이유. 생존 편향, 종목 소멸, 레버리지 ETF의 차이까지 — 시장지수를 선택한 근거를 정리한다.',
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

export default function WhyIndexPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-16">

        {/* 헤더 */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">적립식</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">원칙 01</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">왜 개별주가 아니라 시장지수인가</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-12</p>
        </div>

        <P>
          원칙 01은 단호하다. 개별주 금지, 가치주 금지, 성장주 금지, 개별주 레버리지 금지.
          종목은 오직 시장지수 — VOO, 나스닥100, QLD, TQQQ만 한다.
          왜 이렇게 강하게 선을 긋는지 설명한다.
        </P>

        <H2>개별주 투자의 치명적인 문제: 생존 편향</H2>

        <P>
          지금 주식 시장에 살아남아 있는 종목들은 살아남은 종목들이다. 당연한 말 같지만, 이것이 핵심이다.
        </P>

        <P>
          아마존, 애플, 엔비디아를 10년 전에 샀더라면 대박이었을 것이다.
          하지만 10년 전에 그 종목들을 자신 있게 고를 수 있었을까? 그때도 수천 개의 종목이 있었고,
          대부분은 그 이후 시장에서 사라졌거나 주가가 반 토막이 났다.
          우리가 기억하는 것은 오른 종목들뿐이다. 내려간 종목들은 기억에서 지워진다. 이것이 <strong>생존 편향</strong>이다.
        </P>

        <Callout color="yellow">
          <strong>생존 편향의 실제 규모</strong> — 미국 주식시장에서 1926년부터 2016년까지 상장된 종목의 약 58%는 결국
          미국 단기국채 수익률에도 못 미쳤다. 전체 시장 수익의 대부분은 상위 4%의 종목에서 나왔다.
          그 4%를 사전에 골라낼 방법은 없다.
        </Callout>

        <P>
          개별주 투자는 그 4%를 맞춰야 하는 게임이다. 그리고 그 게임에서
          전업 펀드매니저들도 장기적으로 시장지수를 이기지 못한다.
          일반 투자자가 이길 가능성은 더 낮다.
        </P>

        <H2>시장지수는 스스로 구성을 바꾼다</H2>

        <P>
          나스닥100은 나스닥에 상장된 시가총액 상위 100개 비금융 종목으로 구성된다.
          분기마다 재조정되고, 망하거나 쪼그라든 종목은 자동으로 빠지고 새로운 종목이 들어온다.
          S&P 500도 마찬가지다.
        </P>

        <P>
          이 구조 덕분에 지수는 스스로 진화한다. 1990년대 나스닥100은 마이크로소프트, 인텔이 주도했다.
          2000년대 초에는 시스코, 퀄컴이 있었다. 2010년대는 애플, 구글, 아마존. 2020년대는 엔비디아.
          투자자가 아무것도 하지 않아도 지수는 시대의 선두 기업을 자동으로 담는다.
        </P>

        <Callout color="blue">
          개별주를 보유하면 그 회사가 망하면 끝이다. 지수를 보유하면 한 회사가 망해도
          다른 회사가 자리를 채운다. 분산의 힘은 단순히 리스크를 줄이는 게 아니라,
          시장 전체의 성장을 장기적으로 포획하는 데 있다.
        </Callout>

        <H2>왜 레버리지 지수(TQQQ, QLD)는 괜찮은가</H2>

        <P>
          "레버리지도 리스크 아닌가?" — 맞다. TQQQ는 나스닥100 일간 수익률의 3배를 추종하고,
          닷컴버블 같은 대형 하락장에서는 −96%까지 빠진다.
          그런데 왜 이것은 허용하고 개별주 레버리지는 금지하는가.
        </P>

        <P>
          결정적인 차이는 <strong>0이 될 수 있느냐 없느냐</strong>다.
        </P>

        <P>
          TQQQ가 −96%까지 빠져도 나스닥100이 0이 되지 않는 한 회복이 가능하다.
          나스닥100 자체가 0이 된다는 것은 100개 기업이 동시에 모두 망한다는 뜻인데,
          그 상황이면 어떤 자산도 의미가 없다.
        </P>

        <P>
          반면 개별주 레버리지는 다르다. 그 회사 하나가 망하면 진짜로 0이 된다.
          레버리지가 걸려 있으면 회사가 망하기 전에 이미 −99%까지 갈 수 있고,
          그 시점에 살아날 가능성은 거의 없다. 2000년대 엔론, 2008년 리먼브라더스,
          2022년 테라루나 — 이것들에 레버리지를 걸었다면 전액 손실이다.
        </P>

        <H3>정리하면</H3>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">종목 유형</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">0이 될 가능성</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">허용 여부</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: '시장지수 (VOO, 나스닥100)', zero: '사실상 없음', ok: true },
                { type: '레버리지 지수 (QLD, TQQQ)', zero: '사실상 없음', ok: true },
                { type: '개별주 (우량주 포함)', zero: '있음', ok: false },
                { type: '가치주 / 성장주', zero: '있음', ok: false },
                { type: '개별주 레버리지', zero: '매우 높음', ok: false },
              ].map((row, i) => (
                <tr key={i} className={`border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-900/40'}`}>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{row.type}</td>
                  <td className={`py-2 px-3 text-center text-xs font-medium ${row.zero === '사실상 없음' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {row.zero}
                  </td>
                  <td className="py-2 px-3 text-center font-bold">
                    {row.ok
                      ? <span className="text-green-600 dark:text-green-400">허용</span>
                      : <span className="text-red-500 dark:text-red-400">금지</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2>TQQQ가 너무 위험하다고 느껴진다면</H2>

        <P>
          TQQQ의 낙폭이 부담스럽다면 QLD(2배)나 나스닥100(1배)으로 낮출 수 있다.
          하락폭이 줄어드는 대신 목표 달성 기간이 늘어난다.
          중요한 것은 어떤 종목을 선택하든 <strong>시장지수 안에서만 선택</strong>한다는 원칙이다.
        </P>

        <Callout color="green">
          <strong>이 사이트의 권장 순서</strong><br />
          목돈 없이 시작: TQQQ 매일 적립<br />
          목돈 2.5억 있음: TQQQ + 목돈 5년 분할 거치 (C전략)<br />
          낙폭이 너무 두렵다면: QLD 또는 나스닥100 ETF로 교체<br />
          자세한 비교는 적립식 방법론 참고.
        </Callout>

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
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">VOO · 나스닥100 · QLD · TQQQ 선택 기준까지</div>
              </div>
            </Link>
            <Link
              href="/posts/strategy-abc"
              className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
            >
              <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  A·B·C 전략 비교: 계속적립 vs 매입액한도 vs 분할거치
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">668가지 시작 시점 백테스트 비교</div>
              </div>
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
