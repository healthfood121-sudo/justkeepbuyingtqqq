import Link from 'next/link'
import Header from '@/components/Header'

function Tag({ children }: { children: string }) {
  return (
    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
      {children}
    </span>
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

function Callout({ color = 'blue', children }: { color?: 'blue' | 'yellow' | 'green'; children: React.ReactNode }) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    green:  'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
  }
  return (
    <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>
      {children}
    </div>
  )
}

function Formula({ children }: { children: React.ReactNode }) {
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

export default function SyntheticMethodologyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" />

      <main className="max-w-3xl mx-auto px-6 py-16">

        <Link href="/posts"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-8 inline-block">
          ← 전체 글 목록
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">적립식</span>
            {['합성가격', '방법론', '원본 데이터', '투명성'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-4">
            합성 가격은 어떻게 계산됐나<br />— 수식과 1971년부터의 일별 원본 데이터
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-15</p>
        </div>

        <Callout color="green">
          <strong>이 글의 목적:</strong> 이 사이트의 모든 백테스트가 사용하는 합성 가격이 어떤 수식으로,
          어떤 입력 데이터를 써서 만들어졌는지 공개한다.
          수식과 파라미터를 직접 확인하고 싶거나, 데이터를 직접 내려받아
          검증하고 싶은 분을 위한 문서다.
        </Callout>

        {/* 1. 왜 합성 가격인가 */}
        <H2>왜 실제 TQQQ 가격이 아니라 합성 가격인가</H2>

        <P>
          TQQQ는 2010년 2월에 상장됐다. 상장 이전 기간을 백테스트하려면 실제 가격이 존재하지 않는다.
          닷컴버블(2000~2002)과 금융위기(2008~2009)를 포함하려면
          나스닥100 원지수 데이터에 수학적으로 레버리지를 적용해 <strong>합성 가격</strong>을 만드는 수밖에 없다.
        </P>

        <P>
          나스닥100(NDX) 일별 종가는 1971년 2월까지 거슬러 올라간다.
          이 데이터에서 하루하루의 수익률을 계산하고, 레버리지를 곱해 누적하면
          TQQQ가 1971년부터 존재했다면 어떻게 움직였을지를 근사할 수 있다.
        </P>

        <P>
          합성 가격이 실제 TQQQ를 얼마나 잘 따라가는지는{' '}
          <Link href="/posts/real-vs-synthetic" className="text-blue-600 dark:text-blue-400 underline">
            별도 검증 글
          </Link>에서 확인할 수 있다.
          결론: 낙폭과 타이밍은 실제와 거의 같고, 장기 수익률은 오히려 합성이 보수적이다(배당 미반영).
        </P>

        {/* 2. 원천 데이터 */}
        <H2>원천 데이터: NDX 일별 종가</H2>

        <P>
          나스닥100 지수의 일별 종가 데이터를 사용한다.
          1971년 2월~1985년 9월은 나스닥 종합지수, 1985년 10월 이후는 NDX(나스닥100)로 소스가 전환된다.
          전환 시점에서 두 지수의 수준이 달라 <strong>가짜 급락</strong>이 데이터에 심어져 있다.
        </P>

        <H3>스플라이스 보정</H3>

        <P>
          1985-10-01 기준으로 이전 전체 구간의 값을 비율 조정한다.
          보정 전후 인접 날짜의 비율 차이를 스케일 계수로 적용해 연속성을 확보한다.
        </P>

        <Formula>
          splice_date = 1985-10-01<br />
          scale = close[splice_date − 1일] / close[splice_date]<br />
          close[splice_date 이전 전체] ×= scale
        </Formula>

        <Callout color="yellow">
          보정은 <em>수준(level)</em>만 맞추는 것이고, 날짜별 <em>수익률</em>은 변하지 않는다.
          합성 가격 계산에 쓰이는 것은 일별 수익률이므로 스플라이스가 최종 결과에 미치는 영향은 없다.
          다만 차트에서 가격 수준을 시각적으로 비교할 때 보정이 없으면 1985년 이전 구간이 완전히 왜곡되므로 반드시 적용한다.
        </Callout>

        {/* 3. 합성가격 계산 수식 */}
        <H2>합성가격 계산 수식</H2>

        <P>
          합성가격은 <strong>일별 계수(factor)</strong>를 1부터 누적 곱해서 만든다.
          각 날짜의 계수는 &ldquo;3배 수익 − 차입 이자 − 운용보수&rdquo; 세 가지를 하루치로 환산해 합산한 것이다.
        </P>

        <H3>TQQQ (나스닥100 3배)</H3>

        <Formula>
          factor<sub>i</sub> = (1 + 3 × r<sub>i</sub> − 2 × (FFR<sub>i</sub> + 0.50%) / 252)<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;× (1 − 0.88% / 252)<br /><br />
          합성가격<sub>i</sub> = 100 × ∏(factor<sub>1</sub> ~ factor<sub>i</sub>)
        </Formula>

        <H3>QLD (나스닥100 2배)</H3>

        <Formula>
          factor<sub>i</sub> = (1 + 2 × r<sub>i</sub> − 1 × (FFR<sub>i</sub> + 0.50%) / 252)<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;× (1 − 0.95% / 252)
        </Formula>

        <H3>나스닥100 (1배, QQQ 근사)</H3>

        <Formula>
          factor<sub>i</sub> = (1 + r<sub>i</sub>) × (1 − 0.20% / 252)<br /><br />
          레버리지가 없으므로 차입 이자 없음
        </Formula>

        <P>
          여기서 <code className="text-sm bg-gray-100 dark:bg-gray-800 px-1 rounded">r<sub>i</sub></code>는
          NDX 보정 종가의 전일 대비 수익률,
          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-1 rounded ml-1">FFR<sub>i</sub></code>는
          해당 날짜 월의 연방기금금리(연율)다.
          252는 연간 거래일 수로 이자와 보수를 하루치로 환산하는 데 쓴다.
        </P>

        {/* 4. 파라미터 출처 */}
        <H2>파라미터 값과 출처</H2>

        <Table
          headers={['항목', '값', '출처']}
          rows={[
            ['TQQQ 운용보수', '연 0.88%', 'ProShares 공시 (Expense Ratio)'],
            ['QLD 운용보수', '연 0.95%', 'ProShares 공시 (Expense Ratio)'],
            ['나스닥100 운용보수', '연 0.20%', 'Invesco QQQ 공시 (Expense Ratio)'],
            ['스왑 스프레드', '연 0.50%', 'JPMorgan 424B2 SEC 제출 문서'],
            ['차입 배수', 'TQQQ: 2배, QLD: 1배', '레버리지 = 노출 − NAV'],
            ['연간 거래일 수', '252일', '미국 주식시장 표준'],
          ]}
          note="운용보수는 포스팅 작성 시점 기준. 실제 ETF 공시를 직접 확인하면 소폭 다를 수 있음."
        />

        <Callout color="yellow">
          <strong>스왑 스프레드 근거:</strong> JPMorgan Chase가 SEC에 제출한 424B2 구조화 상품 문서에
          &ldquo;notional financing cost&hellip; at a rate of interest equal to SOFR plus a spread of 0.50% per annum&rdquo;으로 명시됨.
          ProShares는 실제 스왑 스프레드를 별도 공개하지 않는다.
          이 0.50%는 다수 카운터파티(JPM·GS·BofA·MS)와의 OTC 계약 중 하나의 수치이며
          실제 평균 조건과 다를 수 있다. 비용 구조 전체는{' '}
          <Link href="/posts/tqqq-cost" className="underline">TQQQ 비용의 전부</Link> 참고.
        </Callout>

        {/* 5. 연방기금금리 */}
        <H2>연방기금금리 데이터</H2>

        <P>
          차입 이자 계산에 사용하는 FFR은 미국 연방준비제도(Fed)의 월별 실효 연방기금금리(EFFR) 공시값을 사용한다.
          데이터가 없는 1971년 이전 구간은 3.0%로 대입한다.
          SOFR은 EFFR과 5~10bps 차이이므로 근사값으로 사용해도 큰 오차가 없다.
        </P>

        <P>
          금리가 높을수록 차입 이자가 커져 합성가격 성장이 느려진다.
          2023년 5.33% 구간에서 TQQQ의 연간 총 비용은 약 12.5%였다.
          반대로 2010~2021년 제로금리 시기에는 차입 이자가 연 약 1.1%에 불과했다.
        </P>

        {/* 6. 계산 예시 */}
        <H2>계산 예시 — 하루치</H2>

        <P>
          2023년 3월 1일(FFR ≈ 4.58%, NDX 전일 대비 +1.2%)을 예시로 한 날의 TQQQ factor를 계산하면:
        </P>

        <Formula>
          차입 이자(하루) = 2 × (4.58% + 0.50%) / 252 = 0.04032%<br />
          레버리지 수익(하루) = 3 × 1.2% = 3.6%<br />
          운용보수(하루) = 0.88% / 252 = 0.003492%<br /><br />
          factor = (1 + 3.6% − 0.04032%) × (1 − 0.003492%)<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= 1.035594 × 0.999965<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;≈ 1.035558
        </Formula>

        <P>
          전날 합성가격이 5,000이었다면 이 날 합성가격은 5,000 × 1.035558 ≈ 5,177.8이 된다.
          이 계산을 1971-02-05부터 오늘까지 매일 반복해 누적한 것이 백테스트에 사용하는 합성 가격 시계열이다.
        </P>

        {/* 7. 데이터 공개 */}
        <H2>원본 데이터 공개</H2>

        <P>
          1971년 2월부터의 전체 일별 데이터를 아래 링크에서 확인하거나 CSV로 내려받을 수 있다.
          컬럼 구성은 날짜 / NDX 지수(보정 후) / TQQQ 합성 / QLD 합성 / 나스닥100 합성 / 연방기금금리.
          합성가격은 모두 1971-02-05 = 100 기준의 인덱싱된 값이다.
        </P>

        <Link
          href="/posts/synthetic-methodology/data"
          className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl px-6 py-4 transition-colors group mb-8"
        >
          <span className="text-2xl">📊</span>
          <div>
            <div className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              일별 원본 데이터 뷰어 →
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              1971-02-05 ~ 2026-09-25 · 14,027행 · 연도 필터 · CSV 전체 다운로드
            </div>
          </div>
        </Link>

        {/* 8. 한계 */}
        <H2>이 합성 가격의 한계</H2>

        <ul className="space-y-2 mb-8 text-sm text-gray-600 dark:text-gray-300 leading-relaxed list-disc pl-5">
          <li>
            <strong>배당 미반영.</strong> 실제 TQQQ는 나스닥100 기업의 배당을 스왑을 통해 수취한다.
            합성 가격은 배당을 포함하지 않아 오히려 실제보다 보수적이다 (장기 연 2~3%p 과소 추정).
          </li>
          <li>
            <strong>스왑 스프레드 추정 오차.</strong> 실제 ProShares의 평균 조달 금리는
            50bps와 다를 수 있다. 대형 카운터파티일수록 스프레드가 낮을 가능성이 있다.
          </li>
          <li>
            <strong>일별 리밸런싱 추적 오차 미반영.</strong> 실제 ETF는 하루 종료 시 레버리지 비율을
            맞추기 위해 소량 매매를 반복한다. 이 거래 비용과 슬리피지는 반영되지 않았다.
          </li>
          <li>
            <strong>1971년 이전 데이터 없음.</strong> 나스닥100은 1971년 이전 데이터가 존재하지 않는다.
            1929년 대공황 시뮬레이션은{' '}
            <Link href="/posts/synthetic-ndx-1929" className="text-blue-600 dark:text-blue-400 underline">
              S&P500 베타 회귀로 가상 합성한 별도 데이터
            </Link>를 사용한다.
          </li>
        </ul>

        {/* 관련 글 */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-10 mt-10">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">관련 글</p>
          <div className="space-y-2">
            {[
              { href: '/posts/tqqq-cost',        title: 'TQQQ 비용의 전부: 운용보수 0.82%는 빙산의 일각이다',     desc: '스왑 차입 이자 구조와 금리별 총 비용 상세 설명' },
              { href: '/posts/real-vs-synthetic', title: '백테스트의 TQQQ는 실제 TQQQ를 얼마나 잘 따라갔나',     desc: '2010년 이후 실제 vs 합성 16년 직접 비교' },
              { href: '/posts/accumulation-guide',title: '적립식 방법론',                                          desc: '합성가격을 사용한 백테스트 전체 설계도' },
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
