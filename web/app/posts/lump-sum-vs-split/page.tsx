import Link from 'next/link'
import Header from '@/components/Header'

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
            거치금 2.5억, 한번에 넣을까 vs 3년에 나눠 넣을까
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-01</span>
            {['B전략', '거치', '분할매수', 'TQQQ', '백테스트'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        {/* 본문 */}
        <P>
          B전략(거치 2.5억 + 매일 20만원 계속 적립)을 쓰기로 했다면,
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
            <span className="text-gray-600 dark:text-gray-300">첫날 2.5억 전액 즉시 거치 (기존 B전략)</span>
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
          1971년부터 2026년까지 매월 시작할 수 있는 모든 시점(668개 코호트)에 각 방식을 적용했다.
          평가 기준은 완료율, 평균 소요기간, 그리고 <strong className="text-gray-900 dark:text-white">최악의 경우(최장 소요기간)</strong>.
        </P>

        <H2>결과: TQQQ(3배) 전체 수치</H2>

        <Table
          headers={['방식', '완료율', '평균', '중앙값', '최단', '최장']}
          highlight={[0, 4, 9]}
          rows={[
            ['기준선 — 즉시 거치', '96.3%', '3.02년', '2.46년', '0.33년', <strong key="max" className="text-yellow-500 dark:text-yellow-300">12.24년</strong>],
            ['하락 −15% 후 1년 분산', '95.7%', '3.40년', '2.93년', '0.85년', '12.73년'],
            ['하락 −20% 후 1년 분산', '95.5%', '3.45년', '3.03년', '0.85년', '12.73년'],
            ['하락 −30% 후 1년 분산', '95.4%', '3.50년', '3.09년', '0.90년', '12.82년'],
            ['월 분할 3년 (36개월)', '94.8%', '3.64년', '3.23년', '1.27년', <strong key="max" className="text-green-600 dark:text-green-300">8.82년</strong>],
            ['월 분할 4년 (48개월)', '94.5%', '3.90년', '3.53년', '1.35년', <strong key="max" className="text-green-600 dark:text-green-300">8.82년</strong>],
            ['월 분할 5년 (60개월)', '94.0%', '4.09년', '3.78년', '1.42년', <strong key="max" className="text-green-600 dark:text-green-300">8.67년</strong>],
            ['일 분할 1년 (252일)', '95.7%', '3.28년', '2.78년', '0.77년', '12.65년'],
            ['일 분할 2년 (504일)', '95.2%', '3.46년', '3.02년', '1.10년', '12.99년'],
            ['일 분할 3년 (756일)', '94.8%', '3.66년', '3.25년', '1.27년', <strong key="max" className="text-green-600 dark:text-green-300">8.82년</strong>],
          ]}
        />

        <Callout color="green">
          <strong>3년 시간 분할(월 단위 또는 일 단위)이 최악의 케이스를 12.24년 → 8.82년으로 3.4년 단축.</strong>
          <br />
          4년·5년으로 더 늘려도 추가 개선은 미미하다. 3년이 효과가 나타나는 임계점이다.
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
          3년 시간 분할의 경우 월 단위(36개월)와 일 단위(756일) 결과가 소수점까지 동일했다(8.82년).
          즉, 얼마나 잘게 쪼개느냐는 중요하지 않다.
          <strong className="text-gray-900 dark:text-white"> 총 몇 년에 걸쳐 분산하느냐</strong>만 결과를 결정한다.
          편의에 따라 매월 한 번 넣든 매일 넣든 골라도 된다.
        </P>

        <H2>QLD(2배), QQQ(1배): 분할이 오히려 손해</H2>

        <Table
          headers={['종목', '방식', '완료율', '평균', '최장']}
          highlight={[0, 3, 6, 9]}
          rows={[
            [<strong key="q" className="text-gray-900 dark:text-white">QLD (2x)</strong>, '즉시 거치 (기준선)', '95.2%', '3.83년', '11.55년'],
            ['', '월 분할 3년', '93.9%', '4.41년', '12.38년'],
            ['', '월 분할 5년', '93.1%', '4.74년', '9.24년'],
            [<strong key="q" className="text-gray-900 dark:text-white">QQQ (1x)</strong>, '즉시 거치 (기준선)', '91.2%', '5.64년', '11.72년'],
            ['', '월 분할 3년', '90.7%', '6.20년', '12.31년'],
            ['', '월 분할 5년', '90.0%', '6.48년', '11.78년'],
          ]}
        />

        <Callout color="yellow">
          QLD·QQQ에서 분할매수는 전략적 이점이 없다.
          3년 분할 기준 QLD 최장은 11.55 → 12.38년으로 오히려 악화.
          평균 소요기간도 모든 분할 방식에서 즉시 거치보다 길어졌다.
        </Callout>

        <H2>왜 3배에서만 이런 일이 벌어질까</H2>
        <P>
          레버리지는 상승과 하락을 모두 증폭시킨다.
          NDX 1배가 −80% 빠질 때, 3배 합성자산은 수학적으로 거의 전액이 사라지는 수준으로 떨어진다
          (−99%+). 2000~2002년 닷컴버블이 실제로 그랬다.
        </P>
        <P>
          이 말은 3배 자산이 크게 빠졌을 때 "싸게 사는" 효과가 1배·2배와 비교할 수 없이 크다는 뜻이다.
          3년에 걸쳐 분산 매수를 하면, 하락 전에 산 주식은 비싸지만 하락 중·이후에 산 주식이
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
          그래서 2000년 이후 시작한 거의 모든 코호트가 "이미 −90% 넘게 하락한 상태"로 잘못 계산됐다.
          이를 <strong className="text-gray-900 dark:text-white">각 투자자가 투자를 시작한 시점 이후의 최고점</strong> 기준으로 수정한 뒤에도
          3년 분할의 효과는 그대로 유지됐다.
        </P>

        <H2>실전 적용 요약</H2>
        <ul className="list-none space-y-3 mb-8">
          {[
            { color: 'text-blue-500 dark:text-blue-400', text: 'TQQQ(3배)에 목돈을 넣을 계획이라면 — 3년에 걸쳐 나눠 넣는 것을 고려할 가치가 있다. 나누는 빈도(매월/매일)는 편의에 따라 선택. 결과 차이 없음.' },
            { color: 'text-yellow-500 dark:text-yellow-400', text: 'QLD(2배), QQQ(1배), VOO(1배)에 목돈을 넣을 계획이라면 — 분할보다 즉시 거치가 통계적으로 더 낫다. 두려워서 나눠 넣는 게 오히려 손해일 수 있다.' },
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
            운용비용(TQQQ 약 0.88%/년)·추적오차는 미반영. 변동성 끌림은 일별 복리 계산에 자동 반영된다.
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
