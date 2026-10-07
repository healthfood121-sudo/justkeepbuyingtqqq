import Link from 'next/link'
import Header from '@/components/Header'
import {
  SensitivityGrid, SensitivityChart, SensitivityEras, SensitivityEpisodes, SensitivityWindow, SensitivitySp500,
} from '@/components/RuleSensitivity'

function Tag({ children }: { children: string }) {
  return <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{children}</span>
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}

function Callout({ color = 'blue', children }: { color?: 'blue' | 'yellow' | 'green' | 'purple'; children: React.ReactNode }) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    green:  'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
    purple: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-200',
  }
  return <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>{children}</div>
}

export default function Rule25SensitivityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">
            ← 목록으로
          </Link>
          <h1 className="text-3xl font-black leading-tight mb-4">
            25% 룰, 왜 하필 25%인가 — 기준값을 바꿔 가며 151가지로 다시 돌렸다
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-07</span>
            {['인출식', '25% 룰', '검증', 'S&P500', '백테스트'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <P>
          권장 전략인 <Link href="/posts/withdrawal-guide#recommended" className="text-blue-600 dark:text-blue-400 underline">25% 룰</Link>에는
          숫자가 셋 있다. 1년 최고 종가보다 <strong>25%</strong> 빠지면 팔고, 200일 평균선 위로 <strong>15일</strong> 연속이면 다시 사고,
          최고 종가는 최근 <strong>1년</strong>에서 찾는다. 과거 데이터로 규칙을 고르면, 그 숫자에서만 우연히 잘 나온 규칙을 고르기 쉽다.
          24%나 26%에서 결과가 확 나빠진다면 25%는 운이 좋았던 숫자일 뿐이다. 그래서 숫자를 하나씩 바꿔 가며 전부 다시 돌렸다.
        </P>

        <Callout color="green">
          <strong>결론: 25%는 운 좋은 한 점이 아니다. 다만 이 규칙의 성적은 몇 번의 하락에 기대고 있다.</strong><br />
          · <strong>23~33% 어디를 골라도 결과가 비슷하다</strong> — 인출 포함 연 수익률 중간 22.4~24.0%, 하위 10% 16.0~17.6%. 25%는 이 넓은 구간 안에 있다.<br />
          · <strong>22% 이하로 낮추면 확 나빠진다.</strong> 1998년 두 번, 2018년, 2025년의 하락이 −22~−23%에서 멈추고 곧바로 반등했는데, 기준이 22% 이하면 그 바닥에서 팔게 된다.<br />
          · <strong>나스닥100만 보면 30%가 조금 더 낫지만, S&amp;P500에서는 27.5% 이상부터 원금(10억) 아래로 끝나는 경우가 생긴다.</strong> 두 시장 모두에서 괜찮은 건 20~25%다.<br />
          · <strong>재매수 15일, 최고 종가 1년도 그대로 둔다.</strong> 10~30일, 6개월~1년 사이에서는 결과가 비슷했다.
        </Callout>

        <H2>매도 기준 × 재매수 연속일, 130가지</H2>
        <P>
          매도 기준을 15%부터 40%까지 1%씩, 재매수 연속일을 5·10·15·20·30일로 바꿔 130가지를 만들고,
          1971년부터 매달 시작한 모든 경우를 오늘까지 들고 갔다. 계산 조건은 사이트의 대표 수치와 같다
          (스왑금리, 모든 매도에 양도세, 현금 이자, 신호 다음 거래일 매매, 매달 총자산의 0.3~0.7% 생활비).
          표의 숫자는 548가지 시작 시점의 인출 포함 연 수익률 중간값이다.
        </P>
        <SensitivityGrid />

        <H2>재매수 15일로 고정하고 매도 기준만 바꾸면</H2>
        <P>
          선이 평평한 곳이 좋은 기준값이다. 조금 바꿔도 결과가 그대로라는 뜻이기 때문이다.
          보라색으로 칠한 23~33% 구간이 그렇다. 반대로 22%와 23% 사이에는 계단이 있다.
          기준값이 계단 바로 위에 있으면 위험하다. 25%는 계단에서 2%p 떨어져 있다.
        </P>
        <SensitivityChart />

        <H2>계단은 어디서 생겼나 — 하락이 멈춘 자리</H2>
        <P>
          1971년 이후 나스닥100이 1년 최고 종가보다 15% 넘게 빠진 하락을 전부 모았다. 노란 줄이 20~25%에서 멈춘 하락이다.
          1998년 8월(−22.2%)과 10월(−23.0%), 2018년 12월(−23.0%), 2025년 4월(−22.9%)은 모두 −22~−23%에서 바닥을 찍었다.
          기준이 22% 이하면 이 바닥에서 판다. 1998년에는 바닥 1년 뒤 나스닥100이 두 배가 넘게 올라 있었다.
        </P>
        <SensitivityEpisodes />
        <P>
          시작 시기별로 나눠 보면 더 분명하다. 22%와 23%의 차이는 1990~2002년에 시작한 경우에서 가장 크게 나온다(26.1% → 40.1%, 다른 시기는 2~6%p).
          1998년 하락에서 팔았느냐 안 팔았느냐가 그 뒤 닷컴버블 상승을 탔느냐로 이어졌기 때문이다.
        </P>
        <SensitivityEras />

        <Callout color="yellow">
          <strong>이것이 25% 룰의 약점이기도 하다.</strong><br />
          25%가 22%보다 나은 이유는 &lsquo;과거의 빠른 하락들이 공교롭게 −23% 근처에서 멈췄기 때문&rsquo;이다.
          다음 빠른 하락이 −26%에서 멈추면 25% 룰은 그 바닥에서 팔고, 15일 뒤에야 다시 산다.
          실제로 2020년 3월(−28%)이 그랬다. 25% 룰의 성적은 &lsquo;하락이 기준선 근처에서 몇 번 멈췄나&rsquo;에 기대고 있고, 그런 하락은 55년에 몇 번뿐이다.
          그래도 23~33% 전체가 비슷한 결과라는 점, 그리고 기준을 바꿔도 S0(17.5%)보다 낮아지는 곳이 거의 없다는 점이 안심할 근거다.
        </Callout>

        <H2>30%가 더 높은데 왜 25%인가 — S&amp;P500으로 확인</H2>
        <P>
          나스닥100만 보면 29~30%가 25%보다 연 1%p 남짓 높다. 그러나 이 규칙을 나스닥100 데이터로 골랐으니, 나스닥100으로 다시 확인하면 당연히 좋게 나온다.
          그래서 규칙을 고를 때 쓰지 않은 S&amp;P500으로 같은 규칙을 돌렸다. S&amp;P500 3배 합성 가격에, 기준금리 자료가 있는 1955년부터 시작한 경우다
          (1955~1970년은 나스닥100 데이터에 아예 없는 기간이다).
        </P>
        <SensitivitySp500 />
        <P>
          S&amp;P500에서는 20~25%가 가장 좋았고, 27.5%부터는 남은 자산이 처음 10억보다 적게 끝나는 경우가 생긴다(30%는 200가지 가까이).
          S&amp;P500은 나스닥100보다 덜 빠지는 대신, 30% 넘게 빠질 때는 길게 빠졌다. 그런 하락에서 기준이 너무 깊으면 늦게 판다.
          두 시장 모두에서 무난한 숫자는 25%다. 그래서 30%로 바꾸지 않는다.
        </P>
        <P>
          단, S&amp;P500에서 25% 룰이 S0보다 나은 건 중간값뿐이다. 하위 10%는 S0가 낫다(4.1% vs 2.6%). 나스닥100만큼 뚜렷한 우위는 아니다.
        </P>

        <H2>최고 종가를 보는 기간</H2>
        <P>
          &lsquo;1년 최고 종가&rsquo;의 1년을 6개월이나 2년으로 바꿔도 봤다. 6개월은 거의 같고, 2년은 조금 나쁘다.
          2년이면 오래전 고점이 기준으로 남아, 이미 한참 내려온 뒤에도 매도 신호가 나기 때문이다.
        </P>
        <SensitivityWindow />

        <H2>재매수 연속일</H2>
        <P>
          25%에서 재매수 연속일을 바꾸면 10·15·20·30일이 22.1~23.5%로 비슷하다. 5일은 26.3%로 더 높지만,
          표에서 5일 열은 매도 기준에 따라 20.8~28.1%로 크게 출렁인다. 빨리 다시 사는 만큼 하락장 중간 반등에 자주 걸린다는 뜻이다.
          출렁임이 적은 15일을 그대로 둔다.
        </P>

        <H2>정리</H2>
        <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed list-disc pl-5">
          <li>25% 룰은 25에서만 잘 되는 규칙이 아니다. 23~33%가 모두 비슷하다.</li>
          <li>22% 이하는 피한다. 과거의 빠른 하락 네 번이 −22~−23%에서 멈췄다.</li>
          <li>30%는 나스닥100에서 조금 더 높지만, 최적화에 쓰지 않은 S&amp;P500에서 무너진다. 25%를 유지한다.</li>
          <li>규칙의 성적이 몇 번의 하락에 기대고 있다는 점은 그대로 남는다. 앞으로 하락이 −25% 바로 아래에서 자주 멈추면 성적이 지금보다 나빠질 수 있다.</li>
        </ul>

        <P>
          설정값마다 시작 시점별 결과는 <Link href="/posts/rule25-sensitivity/data" className="text-blue-600 dark:text-blue-400 underline">데이터 페이지</Link>에서 볼 수 있다.
          전략 전체 비교는 <Link href="/posts/withdrawal-full-period" className="text-blue-600 dark:text-blue-400 underline">모든 인출 전략 전체 기간 비교</Link>에 있다.
        </P>
      </main>
    </div>
  )
}
