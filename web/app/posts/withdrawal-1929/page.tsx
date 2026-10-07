import Link from 'next/link'
import Header from '@/components/Header'
import { Path1929, Summary1929, Leverage1929 } from '@/components/Withdrawal1929'

function Tag({ children }: { children: string }) {
  return <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{children}</span>
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}
function Callout({ color, children }: { color: 'red' | 'yellow' | 'blue' | 'green'; children: React.ReactNode }) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    red:    'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200',
    green:  'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
  }
  return <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>{children}</div>
}

export default function Withdrawal1929Page() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">← 목록으로</Link>
          <h1 className="text-3xl font-black leading-tight mb-4">1929년 대공황 직전에 은퇴했다면 — 25% 룰도 막지 못한 하락</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-07</span>
            {['인출식', '25% 룰', '1929', '가상데이터', '검증'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <P>
          인출식 결과는 모두 1971년 이후 데이터다. 그 55년 동안 가장 나빴던 하락은 닷컴버블(나스닥100 −83%)이었다.
          그런데 미국 주식의 역사에는 그보다 나쁜 하락이 있다. 1929~1932년 대공황에서 S&amp;P500은 고점 대비 −86%까지 빠졌다.
          <Link href="/posts/synthetic-ndx-1929" className="text-blue-600 dark:text-blue-400 underline">적립식에서 1929년을 시험할 때 쓴 가상 나스닥100</Link>으로
          이번에는 인출식을 시험했다. 1929년부터 1970년까지 매달 10억으로 은퇴를 시작해, 25% 룰로 꺼내 쓰며 오늘까지 들고 갔다.
        </P>

        <Callout color="red">
          <strong>결론: 대공황 직전에 은퇴했다면 25% 룰로도 사실상 무너진다.</strong><br />
          · 1929년 9월에 10억으로 시작하면 자산이 <strong>776만원</strong>까지 줄었다(최근 베타 기준, 1971~1990 베타로는 2,200만원). 10억으로 돌아오기까지 26년이 걸렸다.<br />
          · 첫 10년 동안 월 생활비는 중간 36만원이었다. 생활비가 바닥나지는 않지만(매달 자산의 일정 비율) 생활이 무너지는 수준이다.<br />
          · 이유는 속도다. 지수가 매도선(−25%)에 닿기 전 몇 주 동안 TQQQ는 이미 고점 대비 −55%였고, 하루 −15%짜리 날에는 그날 하루에만 −44%가 빠졌다. 매도한 날 TQQQ는 고점 대비 −83%였다.<br />
          · 같은 경우 <strong>나스닥100(1배)을 그냥 들고 있었으면 최저 1억</strong>은 지켰다. <strong>TQQQ 비중을 늘 ⅔로 두면 최저 7,400만원</strong>으로, 평소 수익률은 연 22.4% → 18.5%가 된다.<br />
          · 권장 전략은 바꾸지 않는다. 대신 이 위험을 알고 고르도록 &lsquo;비중 낮추기&rsquo;의 비용과 효과를 아래에 정리했다.
        </Callout>

        <H2>어떻게 1929년을 만들었나</H2>
        <P>
          나스닥100은 1971년에 시작했다. 그 전은 S&amp;P500의 하루 수익률에 베타(나스닥100이 S&amp;P500보다 몇 배 크게 움직이는지)를 곱해 만들었다.
          베타를 어떻게 잡느냐에 따라 결과가 달라서 네 가지를 모두 돌렸다.
        </P>
        <ul className="space-y-1 mb-4 text-sm text-gray-600 dark:text-gray-300 list-disc pl-5">
          <li><strong>최근 베타</strong> — β 1.138 + 연 4.45% 초과수익 (2011~2026 실측). 적립식 1929 글의 기준이다.</li>
          <li><strong>1971~1990 베타</strong> — β 0.767. 나스닥이 기술주 중심이 아니던 시절 값. 덜 출렁인다.</li>
          <li><strong>최근 베타 · 초과수익 없음</strong> — β 1.138만. 초과수익을 빼 보수적으로.</li>
          <li><strong>가혹</strong> — β 1.5. 지금보다 더 크게 출렁이는 지수를 가정.</li>
        </ul>
        <P>
          계산 조건은 사이트의 대표 수치와 같다(스왑금리, 모든 매도 양도세, 현금 이자, 신호 다음 거래일 매매, 생활비 월 0.3~0.7%).
          기준금리 자료가 없는 1954년 이전은 미국 3개월 국채 금리의 연평균 근사값을 썼다.
        </P>

        <H2>1929년 9월에 시작했다면</H2>
        <P>
          선 위에 마우스를 올리면 그달의 총자산과 월 생활비가 나온다. 25% 룰(보라)은 1929년 10월 말에 팔았지만 이미 10억이 1.7억이 된 뒤였다.
          그 뒤 1930~1932년에 반등에서 다시 샀다가 또 팔기를 반복하며 더 줄었다. 나스닥100을 그냥 들고 있던 쪽(주황)은 1억 근처에서 버텼다.
        </P>
        <Path1929 />

        <H2>왜 25% 룰이 못 막았나 — 1929년 10월</H2>
        <P>
          최근 베타 기준 가상 나스닥100은 10월 24일까지 1년 최고 종가 대비 −21%였다. 아직 매도선(−25%) 위다.
          그런데 이때 TQQQ는 9월 3일 고점보다 이미 −55%였다. 3배 상품은 지수가 −21%일 때 이미 절반 넘게 빠진다.
          그리고 10월 28일 하루에 −14.7%가 왔다. TQQQ는 그날 하루 −44%(고점 대비 −74%). 이 종가로 매도 신호가 뜨고 다음 날 지수가 −11.5%(TQQQ 하루 −35%) 더 빠진 종가에 팔았을 때 TQQQ는 고점 대비 −83%였다.
        </P>
        <P>
          25% 룰은 &lsquo;천천히 빠지는 긴 하락&rsquo;에서 남은 돈을 지키는 규칙이다. 하루에 10%씩 빠지는 폭락에서는 신호가 뜨기 전에 3배 상품이 대부분 녹는다.
          1971년 이후 나스닥100이 하루 −10% 넘게 빠진 날은 1987년 10월(두 번), 2008년 9월, 2020년 3월뿐이었다.
          1929년에는 이런 날이 몇 주 사이에 몰려 왔고, 반등도 짧았다.
        </P>

        <H2>전략별로 보면</H2>
        <P>
          1929~1932년에 시작한 경우의 자산 최저점과, 1929~1970년에 시작한 504가지 전체의 인출 포함 연 수익률이다.
          모두 오늘까지 들고 갔으니 수십 년 뒤에는 회복한다. 그래서 수익률보다 최저점과 첫 10년 생활비가 중요하다.
        </P>
        <Summary1929 />
        <ul className="space-y-2 mb-6 mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed list-disc pl-5">
          <li><strong>TQQQ를 신호 없이 들고 가면</strong> 1929~1970년 시작 504가지 중 거의 전부가 처음 10억 아래로 끝난다. 1929년에 3배 상품을 그냥 들고 있으면 0이 된다.</li>
          <li><strong>S0와 D10GK는 25% 룰보다 더 나빴다.</strong> 평균선을 오르내리는 하락장에서 사고팔기를 더 자주 반복했다(1929년 9월 시작, 오늘까지 매매 횟수: 25% 룰 58번 · S0 100번 · D10GK 284번).</li>
          <li><strong>1929~1932년 시작 중간값으로 보면 25% 룰이 나스닥100 보유보다 첫 10년에 더 많이 꺼내 썼다</strong>(최근 베타 4.5억 vs 2.4억). 폭락 뒤에 시작한 경우는 현금으로 바닥을 피했기 때문이다. 문제는 폭락 직전에 시작한 경우다.</li>
        </ul>

        <H2>TQQQ 비중을 늘 낮춰 두면 — 보험료와 보험금</H2>
        <P>
          25% 룰 신호는 그대로 두고, TQQQ를 늘 일부만 들고 나머지를 현금(외화RP)으로 두는 방법을 계산했다.
          왼쪽 두 열은 실제 나스닥100(1971년~)에서 치르는 비용이고, 오른쪽 세 열은 대공황 직전 시작에서 지켜지는 자산이다.
        </P>
        <Leverage1929 />
        <P>
          TQQQ ⅔ + 현금 ⅓은 대략 2배 레버리지와 비슷하다. 평소에는 연 4%p를 덜 벌고, 대공황 직전 시작에서는 최저점이 776만원 → 7,400만원(1971~1990 베타로는 2,200만원 → 1억)이 된다.
          ½이면 1.6억, ⅓이면 3억이 남는다. 한 단계 낮출 때마다 평소 연 3%p 안팎을 내고 대공황에서 지키는 돈이 두 배쯤 된다.
        </P>

        <Callout color="yellow">
          <strong>이 결과를 어떻게 읽어야 하나</strong><br />
          · 1929년 같은 하락은 미국 주식 역사에서 한 번 있었다. 1971년 이후 55년 동안은 없었다. 앞으로 없다고 장담할 수도, 있다고 장담할 수도 없다.<br />
          · 1929년의 가상 나스닥100은 S&amp;P500으로 만든 추정이다. 실제로 그때 기술주 지수가 있었다면 어떻게 움직였을지는 아무도 모른다.<br />
          · 권장 전략을 바꾸는 기준(<Link href="/changelog" className="underline">변경 이력</Link>)에 따라 25% 룰은 그대로 둔다. 1929년에서는 S0·D10GK보다도 나았다.
          다만 &lsquo;대공황급 하락에서 생활을 지키는 것&rsquo;이 더 중요하다면 TQQQ 비중을 ⅔로 낮추는 것을 고려할 만하다.
          자산이 커진 뒤에만 비중을 낮추는 &lsquo;자산 커지면 현금&rsquo;은 10억에서 시작하는 이 경우를 막지 못한다(50억에 닿기 전에 무너진다).
        </Callout>

        <P>
          시작 시점별 결과는 <Link href="/posts/withdrawal-1929/data" className="text-blue-600 dark:text-blue-400 underline">데이터 페이지</Link>에서 볼 수 있다.
          생활비가 줄어드는 폭을 줄이는 다른 방법은 <Link href="/posts/living-stability" className="text-blue-600 dark:text-blue-400 underline">생활비 규칙·현금 버퍼 비교</Link>에 있다.
        </P>
      </main>
    </div>
  )
}
