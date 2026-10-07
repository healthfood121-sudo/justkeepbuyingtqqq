import Link from 'next/link'
import Header from '@/components/Header'
import LivingStability from '@/components/LivingStability'

function Tag({ children }: { children: string }) {
  return <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{children}</span>
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}
function Callout({ color, children }: { color: 'green' | 'yellow' | 'blue'; children: React.ReactNode }) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    green:  'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
  }
  return <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>{children}</div>
}

export default function LivingStabilityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">← 목록으로</Link>
          <h1 className="text-3xl font-black leading-tight mb-4">생활비가 반토막 나는 걸 막을 수 있나 — 생활비 규칙과 현금 버퍼 비교</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-07</span>
            {['인출식', '25% 룰', '생활비', '현금 버퍼'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <P>
          25% 룰은 매달 그때 자산의 0.3~0.7%를 꺼내 쓴다. 자산이 바닥나지 않는 대신, 자산이 반토막 나면 생활비도 반토막이 난다.
          <Link href="/posts/withdrawal-guide" className="text-blue-600 dark:text-blue-400 underline">인출식 방법론</Link>에서 &lsquo;감수해야 할 것&rsquo;으로 적은 부분이다.
          실제로 은퇴한 사람에게는 수익률보다 이게 더 견디기 어렵다. 생활비를 정하는 규칙과 현금을 미리 떼어 두는 방법으로 이걸 줄일 수 있는지 1971년 이후 모든 시작 시점으로 비교했다.
        </P>

        <Callout color="green">
          <strong>결론</strong><br />
          · <strong>생활비를 1년에 한 번만 정하면 거의 공짜로 덜 흔들린다.</strong> 연 수익률은 22.4%로 같고, 생활비가 최고의 절반 아래로 떨어진 달이 59% → 41%로 준다.<br />
          · <strong>&lsquo;생활비를 일정 수준 아래로는 안 내린다&rsquo;는 하한은 역효과다.</strong> 하락장에서 생활비를 지키려고 더 팔아, 20년 뒤 생활비가 오히려 크게 줄었다(하위 10% 588만 → 237만원).<br />
          · <strong>처음부터 현금을 20~30% 떼어 두면 자산 최저점이 3.0억 → 4.0~4.8억으로 올라간다.</strong> 대신 연 수익률이 2~3%p 낮아진다.<br />
          · 어떤 방법도 생활비가 줄어드는 시기를 없애지는 못한다. 줄어드는 폭과 횟수를 줄일 뿐이다.
        </Callout>

        <H2>여섯 가지 방식 비교</H2>
        <P>
          모두 25% 룰 신호를 그대로 쓰고, 처음 10억으로 1971~2016년 매달 시작해 오늘까지 들고 간 548가지 경우다.
          생활비 열의 &lsquo;하위 10%&rsquo;는 운이 나빴던 쪽에서 10번째 경우의 월 생활비다. 시작할 때 월 생활비는 500만원이다(10억 × 0.5%).
        </P>
        <LivingStability />
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
          스왑금리·모든 매도 양도세·현금 이자(세후) 반영 · 신호 다음 거래일 매매 · 생활비는 물가 상승을 빼지 않은 금액 ·
          &lsquo;최고의 절반 아래였던 달&rsquo; = 그때까지 가장 많이 받던 생활비의 절반보다 적게 받은 달의 비율(시작 시점들의 중간값)
        </p>

        <H2>왜 생활비가 그렇게 자주 반토막 아래인가</H2>
        <P>
          25% 룰은 오래 들고 가면 자산이 수십~수백 배로 커지는 경우가 많다. 그러면 생활비 최고치도 그만큼 높아지고,
          그 뒤 한 번 큰 하락이 오면 최고치의 절반 아래로 내려간다. 59%라는 숫자는 &lsquo;가난해졌다&rsquo;보다 &lsquo;한때 너무 많이 받았다&rsquo;에 가깝다.
          그래서 생활비 하위 10%의 실제 금액(10년 뒤 월 191만원, 20년 뒤 월 588만원)을 같이 봐야 한다.
          시작 생활비 500만원보다 낮은 191만원은 실제로 줄어든 것이다.
        </P>

        <H2>방법별로 보면</H2>
        <ul className="space-y-3 mb-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed list-disc pl-5">
          <li><strong>생활비 1년 고정</strong> — 매년 같은 달에 그때 자산 × 비율로 1년치 월 생활비를 정하고, 1년 동안 바꾸지 않는다(한 달에 자산의 1%를 넘지 않게).
            몇 달짜리 급락에는 생활비가 따라 내려가지 않는다. 수익률 손해가 없어 누구나 써 볼 만하다.</li>
          <li><strong>생활비 하한</strong> — 직전 12개월 최고 생활비의 75% 아래로는 안 내린다. 긴 하락장에서 자산이 줄어도 같은 돈을 꺼내니,
            결국 자산이 더 깊게 줄고(최저점 하위 10% 2.1억) 나중에는 생활비가 더 크게 깎인다. 쓰지 말 것.</li>
          <li><strong>자산 커지면 현금</strong> — 50억이 넘으면 TQQQ를 ⅔로, 200억이 넘으면 ⅓로 줄인다. 크게 불어난 뒤의 낙폭(−96% → −80%)과 생활비 반토막 달(59% → 28%)이 크게 준다.
            그러나 50억에 닿기 전에 오는 하락은 막지 못해, 최저점 하위 10%는 그대로 3.0억이다.</li>
          <li><strong>기본 현금 20~30% + 1년 점검</strong> — 처음부터 현금을 떼어 두고, 생활비와 비중을 1년에 한 번만 맞춘다(오를 때만 현금으로 옮김).
            초반 폭락까지 줄여 최저점이 4.0~4.8억으로 올라간다. 연 수익률은 20.3~19.1%.</li>
        </ul>

        <Callout color="yellow">
          <strong>대공황 같은 하락은 이걸로도 못 막는다.</strong>{' '}
          1929년 같은 폭락은 하루 −10%대가 연달아 와서 25% 룰이 팔기 전에 TQQQ가 대부분 녹는다.
          <Link href="/posts/withdrawal-1929" className="underline">1929년 대공황 인출 시나리오</Link>에서 TQQQ 비중을 늘 낮춰 두는 방법의 비용과 효과를 따로 계산했다.
        </Callout>

        <H2>정리</H2>
        <P>
          권장 전략은 그대로 두되, 생활비는 1년에 한 번 정하는 쪽을 권한다. 비용이 없고 덜 흔들린다.
          자산 최저점을 더 지키고 싶다면 기본 현금 20%를 떼어 두는 방법이 있고, 그 대가는 연 2%p 남짓이다.
          시작 시점별 결과는 <Link href="/posts/living-stability/data" className="text-blue-600 dark:text-blue-400 underline">데이터 페이지</Link>에 있다.
        </P>
      </main>
    </div>
  )
}
