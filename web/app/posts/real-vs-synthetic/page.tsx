import Link from 'next/link'
import Header from '@/components/Header'
import RealVsSynthetic from '@/components/RealVsSynthetic'

function Tag({ children }: { children: string }) {
  return (
    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{children}</span>
  )
}

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

export default function RealVsSyntheticPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">
            ← 목록으로
          </Link>
          <h1 className="text-3xl font-black leading-tight mb-4">
            백테스트의 TQQQ는 실제 TQQQ를 얼마나 잘 따라갔나
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-07</span>
            {['검증', '합성가격', 'TQQQ', 'QLD', '배당'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <P>
          이 사이트의 모든 백테스트는 1971년부터의 나스닥 일별 수익률에 3배를 곱해 만든 <strong>합성 가격</strong>을 쓴다.
          TQQQ는 2010년에야 나왔기 때문이다. 그렇다면 TQQQ가 실제로 거래된 16년 동안, 합성 가격은 실제 가격과 얼마나 달랐을까?
          실제 TQQQ·QLD·나스닥100 ETF의 가격(배당 재투자 포함)을 받아 같은 기간을 그대로 비교했다.
        </P>

        <Callout color="green">
          <strong>결론: 백테스트는 실제보다 보수적이다.</strong><br />
          · <strong>떨어질 때는 똑같이 떨어졌다.</strong> 최대 낙폭이 실제 −81.7%, 합성 −81.7%로 같다. 하락의 깊이와 시점이 같으니 매도·매수 신호, 최악의 경우 판단은 그대로 믿어도 된다.<br />
          · <strong>오래 들고 가면 실제가 더 벌었다.</strong> TQQQ는 실제가 연 2.2%p 높았다. 사이트 숫자는 실제보다 덜 나오게 계산된 쪽이다.<br />
          · <strong>단, 기준금리가 0%에서 4~5%로 올라간 2022년 이후로는 차이가 크게 줄었다</strong> (해마다 −1~+2%p). 앞으로도 연 2%p씩 더 벌 거라고 기대하면 안 된다.
        </Callout>

        <RealVsSynthetic part="summary" />
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
          실제 = 배당을 다시 투자한 가격 (Yahoo 수정종가) · 합성 (사이트 기본) = 운용보수 + 스왑금리 반영 · 각 ETF 상장일 ~ 2026-09-25
        </p>

        <H2>16년 동안의 움직임</H2>
        <P>
          선 세 개가 거의 겹쳐서 움직인다. 2022년 −79% 하락도, 2020년 3월 폭락도 똑같이 지나갔다.
          벌어지는 건 오르는 해마다 실제가 조금씩 더 오르면서 그 차이가 쌓인 결과다.
        </P>
        <RealVsSynthetic part="chart" />

        <H2>왜 실제가 더 높았나 — 배당</H2>
        <P>
          백테스트에 쓰는 나스닥100 지수는 배당을 넣지 않은 가격만의 지수다. 실제 ETF는 기업들이 주는 배당을 받는다.
          1배 상품으로 확인하면 분명하다. 나스닥100 ETF는 실제가 연 10.9%였는데, 배당을 빼면 10.2%로
          합성 가격(10.1%)과 0.1%p 차이밖에 안 난다. 차이의 거의 전부가 배당이다.
        </P>
        <P>
          레버리지 상품은 이 배당 효과도 대략 레버리지만큼 커진다. TQQQ는 빌린 돈으로 3배만큼 나스닥100에 투자하는 계약(스왑)을 쓰는데,
          이 계약은 배당까지 포함한 수익을 주는 것으로 보인다. 사이트는 빌린 돈의 비용을 &lsquo;기준금리 × 2&rsquo;로 잡고 배당은 하나도 넣지 않으니,
          실제보다 비용을 크게 잡는 셈이다.
        </P>
        <P>
          그런데 이 차이는 해마다 같지 않았다. 아래 표에서 금리가 0%에 가깝던 2010~2021년에는 실제가 해마다 1~7%p 더 높았지만,
          기준금리가 4~5%로 올라간 2022년부터는 −1~+2%p로 줄었다. 금리가 높을 때는 실제 빌리는 비용이 사이트 가정과 비슷하거나 조금 더 컸다는 뜻이다.
          사이트는 이 차이를 숫자에 더해 주지 않고, 보수적인 지금의 계산 방식을 그대로 둔다.
        </P>

        <H2>연도별 비교</H2>
        <RealVsSynthetic part="yearly" />

        <H2>이 검증의 한계</H2>
        <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed list-disc pl-5">
          <li><strong>닷컴버블 때는 TQQQ가 없었다.</strong> 레버리지 상품으로 확인할 수 있는 가장 긴 하락은 QLD의 2008년 금융위기(실제 −83.1% · 합성 −83.2%)다. 1배 상품은 1999년부터 있어 닷컴버블을 포함하는데, 여기서도 낙폭은 −83.0%로 같았다.</li>
          <li><strong>1971~2009년의 배당·금리 환경은 지금과 다르다.</strong> 그 시기 합성 가격이 실제와 얼마나 달랐을지는 확인할 방법이 없다.</li>
          <li><strong>하루 단위로는 조금씩 어긋난다.</strong> ETF 종가와 지수 종가가 계산되는 순간이 미세하게 달라서 생기는 차이로, 며칠 안에 서로 상쇄돼 장기 결과에는 영향이 없다.</li>
          <li><strong>환율은 이 비교에 들어가 있지 않다.</strong> 모두 달러 기준이다. 원화로 투자하는 사람에게 환율이 미치는 영향은 따로 다룰 예정이다.</li>
        </ul>

        <P>
          합성 가격을 만드는 방법은{' '}
          <Link href="/posts/accumulation-guide" className="text-blue-600 dark:text-blue-400 underline">적립식 방법론 2장</Link>에 있다.
        </P>
      </main>
    </div>
  )
}
