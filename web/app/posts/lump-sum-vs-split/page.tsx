import Link from 'next/link'
import Header from '@/components/Header'

function DataLink({ inst, m }: { inst: string; m: string }) {
  return (
    <Link
      href={`/posts/lump-sum-vs-split/data?inst=${inst}&m=${m}`}
      className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap"
    >
      데이터 →
    </Link>
  )
}

function Tag({ children }: { children: string }) {
  return (
    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{children}</span>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-12 mb-4 text-gray-900 dark:text-white">{children}</h2>
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

function Table({ headers, rows, highlight }: {
  headers: string[]
  rows: (string | number | React.ReactNode)[][]
  highlight?: number[]
}) {
  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {headers.map((h) => (
              <th key={h} className="py-2 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, i) => (
            <tr key={i} className={`transition-colors ${highlight?.includes(i) ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-4 text-gray-700 dark:text-gray-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function LumpSumVsSplitPost() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">
            ← 목록으로
          </Link>
          <h1 className="text-3xl font-black leading-tight mb-4">
            거치금 2.5억, 한번에 넣을까 vs 5년에 나눠 넣을까
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-01 · 최종수정 2026-10-03</span>
            {['C전략', '거치', '분할매수', 'TQQQ', '백테스트'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <Callout color="yellow">
          <strong>2026-10-03 수정: 결론이 3년 → 5년 분할로 바뀌었다.</strong>{' '}
          처음 글은 운용보수·스왑금리비용을 넣기 전 계산으로 &ldquo;3년 분할이 최악을 12.24년 → 8.82년으로 줄인다&rdquo;였다.
          비용(TQQQ 운용보수 0.88% + 스왑금리 기준금리 × 2)을 넣고 다시 계산하면, 3년 분할의 최악은 오히려 13.3년으로 늘어난다.
          1999년 초에 시작한 경우가 2008년 금융위기 직전에 10억을 아슬아슬하게 못 넘기고 2012년까지 기다리게 되기 때문이다.
          5년으로 나누면 이런 경우가 사라진다. 아래 수치는 모두 비용을 반영한 값이다.
        </Callout>

        {/* 본문 */}
        <P>
          C전략(거치 2.5억 + 매일 20만원 계속 적립)을 쓰기로 했다면,
          바로 다음 질문이 따라온다.
        </P>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-4 mb-6 text-gray-600 dark:text-gray-200 italic text-sm leading-relaxed">
          "2.5억을 오늘 하루에 다 넣어야 하나, 아니면 몇 년에 걸쳐 나눠 넣어야 하나?"
        </div>
        <P>
          특히 몇 년째 강세장이 이어진 뒤라면 이 질문은 더 절실해진다.
          "오늘 넣었는데 다음 달에 반토막 나면 어떡하지"라는 두려움은 누구나 한 번쯤 해본다.
          그래서 1971~2026년 역사 데이터로 직접 테스트해봤다.
        </P>

        <H2>무엇을 테스트했나</H2>
        <P>
          거치 타이밍 리스크를 줄이는 방법으로 총 10가지 방식을 비교했다.
          일 20만원 적립은 모든 케이스에서 동일하게 유지하고,
          <strong className="text-gray-900 dark:text-white"> 거치금 2.5억만</strong> 어떻게 넣느냐를 바꿨다.
        </P>

        <div className="space-y-3 mb-8">
          <div className="flex gap-3 text-sm">
            <span className="text-yellow-500 dark:text-yellow-400 font-mono shrink-0">기준선</span>
            <span className="text-gray-600 dark:text-gray-300">첫날 2.5억 전액 즉시 거치</span>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-blue-500 dark:text-blue-400 font-mono shrink-0">하락 대기</span>
            <span className="text-gray-600 dark:text-gray-300">
              고점 대비 −15% / −20% / −30% 하락 시 트리거, 이후 1년(252거래일)에 걸쳐 균등 분산 매수.
              조건이 안 걸리면 10년 뒤 한번에 매수.
            </span>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-emerald-600 dark:text-emerald-400 font-mono shrink-0">시간 분할</span>
            <span className="text-gray-600 dark:text-gray-300">
              월 단위: 3년(36개월) / 4년(48개월) / 5년(60개월) 균등 분할.
              일 단위: 1년(252일) / 2년(504일) / 3년(756일) 균등 분할.
            </span>
          </div>
        </div>

        <P>
          1971년부터 2026년까지 매월 시작할 수 있는 모든 시점(668가지 경우)에 각 방식을 적용했다.
          평가 기준은 완료율, 평균 소요기간, <strong className="text-gray-900 dark:text-white">최악의 경우(최장 소요기간)</strong>,
          그리고 <strong className="text-gray-900 dark:text-white">10년 넘게 걸린 경우의 수</strong>다.
          최악 1건은 &lsquo;목표에 아슬아슬하게 닿았느냐&rsquo;에 따라 몇 년씩 튀기 때문에, 10년 넘게 걸린 경우가 몇 번인지도 함께 본다
          (충분히 지켜볼 수 있는 2011년까지 시작한 경우 기준).
        </P>

        <H2>결과: TQQQ(3배) 전체 수치 (운용보수 + 스왑금리 반영)</H2>

        <Table
          headers={['방식', '완료율', '평균', '중앙값', '최장', '10년 넘게 걸린 경우', '']}
          highlight={[0, 6]}
          rows={[
            ['기준선 — 즉시 거치', '95.5%', '3.76년', '3.08년', <strong key="max" className="text-yellow-500 dark:text-yellow-300">12.32년</strong>, '27번', <DataLink inst="ndx3x" m="instant" />],
            ['하락 −15% 후 1년 분산', '94.8%', '4.04년', '3.44년', '12.82년', '26번', <DataLink inst="ndx3x" m="dip15" />],
            ['하락 −20% 후 1년 분산', '94.8%', '4.06년', '3.50년', '12.82년', '26번', <DataLink inst="ndx3x" m="dip20" />],
            ['하락 −30% 후 1년 분산', '94.5%', '4.08년', '3.52년', '12.90년', '27번', <DataLink inst="ndx3x" m="dip30" />],
            ['월 분할 3년 (36개월)', '94.5%', '4.26년', '3.70년', '13.32년', '14번', <DataLink inst="ndx3x" m="monthly3y" />],
            ['월 분할 4년 (48개월)', '94.0%', '4.41년', '4.02년', '13.36년', '5번', <DataLink inst="ndx3x" m="monthly4y" />],
            [<strong key="m5">월 분할 5년 (60개월) ★</strong>, '93.7%', '4.57년', '4.28년', <strong key="max" className="text-green-600 dark:text-green-300">8.99년</strong>, <strong key="t" className="text-green-600 dark:text-green-300">0번</strong>, <DataLink inst="ndx3x" m="monthly5y" />],
            ['일 분할 1년 (252일)', '95.1%', '3.94년', '3.33년', '12.74년', '25번', <DataLink inst="ndx3x" m="daily1y" />],
            ['일 분할 2년 (504일)', '94.8%', '4.10년', '3.47년', '13.15년', '20번', <DataLink inst="ndx3x" m="daily2y" />],
            ['일 분할 3년 (756일)', '94.3%', '4.26년', '3.71년', '13.32년', '13번', <DataLink inst="ndx3x" m="daily3y" />],
          ]}
        />

        <Callout color="green">
          <strong>5년(60개월) 월 분할이 10년 넘게 걸리는 경우를 27번 → 0번으로 없애고, 최악을 12.32년 → 8.99년으로 줄인다.</strong>
          <br />
          3·4년 분할은 10년 넘게 걸리는 경우를 줄이긴 하지만 최악은 오히려 13년대다. 대가는 중앙값으로, 즉시 거치보다 약 1.2년 늦다(3.08 → 4.28년).
          6·7년으로 늘려도 최악은 9.0~9.1년으로 더 나아지지 않아 5년이 효율적인 지점이다.
          비용을 연 0.25~0.5%p 더 얹어도 5년 분할의 최악은 9.0~9.2년으로 흔들리지 않았다.
        </Callout>

        <H3>하락 대기형은 왜 효과가 없나</H3>
        <P>
          하락을 기다렸다가 넣는 방식은 직관적으로 매력적이다. 그런데 결과는 반대였다.
          하락 −15%/−20%/−30% 방식 모두 최장 소요기간이 즉시 거치보다 오히려 더 길어졌다.
        </P>
        <P>
          이유는 간단하다. <strong className="text-gray-900 dark:text-white">하락이 오지 않는 시장</strong>이 있기 때문이다.
          강세장이 10년 이어지는 동안 −15% 조건이 한 번도 안 걸리면, 거치금은 10년 동안 현금으로 묶인다.
          1990년대 후반처럼 나스닥이 계속 오르는 환경에서 이 방식을 쓰면,
          가장 비싼 가격에 한번에 사게 되거나 아예 못 사게 된다.
        </P>

        <H3>월 단위 vs 일 단위: 차이 없다</H3>
        <P>
          3년 시간 분할의 경우 월 단위(36개월)와 일 단위(756일) 결과가 거의 같았다(최장 13.32년, 10년 넘게 걸린 경우 14번 vs 13번).
          즉, 얼마나 잘게 쪼개느냐는 중요하지 않다.
          <strong className="text-gray-900 dark:text-white"> 총 몇 년에 걸쳐 분산하느냐</strong>만 결과를 결정한다.
          편의에 따라 매월 한 번 넣든 매일 넣든 골라도 된다.
        </P>

        <H2>QLD(2배), QQQ(1배): 분할 효과가 작거나 오히려 손해</H2>

        <Table
          headers={['종목', '방식', '완료율', '평균', '최장', '']}
          highlight={[0, 3]}
          rows={[
            [<strong key="q" className="text-gray-900 dark:text-white">QLD (2x)</strong>, '즉시 거치 (기준선)', '94.9%', '4.45년', '12.63년 · 10년+ 25번', <DataLink inst="ndx2x" m="instant" />],
            ['', '월 분할 3년', '93.6%', '4.88년', '13.44년 · 10년+ 19번', <DataLink inst="ndx2x" m="monthly3y" />],
            ['', '월 분할 5년', '92.7%', '5.23년', '12.68년 · 10년+ 13번', <DataLink inst="ndx2x" m="monthly5y" />],
            [<strong key="q" className="text-gray-900 dark:text-white">QQQ (1x)</strong>, '즉시 거치 (기준선)', '90.9%', '5.68년', '11.88년 · 10년+ 27번', <DataLink inst="ndx1x" m="instant" />],
            ['', '월 분할 3년', '90.7%', '6.24년', '12.40년 · 10년+ 31번', <DataLink inst="ndx1x" m="monthly3y" />],
            ['', '월 분할 5년', '89.8%', '6.52년', '11.96년 · 10년+ 32번', <DataLink inst="ndx1x" m="monthly5y" />],
          ]}
        />

        <Callout color="yellow">
          QLD는 5년 분할로 10년 넘게 걸리는 경우가 25번 → 13번으로 줄지만 최악(12.6년)은 그대로이고, 평균이 0.8년 늦어진다.
          QQQ는 분할할수록 오히려 나빠진다(10년 넘게 걸린 경우 27번 → 32번).
          5년 분할이 확실히 효과를 내는 건 TQQQ뿐이다.
        </Callout>

        <H2>왜 3배에서만 이런 일이 벌어질까</H2>
        <P>
          레버리지는 상승과 하락을 모두 증폭시킨다.
          NDX 1배가 −80% 빠질 때, 3배 합성자산은 수학적으로 거의 전액이 사라지는 수준으로 떨어진다
          (−99%+). 2000~2002년 닷컴버블이 실제로 그랬다.
        </P>
        <P>
          이 말은 3배 자산이 크게 빠졌을 때 "싸게 사는" 효과가 1배·2배와 비교할 수 없이 크다는 뜻이다.
          5년에 걸쳐 분산 매수를 하면, 하락 전에 산 주식은 비싸지만 하락 중·이후에 산 주식이
          극도로 싼 가격에 들어가 전체 평균 매입단가를 낮춘다.
        </P>
        <P>
          1배·2배 자산은 드로다운 깊이가 상대적으로 얕아서 이 역전이 일어나지 않는다.
          분산으로 인한 <strong className="text-gray-900 dark:text-white">"기회비용(지연 비용)"</strong>이
          저가 매수 이득보다 크기 때문에, 나눠 넣는 것이 오히려 손해다.
        </P>

        <H2>검증 과정</H2>
        <P>
          초기 구현에서는 하락 조건을 계산할 때 역사상 전체 최고점을 기준으로 삼는 버그가 있었다.
          나스닥100 3배 합성자산의 역사적 최고점은 아직도 2000년 3월 닷컴버블 피크다.
          그래서 2000년 이후 시작한 거의 모든 진입 시점이 "이미 −90% 넘게 하락한 상태"로 잘못 계산됐다.
          이를 <strong className="text-gray-900 dark:text-white">각 투자자가 투자를 시작한 시점 이후의 최고점</strong> 기준으로 수정한 뒤에도
          분할의 효과는 그대로 유지됐다.
        </P>

        <H2>실전 적용 요약</H2>
        <ul className="list-none space-y-3 mb-8">
          {[
            { color: 'text-blue-500 dark:text-blue-400', text: 'TQQQ(3배)에 목돈을 넣을 계획이라면 — 5년(60개월)에 걸쳐 매달 나눠 넣는다. 3·4년은 2008년 금융위기 같은 시점에 걸리면 오히려 13년 넘게 걸릴 수 있다.' },
            { color: 'text-yellow-500 dark:text-yellow-400', text: 'QQQ(1배), VOO(1배)에 목돈을 넣을 계획이라면 — 즉시 거치가 더 낫다. QLD(2배)는 5년 분할이 오래 걸리는 경우를 줄이지만 평균이 늦어져 장단이 있다.' },
            { color: 'text-gray-400', text: '"하락을 기다렸다가 넣겠다"는 전략은 작동하지 않는다. 하락이 충분히 오지 않는 강세장 시나리오에서 최악의 결과를 만들어낸다.' },
          ].map((item, i) => (
            <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300 text-sm">
              <span className={`${item.color} mt-0.5 shrink-0`}>→</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>

        {/* 캐비엇 */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed space-y-2">
          <p className="font-semibold text-gray-700 dark:text-gray-300">캐비엇</p>
          <p>
            여기서 쓰인 TQQQ/QLD 가격은 NDX 일별 수익률 × 레버리지로 합성한 이론치다.
            운용비용(TQQQ 0.88%/년)과 스왑금리비용(기준금리 × 2/년, QLD는 × 1)을 반영했다. 데이터 페이지의 [운용보수만] 버튼으로 스왑금리를 뺀 이론치도 볼 수 있다. 배당은 미반영 (실제 TQQQ보다 연 2%p 정도 보수적). 변동성 끌림은 일별 복리 계산에 자동 반영된다.
          </p>
          <p>
            분석 기간(1971~2026) 중 진짜로 위험했던 극단적 구간은 1999~2000년 닷컴버블 단 한 번이다.
            표본이 제한적이라는 점을 감안할 것.
          </p>
          <p>
            이 결론은 거치할 돈을 <em>어떻게</em> 넣을지에 대한 것이며,
            매일 꾸준히 적립하는 부분(일 20만원)은 분할 여부와 무관하게 계속 유지하는 게 전제다.
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-16 pt-8 flex items-center justify-between text-sm text-gray-400">
          <Link href="/posts" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">← 글 목록</Link>
          <Link href="/simulator" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">시뮬레이터에서 직접 돌려보기 →</Link>
        </div>
      </main>
    </div>
  )
}
