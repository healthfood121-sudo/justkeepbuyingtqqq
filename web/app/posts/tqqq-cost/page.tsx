import Link from 'next/link'
import Header from '@/components/Header'

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
    blue:   'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    red:    'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200',
    green:  'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
  }
  return (
    <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>
      {children}
    </div>
  )
}

function FormulaBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 font-mono text-sm text-gray-700 dark:text-gray-300 leading-loose overflow-x-auto">
      {children}
    </div>
  )
}

function Table({ headers, rows, note }: {
  headers: string[]
  rows: (string | React.ReactNode)[][]
  note?: string
}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {headers.map((h, i) => (
              <th key={i} className="py-2 px-4 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-4 text-gray-700 dark:text-gray-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-1">{note}</p>}
    </div>
  )
}

export default function TqqCostPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" />

      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* 뒤로 가기 */}
        <Link href="/posts"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-8 inline-block">
          ← 전체 글 목록
        </Link>

        {/* 제목 */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">인출식</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">비용</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">TQQQ</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">스왑금리</span>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white leading-tight">
            TQQQ 비용의 전부:<br/>운용보수 0.82%는 빙산의 일각이다
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-12</p>
        </div>

        {/* 요약 */}
        <Callout color="yellow">
          <strong>핵심 요약</strong><br />
          TQQQ를 보유할 때 드는 비용은 운용보수(0.82%) 하나가 아니다.
          3배 레버리지를 구현하는 총수익 스왑의 차입 이자가 별도로 붙는다.
          2023년 고금리 시기에는 이 차입 이자만 연 11%를 넘겼다.
          우리 백테스트는 이 비용을 모두 반영하고 있다.
        </Callout>

        {/* 1. 우리가 알고 있는 비용 */}
        <H2>우리가 알고 있는 비용: 운용보수 0.82%</H2>

        <P>
          TQQQ의 공식 운용보수는 연 0.82%다. 10억을 갖고 있다면 1년에 820만원을 ProShares에 낸다.
          증권사 앱이나 ETF.com에서 보이는 숫자도 이 수치다. 대부분 투자자가 여기서 멈춘다.
        </P>

        <P>
          그런데 TQQQ의 실제 비용 구조는 이보다 훨씬 복잡하다.
          3배 레버리지를 어떻게 만드는지 이해하면 놓친 비용이 보인다.
        </P>

        {/* 2. TQQQ가 레버리지를 만드는 방법 */}
        <H2>TQQQ가 3배 레버리지를 만드는 방법</H2>

        <P>
          TQQQ는 나스닥100 주식을 3배 사두는 게 아니다.
          투자자 돈($1) 외에 은행에서 $2를 빌려서 합계 $3어치 나스닥100 노출을 만든다.
          이때 쓰는 계약이 <strong>총수익 스왑(Total Return Swap, TRS)</strong>이다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-3 gap-3 text-center text-sm mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-lg p-3">
              <div className="text-xs text-blue-500 dark:text-blue-400 mb-1">투자자 납입금</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">$1</div>
              <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">NAV</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/40 rounded-lg p-3">
              <div className="text-xs text-orange-500 dark:text-orange-400 mb-1">스왑으로 차입</div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">$2</div>
              <div className="text-xs text-orange-500 dark:text-orange-400 mt-1">이자 발생 구간</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-lg p-3">
              <div className="text-xs text-green-500 dark:text-green-400 mb-1">총 노출</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">$3</div>
              <div className="text-xs text-green-500 dark:text-green-400 mt-1">나스닥100 3배</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            빌린 $2에 대해 매일 이자가 붙는다. 이 이자가 운용보수에는 포함되지 않는다.
          </p>
        </div>

        <P>
          스왑 계약에서 JPMorgan·Goldman Sachs 등 카운터파티 은행은 TQQQ에 나스닥100 수익률을 제공하는 대신,
          차입 이자를 받는다. 이 이자는 단기 시장금리(SOFR)를 기준으로 결정된다.
        </P>

        {/* 3. 스왑 차입 이자의 구조 */}
        <H2>스왑 차입 이자 = SOFR + 50bps</H2>

        <P>
          JPMorgan이 SEC에 제출한 424B2 구조화 상품 문서에는 다음과 같이 명시되어 있다.
        </P>

        <FormulaBlock>
          "notional financing cost is intended to approximate the cost of maintaining<br/>
          a position in the QQQ Fund using borrowed funds at a rate of interest equal to<br/>
          <strong>SOFR plus a spread of 0.50% per annum</strong>"<br/>
          — JPMorgan Chase 424B2 (SEC, 2024)
        </FormulaBlock>

        <P>
          SOFR(담보부 익일 자금금리)은 2023년 LIBOR를 대체한 미국 단기 기준금리로,
          연방기금금리(Fed Funds Rate)와 거의 동일하게 움직인다(보통 5~10bps 차이).
          스왑 차입 이자 구조를 정리하면:
        </P>

        <FormulaBlock>
          연간 스왑 차입 비용(NAV 대비) = (SOFR + 0.50%) × 2<br/><br/>
          │ 빌린 금액이 NAV의 2배이므로 ×2<br/>
          │ SOFR ≈ 연방기금금리<br/>
          └ 0.50% = 카운터파티 스프레드
        </FormulaBlock>

        <P>
          ProShares는 실제 스왑 스프레드를 공개하지 않는다. 위 50bps는 JPMorgan의 구조화 상품
          인덱스 방법론에서 확인한 수치이며, 실제 TQQQ의 복수 카운터파티(JPM·GS·BofA·MS)와의
          OTC 계약 조건은 각기 다를 수 있다.
        </P>

        {/* 4. 금리별 실제 총비용 */}
        <H2>금리 수준에 따른 실제 총 비용</H2>

        <Table
          headers={['시기', 'SOFR', '스왑 차입 비용', '운용보수', '연간 총 비용']}
          rows={[
            ['2020~2021 (제로금리)',  '0.05%', '(0.05+0.5)×2 = 1.1%', '0.82%', <strong className="text-orange-600 dark:text-orange-400">1.92%</strong>],
            ['2022 (금리 인상 초)',  '1.50%', '(1.5+0.5)×2 = 4.0%',  '0.82%', <strong className="text-orange-600 dark:text-orange-400">4.82%</strong>],
            ['2023 (고금리 정점)',   '5.33%', '(5.33+0.5)×2 = 11.7%', '0.82%', <strong className="text-red-600 dark:text-red-400">12.5%</strong>],
            ['2024',                 '5.08%', '(5.08+0.5)×2 = 11.2%', '0.82%', <strong className="text-red-600 dark:text-red-400">12.0%</strong>],
            ['2026년 현재',          '4.00%', '(4.0+0.5)×2 = 9.0%',  '0.82%', <strong className="text-orange-600 dark:text-orange-400">9.82%</strong>],
          ]}
          note="스왑 차입 비용은 NAV 대비 연간 기준. 일별 복리 계산 시 실제 연간 수치는 소폭 다를 수 있음."
        />

        <Callout color="red">
          <strong>2023년 예시:</strong> 나스닥100이 연 4% 오른 해에 TQQQ는 3배인 12%를 벌지만,
          총 비용 12.5%를 빼면 수익률은 −0.5%다. 지수는 올랐는데 TQQQ는 손실이다.
          금리가 높을수록 TQQQ가 수익을 내려면 나스닥100이 그만큼 더 올라야 한다.
        </Callout>

        {/* 5. 왜 저금리 시기에 더 주목해야 하나 */}
        <H2>저금리 시기에도 스프레드는 사라지지 않는다</H2>

        <P>
          금리가 0에 가까웠던 2010~2021년에는 SOFR 자체가 0.05% 수준이었다.
          그러면 스왑 비용도 거의 0일까? 아니다.
        </P>

        <P>
          기준금리가 0이어도 카운터파티 스프레드 50bps는 그대로 붙는다.
          차입 비용 = (0.05% + 0.50%) × 2 = <strong>연 1.1%</strong>.
          운용보수 0.82%보다 크다.
        </P>

        <P>
          즉 스프레드를 무시하면 저금리 구간 전체에서 매년 약 1%의 비용을 빠뜨리게 된다.
          10년이면 복리로 약 10%, 20년이면 약 18%가 차이 난다.
          이것이 우리 백테스트에서 스프레드를 명시적으로 추가한 이유다.
        </P>

        {/* 6. 백테스트 수식 */}
        <H2>우리 백테스트에서의 반영 방법</H2>

        <P>
          합성 TQQQ 일별 수익을 계산하는 수식은 다음과 같다.
        </P>

        <FormulaBlock>
          TQQQ 일별 계수 =<br/>
          (1 + 3 × NDX일수익 − 2 × (연방기금금리 + 0.5%) / 252)<br/>
          × (1 − 0.82% / 252)<br/><br/>
          │ 3 × NDX일수익: 3배 노출<br/>
          │ 2 × (FFR + 0.5%) / 252: 차입 이자 (스프레드 포함)<br/>
          └ 0.82% / 252: 일할 운용보수
        </FormulaBlock>

        <P>
          연방기금금리 데이터는 미국 연방준비제도(Fed)의 월별 공시값을 사용한다.
          데이터가 없는 구간(1971년 이전)은 3%로 가정한다.
        </P>

        {/* 7. 백테스트 결과에 미친 영향 */}
        <H2>스프레드 반영 전후 백테스트 비교</H2>

        <P>
          스왑 스프레드 50bps를 추가하기 전후로 25% 룰 인출 시뮬레이션(668개 시작 시점, 데이터 끝까지) 결과가 어떻게 달라졌는지 비교했다.
        </P>

        <Table
          headers={['전략', '스프레드 미반영', '스프레드 반영 (50bps)', '차이']}
          rows={[
            [
              '25% 룰',
              '23,021억',
              <strong className="text-blue-600 dark:text-blue-400">16,499억</strong>,
              <span className="text-red-500 dark:text-red-400">−28%</span>,
            ],
            [
              'S0 (EMA200-15일)',
              '4,348억',
              <strong className="text-blue-600 dark:text-blue-400">3,155억</strong>,
              <span className="text-red-500 dark:text-red-400">−27%</span>,
            ],
          ]}
          note="10년 이상 보유 시작 시점의 최종 자산 중간값. 스왑금리(기준금리) 반영 기준. 초기 10억, 데이터 끝까지."
        />

        <P>
          최종 자산이 약 27~28% 줄었다. 매년 연 1% 추가 비용이 55년 복리로 누적된 결과다.
          액수로는 크지만, 결론이 바뀌지는 않는다.
          25% 룰은 여전히 S0 대비 압도적으로 우세하고,
          오히려 <em>더 현실에 가까운 수치</em>로 봐야 한다.
        </P>

        <Callout color="green">
          <strong>스프레드 반영 전 백테스트가 더 낙관적이었다</strong>는 뜻이기도 하다.
          투자 기간 중 금리가 낮았던 구간(2010~2021)에서 실제보다 수익을 과대 평가했다.
          스프레드를 넣은 지금이 더 보수적이고 더 정확한 추정이다.
        </Callout>

        {/* 8. 운용보수 숫자의 함정 */}
        <H2>ETF 비교할 때 운용보수만 보면 안 되는 이유</H2>

        <P>
          일반 ETF(QQQ 0.20%, VOO 0.03%)는 주식을 직접 보유하기 때문에
          운용보수가 사실상 전부다. 레버리지 ETF는 다르다.
        </P>

        <Table
          headers={['ETF', '운용보수', '스왑 차입 비용 (SOFR 4% 기준)', '총 비용']}
          rows={[
            ['QQQ', '0.20%', '없음', '0.20%'],
            ['QLD (2배)', '0.95%', '(4.0+0.5)×1 = 4.5%', '~5.5%'],
            ['TQQQ (3배)', '0.82%', '(4.0+0.5)×2 = 9.0%', '~9.8%'],
          ]}
          note="2026년 10월 현재 연방기금금리 4.0% 기준 추정치. QLD 스프레드도 50bps 가정."
        />

        <P>
          QQQ 대비 TQQQ의 비용 차이는 운용보수 0.62%p가 아니라,
          현재 금리 기준으로 약 9.6%p다.
          장기 보유 시 이 비용 차이를 3배 레버리지 수익으로 상쇄하고도 남아야 TQQQ가 유리하다.
          실제 백테스트 결과는 상쇄되고도 크게 남는다는 걸 보여주지만,
          금리가 높은 구간에서는 그 여유가 줄어든다.
        </P>

        {/* 9. 마무리 */}
        <H2>정리</H2>

        <div className="space-y-3 mb-8">
          {[
            'TQQQ 비용 = 운용보수(0.82%) + 스왑 차입 이자(2 × (SOFR + 50bps))',
            '제로금리에도 스프레드 때문에 연 1% 이상의 숨겨진 비용이 존재한다',
            '고금리 시기(2023)에는 총 비용이 연 12%를 넘겨 손익분기 허들이 높아진다',
            '이 사이트의 모든 "스왑금리 반영" 백테스트는 이 구조를 수식에 반영하고 있다',
            '스프레드를 추가하면 25% 룰 중간값이 23,021억 → 16,499억으로 낮아지지만 결론은 동일하다',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="mt-0.5 shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* 관련 글 */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-10 mt-10">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">관련 글</p>
          <div className="space-y-2">
            {[
              { href: '/posts/real-vs-synthetic', title: '백테스트의 TQQQ는 실제 TQQQ를 얼마나 잘 따라갔나', desc: '2010년 이후 실제 vs 합성 TQQQ 성과 직접 비교' },
              { href: '/posts/withdrawal-guide', title: '인출식 방법론', desc: '25% 룰 전략 전체 설계도' },
              { href: '/posts/withdrawal-full-period', title: '모든 인출 전략을 1971년부터 오늘까지', desc: '비용 반영 후 전략별 결과 비교' },
            ].map(({ href, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
              >
                <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
