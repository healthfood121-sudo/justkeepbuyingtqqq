import Link from 'next/link'
import Header from '@/components/Header'
import { TaxSummary, TaxExample } from '@/components/WithdrawalTax'

function Tag({ children }: { children: string }) {
  return <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{children}</span>
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}
function Callout({ color, children }: { color: 'green' | 'yellow' | 'red' | 'blue'; children: React.ReactNode }) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    red:    'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200',
    green:  'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
  }
  return <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>{children}</div>
}

export default function WithdrawalTaxPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">← 목록으로</Link>
          <h1 className="text-3xl font-black leading-tight mb-4">꺼내 쓸 때 세금은 얼마나, 언제 내나 — 25% 룰과 양도세</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-07</span>
            {['인출식', '세금', '양도세', '25% 룰'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <P>
          사이트의 인출식 결과는 모든 매도에 양도세를 매긴 값이다. 생활비를 마련하려고 팔 때도, 25% 룰 신호로 전량 팔 때도 낸다.
          그 세금이 실제로 얼마였는지, 언제 몰려 나오는지를 백테스트에서 꺼내 봤다. 마지막에 세금을 다룰 때 알아 둘 점을 정리했다.
        </P>

        <Callout color="green">
          <strong>결론</strong><br />
          · <strong>세금은 25% 룰의 연 수익률을 2.1%p 깎는다</strong>(24.5% → 22.4%). 매매가 잦은 S0는 3.3%p, D10GK는 4.3%p 깎인다. 매매가 적은 것이 25% 룰의 숨은 장점이다.<br />
          · <strong>낸 세금 합계는 꺼내 쓴 생활비의 약 3분의 1이다.</strong><br />
          · <strong>세금은 몰려서 나온다.</strong> 25% 룰이 전량 판 해에는 그동안 쌓인 이익이 한꺼번에 실현된다. 2000년에 판 경우 다음 해 낸 세금이 그때 총자산의 26%였다.<br />
          · <strong>그래서 매도한 해의 세금 몫은 따로 남겨 둬야 한다.</strong> 신고·납부는 다음 해 5월인데, 그 전에 재매수 신호가 뜨면 세금 낼 돈까지 TQQQ를 사 버리기 쉽다.
        </Callout>

        <H2>전략별로 세금이 깎은 수익률</H2>
        <P>
          같은 계산을 세금만 0으로 바꿔 다시 돌린 것과 비교했다. 1971~2016년 매달 시작해 오늘까지 들고 간 548가지 경우의 중간값이다.
        </P>
        <TaxSummary />
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
          연 250만원 공제 후 22% · 같은 해 손실과 이익은 합쳐서 계산 · 계산에서는 다음 해 초에 현금에서 낸다(실제 신고·납부는 5월) ·
          TQQQ 계속 보유는 자산이 거의 0까지 빠진 뒤에 전년도 세금을 내는 경우가 있어 &lsquo;가장 큰 한 해 세금&rsquo;을 빼고 표시했다
        </p>

        <H2>세금이 몰리는 해 — 1990년 은퇴자의 예</H2>
        <P>
          <Link href="/posts/experience-1990" className="text-blue-600 dark:text-blue-400 underline">1990년 1월에 시작한 경우</Link>에서 세금이 컸던 해다.
          2000년에는 닷컴버블 꼭대기 근처에서 판 이익이 실현돼, 다음 해 그때 총자산의 4분의 1이 넘는 돈을 세금으로 냈다.
          2020년(코로나 매도)과 2022년(하락장 매도)에도 자산의 10% 넘게 나갔다. 평소 생활비 매도에서 나오는 세금은 이에 비하면 작다.
        </P>
        <TaxExample />

        <H2>세금을 다룰 때 알아 둘 것</H2>
        <ul className="space-y-3 mb-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed list-disc pl-5">
          <li><strong>세율과 공제</strong> — 해외 ETF를 팔아 생긴 이익은 1년 동안 합쳐서, 250만원을 뺀 나머지에 22%(지방세 포함). 다음 해 5월에 직접 신고하고 낸다.
            다른 소득과 합치지 않고 따로 매기므로 금융소득 종합과세(연 2천만원 넘는 이자·배당)와는 관계없다.</li>
          <li><strong>매도한 해의 세금 몫을 남겨 둔다</strong> — 25% 룰로 전량 판 해에는 그해 양도차익의 22%만큼을 현금으로 따로 둔다.
            다음 해 5월 전에 재매수 신호가 와도 그 돈은 TQQQ를 사지 않는다. 계산에서는 1월에 냈다고 보기 때문에, 이렇게 해야 결과와 같아진다.</li>
          <li><strong>같은 해의 손실은 이익을 줄여 준다</strong> — 재매수 직후 다시 팔아 손해를 본 매도는 같은 해 다른 이익과 합쳐져 세금을 줄인다. 따로 할 일은 없다.</li>
          <li><strong>250만원 공제는 작다</strong> — 아껴 주는 세금이 1년에 55만원이다. 공제를 쓰려고 매도 신호가 뜬 날을 미루면(예: 12월 신호를 1월로) 그 사이 하락에서 훨씬 더 잃을 수 있다. 규칙대로 판다.</li>
          <li><strong>환율도 이익에 들어간다</strong> — 양도차익은 산 날 환율로 바꾼 원화 매입가와 판 날 환율로 바꾼 원화 매도가의 차이로 계산한다.
            달러로는 본전이어도 그사이 원화가 약해졌으면 세금을 낸다.</li>
          <li><strong>가족에게 증여한 뒤 파는 방법</strong> — 배우자에게는 10년 동안 6억까지 증여세 없이 줄 수 있고, 받은 사람의 매입가는 증여받은 날 가격이 돼 쌓인 이익이 줄어든다.
            다만 증여받고 일정 기간 안에 팔면 이 효과를 없애는 규정이 있고, 이 규정은 최근에도 바뀌었다. 실행 전에 반드시 세무사에게 확인한다.</li>
        </ul>

        <Callout color="yellow">
          세법은 자주 바뀐다. 이 글의 세율·공제·규정은 2026년 10월 기준으로 정리한 것이고, 개인 상황(다른 소득, 건강보험, 증여 계획)에 따라 달라진다.
          큰 금액을 움직이기 전에는 세무 전문가에게 확인하자.
        </Callout>

        <P>
          시작 시점별 세금은 <Link href="/posts/withdrawal-tax/data" className="text-blue-600 dark:text-blue-400 underline">데이터 페이지</Link>에 있다.
        </P>
      </main>
    </div>
  )
}
