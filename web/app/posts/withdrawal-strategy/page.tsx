import Link from 'next/link'
import Header from '@/components/Header'

function DataLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
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

function Table({ headers, rows }: { headers: string[]; rows: (string | number | React.ReactNode)[][] }) {
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
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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

export default function WithdrawalStrategyPost() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* 글 헤더 */}
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">
            ← 목록으로
          </Link>
          <h1 className="text-3xl font-black leading-tight mb-4">
            인출 전략 설계기: 버블 케이스 재진입 방법 비교 (A vs B)
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-01 · 최종수정 2026-10-03</span>
            {['인출', '백테스트', 'TQQQ', '닷컴버블'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <Callout color="yellow">
          <strong>2026-10-03 재계산: 적립 구간을 지금의 C전략(거치금 5년 분할)으로 바꿨다.</strong>{' '}
          이 글은 처음에 거치금 2.5억을 첫날 한 번에 넣는 방식으로 계산했다. 5년에 나눠 넣는 방식으로 다시 계산하면
          1.5년 안에 10억에 닿는 &lsquo;버블 케이스&rsquo;가 <strong>112건 → 2건</strong>(1998년 9·10월 시작)으로 거의 사라지고,
          Method A와 B의 결과 차이도 거의 없어진다. 아래 결과 표는 새 계산(운용보수·스왑금리 반영)이고,
          1996~1999년 예시 표는 처음 설계 당시(즉시 거치) 기록으로 남겨둔다. 이 방법론은 이후 25% 룰 전략으로 대체됐다.
        </Callout>

        {/* 본문 */}
        <P>
          10억 목표를 달성하고 인출 단계로 넘어가는 로직을 설계하다가,
          예상치 못한 엣지 케이스를 발견했습니다.
          너무 <strong className="text-gray-900 dark:text-white">빠르게 목표를 달성한 경우</strong>가
          오히려 가장 위험한 상황에 빠질 수 있다는 것입니다.
        </P>

        <H2>버블 케이스란?</H2>
        <P>
          인출 전략의 핵심 아이디어는 &ldquo;적립에 오래 걸렸으면 그만큼 험한 시장을 겪은 것이고,
          인출 초기에도 어려울 수 있으니 현금 버퍼를 두자&rdquo;입니다.
          공식으로 표현하면:
        </P>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-4 mb-6 font-mono text-sm text-blue-600 dark:text-blue-300">
          buffer_years = max(0, 최장기간 − 소요기간)<br />
          buffer_amount = buffer_years × 일적립액 × 252
        </div>
        <P>
          처음 설계 당시(거치금 즉시 투입) NDX 3x 실측 최장 소요기간은 <strong className="text-gray-900 dark:text-white">12.24년</strong>
          (1999~2001 닷컴버블 진입 시점)이라 기준값(BUFFER_REF_YEARS)을 13으로 설정했습니다.
          지금의 C전략(거치금 5년 분할)은 운용보수·스왑금리 반영 시 최장 <strong className="text-gray-900 dark:text-white">8.99년</strong>이라,
          재계산에서는 같은 정의로 기준값을 <strong className="text-gray-900 dark:text-white">9</strong>로 두었습니다.
        </P>
        <P>
          그런데 소요기간이 1.5년 미만인 &ldquo;버블 케이스&rdquo;는 다르게 처리합니다.
          버퍼를 현금으로 쌓는 게 아니라, <strong className="text-gray-900 dark:text-white">전량 매도 후 대기</strong>합니다.
          1.5년 안에 10억을 달성했다는 건 시장이 비정상적으로 빠르게 올랐다는 신호이기 때문입니다.
        </P>

        <H2>문제 발견: 1996년 10월 진입 (처음 설계 당시)</H2>
        <P>
          전체 경우를 돌려보니, 최솟값이 가장 낮은 케이스가 예상 밖의 시점에서 나왔습니다.
        </P>
        <Callout color="yellow">
          <strong>1996년 10월 진입</strong><br />
          소요기간 1.498년 → 버블 케이스 판정 → 1998-04에 전량 매도<br />
          2년 대기 → <strong>2000-04 재진입 = 닷컴버블 정점</strong><br />
          이후 TQQQ −99.9% → 포트폴리오 천만원까지 추락
        </Callout>

        <P>
          1998년 4월에 매도한 건 나쁜 판단이 아닙니다. TQQQ 합성가격이 이미 3.5배 올라있었으니까요.
          문제는 <strong className="text-gray-900 dark:text-white">기계적인 2년 타이머</strong>가 정확히 닷컴버블 최고점을 겨냥해버린 것입니다.
        </P>

        <Table
          headers={['날짜', 'SP500 (1996-10=100)', 'TQQQ 합성 (1996-10=100)', '비고']}
          rows={[
            ['1996-10', '100', '100', '적립 시작'],
            ['1998-04', '161', '348', '10억 달성, 전량 매도'],
            ['1999-12', '213', '5,172', '대기 중 (보유 현금: 10억)'],
            ['2000-04', '217', '7,218', '재진입 ← 최고점'],
            ['2002-10', '123', '7', 'TQQQ −99.9%'],
            ['2003-03', '122', '9', '바닥권'],
          ]}
        />

        <P>
          재진입 후 TQQQ 7,218에서 7로 추락. 명목 10억이 1천만원이 됩니다.
          물론 SP500 −20% 구간마다 일 20만원씩 1년간 매수(RESCUE_1Y)를 통해
          바닥에서 주식을 쌓았고, 40년 후에는 96억으로 회복되었습니다.
          하지만 중간에 잔고가 천만원까지 떨어지는 건 실제로 견디기 어렵습니다.
        </P>

        <H2>두 가지 개선안 비교</H2>
        <P>
          &ldquo;2년 대기 후 lump-sum 재진입&rdquo;의 문제는 시장 상황을 전혀 고려하지 않는다는 점입니다.
          이를 해결하기 위해 두 가지 방법을 비교했습니다.
        </P>

        <H3>Method A: 2년 대기 후 DCA 재진입</H3>
        <P>
          기존처럼 2년을 기다리되, 재진입할 때 한 번에 다 사지 않고
          buffer_years(11.5년) 동안 매일 균등 분산 매수합니다.
          1998-04에 팔면 → 2000-04부터 분산 매수 시작 → 2011년까지 지속.
        </P>

        <H3>Method B: 즉시 DCA 재진입</H3>
        <P>
          대기 없이 바로 buffer_years 동안 분산 매수를 시작합니다.
          1998-04에 팔면 → 즉시 분산 매수 시작 → 2009년까지 지속.
        </P>

        <H2>백테스트 결과</H2>

        <Callout color="green">
          두 방법 모두 626가지 경우(운용보수·스왑금리 반영) 100% 생존 — 운용보수만 반영해도 628가지 모두 생존
        </Callout>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">전략별 결과 요약</span>
          <DataLink href="/posts/withdrawal-strategy/data" />
        </div>
        <Table
          headers={['지표 (재계산 · 운용보수+스왑금리)', 'Method A (2년 대기+DCA)', 'Method B (즉시 DCA)']}
          rows={[
            ['생존율', '626/626가지 경우 = 100%', '626/626가지 경우 = 100%'],
            ['평균 최종값', '93.5억 (운용보수만 188억)', '93.6억 (운용보수만 188억)'],
            ['평균 인출 총액', '89.2억 (운용보수만 534억)', '89.2억 (운용보수만 534억)'],
            ['버블 케이스', '2가지 · 평균 최종 135억', '2가지 · 평균 최종 137억'],
          ]}
        />

        <P>
          5년 분할로 바꾼 뒤에는 버블 케이스가 2가지뿐이라 두 방법의 차이가 거의 없습니다.
          아래는 처음 설계 당시(거치금 즉시 투입, 버블 케이스 112가지) 세부 기록입니다.
          데이터 페이지에는 재계산 결과만 있어 이 예시들은 나오지 않습니다.
        </P>

        <H3>1996–1997년 진입 (닷컴버블 직전 · 처음 설계 당시)</H3>
        <Table
          headers={['시작', '소요기간', 'Method A 최종', 'Method B 최종']}
          rows={[
            ['1996-01', '1.39년', '245억', '99억'],
            ['1996-07', '1.09년', '244억', '99억'],
            ['1996-10', '1.50년', '245억', '97억'],
            ['1997-05', '1.20년', '237억', '96억'],
          ]}
        />
        <P>
          Method A가 압도적으로 유리합니다. 이유는 반직관적입니다:
          2년을 기다리면 DCA 시작 시점이 닷컴버블 정점(2000년) 근처가 됩니다.
          하지만 이 시점부터 <strong className="text-gray-900 dark:text-white">닷컴버블 전체 붕괴 구간(TQQQ 7,218→7)</strong>에
          걸쳐 10억 전액을 분산 투입하기 때문에,
          바닥권에서 엄청난 양의 주식을 저렴하게 쌓을 수 있습니다.
        </P>
        <P>
          반면 Method B는 1998년부터 즉시 분산 매수를 시작하므로,
          아직 비싼 1998~2000년 구간에 예산의 25% 가량을 사용하고,
          정작 중요한 바닥 구간에서 쓸 수 있는 예산이 줄어듭니다.
        </P>

        <H3>1998–1999년 진입 (닷컴버블 중반 · 처음 설계 당시)</H3>
        <Table
          headers={['시작', '소요기간', 'Method A 최종', 'Method B 최종']}
          rows={[
            ['1998-09', '0.36년', '244.7억', '245.6억'],
            ['1999-03', '0.79년', '245.3억', '246.9억'],
            ['1999-08', '0.41년', '241.0억', '243.1억'],
          ]}
        />
        <P>
          이 구간은 Method B가 소폭 우세합니다. 즉시 매수 시작 시점이
          이미 버블 정점에 가까워 2년 기다림의 메리트가 없고,
          오히려 더 빨리 시작하는 것이 유리합니다.
        </P>

        <H2>결론과 현재 설계 방향</H2>
        <Callout color="blue">
          <strong>처음 설계 당시: 전체 112개 버블 케이스 중 Method B가 80개, A가 32개에서 우세.</strong><br />
          최악의 시나리오(닷컴 직전 진입)에서는 A가 압도적으로 안전했습니다.<br />
          <strong>재계산 후:</strong> 거치금을 5년에 나눠 넣으면 버블 케이스 자체가 2가지로 줄어 이 규칙의 영향은 거의 없습니다.
          인출 방법론은 이후 <Link href="/posts/withdrawal-guide" className="underline">25% 룰 전략</Link>으로 바뀌었습니다.
        </Callout>

        <P>
          핵심 교훈은 다음과 같습니다:
        </P>
        <ul className="list-none space-y-3 mb-8">
          {[
            '버블 케이스 판단 기준(1.5년)은 시장 상태가 아닌 소요기간으로 결정되기 때문에 불완전합니다.',
            '고점 lump-sum 재진입보다 DCA가 훨씬 안전하지만, "언제부터 DCA를 시작하느냐"가 결과를 크게 바꿉니다.',
            '2년 대기는 단순해 보이지만, 결과적으로 닷컴버블 직전에 진입한 경우에 전체 붕괴 구간을 DCA로 매수하는 기회를 줍니다.',
            'SP500 기준 -20% / -50% 트리거는 TQQQ 포트폴리오 기준보다 훨씬 안정적인 신호를 제공합니다.',
          ].map((item, i) => (
            <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300 text-sm">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <P>
          아직 확정되지 않은 부분이 많습니다. 버블 케이스 threshold를 1.5년으로 유지할지,
          시장 조건 기반으로 바꿀지, 두 method 중 하나를 선택할지 계속 테스트 중입니다.
        </P>

        {/* 구분선 */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-16 pt-8 flex items-center justify-between text-sm text-gray-400">
          <Link href="/posts" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">← 글 목록</Link>
          <Link href="/simulator" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">시뮬레이터에서 직접 돌려보기 →</Link>
        </div>
      </main>
    </div>
  )
}
