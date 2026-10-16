import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '자산이 커져도 인출률을 올리지 말아야 하는 이유',
  description:
    '25% 룰은 자산이 20억을 넘으면 인출률이 0.7%까지 올라간다. 실제로 올리면 어떻게 되는지 1971년 이후 모든 진입 시점으로 확인했다. 결론은 예상과 반대였다.',
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}

function Callout({
  color = 'blue',
  children,
}: {
  color?: 'blue' | 'yellow' | 'red' | 'green'
  children: React.ReactNode
}) {
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

function Table({
  headers,
  rows,
  highlightRow,
  note,
}: {
  headers: string[]
  rows: (string | React.ReactNode)[][]
  highlightRow?: number
  note?: string
}) {
  return (
    <div className="mb-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`py-2 text-gray-500 dark:text-gray-400 font-medium ${i === 0 ? 'text-left pr-4' : 'text-right pr-4 last:pr-0'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={highlightRow === ri ? 'bg-green-50 dark:bg-green-500/5' : ''}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`py-2.5 ${ci === 0 ? 'pr-4' : 'text-right pr-4 last:pr-0'} ${highlightRow === ri ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{note}</p>}
    </div>
  )
}

export default function WithdrawalCapPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
              인출식
            </span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
              백테스트
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">
            자산이 커져도 인출률을 올리지 말아야 하는 이유
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-10-15</p>
        </div>

        <P>
          25% 룰은 자산 구간별로 인출률이 달라진다. 10억 미만이면 월 0.3%, 10~20억이면 0.5%, 20억을 넘으면
          0.7%를 꺼낸다. 100억이 되면 한 달에 7,000만 원을 꺼낼 수 있다.
        </P>

        <P>
          "자산이 충분히 커졌으니 써도 된다"가 직관적으로 맞아 보인다. 하지만 1971년 이후 모든 진입 시점으로
          확인하면 결론이 다르다. 자산이 커진다고 인출률을 올리면, 장기적으로 오히려 더 적게 쓰게 된다.
        </P>

        <H2>월 상한을 두면 어떻게 되나</H2>

        <P>
          인출 상한을 낮게 고정하면 수익률이 올라간다. 꺼내지 않은 돈이 포트폴리오 안에 현금으로 남았다가
          매수 신호 때 다시 TQQQ로 투자되기 때문이다. 그런데 수익률이 올라간 만큼 실제로 쓰는 돈은 줄어든다.
        </P>

        <Table
          headers={['월 상한', '연평균 수익률', '최종 자산', '평생 소비']}
          rows={[
            ['없음', '21.9%', '778억', '368억'],
            ['5,000만원', '21.9%', '2,114억', '148억'],
            ['3,000만원', '22.4%', '3,709억', '106억'],
            ['1,500만원', '22.9%', '8,103억', '56억'],
            ['750만원', '23.1%', '11,251억', '29억'],
            ['300만원', '23.6%', '12,736억', '12억'],
          ]}
          note="25% 룰 전략 · 초기 10억 · 스왑금리·양도세·현금 이자 포함 · 1971~2026년 538개 진입 시점 중앙값"
        />

        <div className="mb-8" />

        <P>
          1,500만원 상한을 두면 연평균 수익률이 22.9%로 오르고 최종 자산은 8,103억이 된다.
          하지만 평생 꺼내 쓴 돈은 56억으로 상한 없는 경우(368억)의 15% 수준이다. 수익률과 자산은 커지지만,
          정작 생전에 쓰는 돈은 대폭 줄어든다. 상속이나 장기 자산이 목적이라면 맞는 방향이지만,
          은퇴 후 생활이 목적이라면 맞지 않다.
        </P>

        <Callout color="yellow">
          상한을 낮추면 수익률은 올라가지만 실제 소비는 줄어든다.
          상한 없이 쓰면 소비는 많지만 수익률이 낮다. 어느 쪽이 더 낫다고 단순히 말하기 어렵다.
        </Callout>

        <H2>더 흥미로운 발견</H2>

        <P>
          고정 상한이 아니라, 자산에 비례한 상한을 쓰면 어떻게 될까. "자산이 얼마든 인출률을
          0.3%로 고정한다"는 방식이다. 즉, 10~20억 구간에서도, 20억을 넘어서도 계속 0.3%만 꺼낸다.
        </P>

        <Table
          headers={['방식', '연평균 수익률', '최종 자산', '평생 소비']}
          rows={[
            ['상한 없음 (0.3~0.7% 티어)', '21.9%', '778억', '368억'],
            ['인출률 0.3% 고정', '23.0%', '5,226억', '574억'],
          ]}
          highlightRow={1}
          note="25% 룰 전략 · 초기 10억 · 1971~2026년 538개 진입 시점 중앙값"
        />

        <div className="mb-8" />

        <P>
          인출률을 0.3%로 고정하면 평생 소비가 574억으로,
          상한 없이 0.7%까지 쓴 경우(368억)보다 56% 더 많다. 덜 꺼내는 쪽이 장기적으로 더 많이 쓸 수 있다.
        </P>

        <H2>왜 이런 결과가 나오나</H2>

        <P>
          자산이 100억일 때 인출률 0.7%를 쓰면 한 달에 7,000만 원을 꺼낸다. 인출률 0.3%를 유지하면
          3,000만 원만 꺼낸다. 차이인 4,000만 원이 포트폴리오 안에 그대로 남는다.
        </P>

        <P>
          이 4,000만 원이 TQQQ에 재투자되면, 연평균 20%대로 복리가 붙는다. 10년 후에는 이 차이가
          수십 배로 불어난 상태다. 그때의 포트폴리오에서 0.3%를 꺼내면,
          과거에 0.7%를 꺼냈을 때보다 금액이 더 크다.
        </P>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
          <div className="font-semibold text-gray-900 dark:text-white mb-2">구체적 예시</div>
          자산 100억, 인출률 0.7%: 월 7,000만 원 꺼냄. 포트 잔여 복리 성장.<br />
          자산 100억, 인출률 0.3%: 월 3,000만 원 꺼냄. 4,000만 원이 포트에 잔류.<br />
          <span className="block mt-2">
            20년 후 — 0.7% 방식: 자산이 덜 불어난 포트에서 0.7% 꺼낸다.<br />
            0.3% 방식: 훨씬 크게 불어난 포트에서 0.3%를 꺼내도 금액이 더 많다.
          </span>
        </div>

        <P>
          핵심은 TQQQ의 복리 속도에 있다. 연평균 20%대로 불어나는 자산에서 매달 조금씩 더 꺼내는 것보다,
          그 차이를 TQQQ에 놓아 두는 쪽이 장기적으로 훨씬 이득이다.
          인출로 빠져나간 돈은 복리가 붙지 않는다. 포트폴리오 안에 남아야 복리가 붙는다.
        </P>

        <Callout color="green">
          25% 룰에서 자산이 커진다고 인출률을 0.5%, 0.7%로 올리면,
          그만큼 TQQQ 복리의 씨앗을 덜어내는 것이다. 올리지 않고 복리를 유지하면 나중에 더 큰 자산에서 더 많이 꺼낼 수 있다.
        </Callout>

        <H2>그럼 어떻게 하면 좋은가</H2>

        <P>
          목적에 따라 두 가지 방향이 있다.
        </P>

        <ul className="space-y-3 mb-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed list-disc pl-5">
          <li>
            <strong>생전 소비를 최대화하려면</strong> — 자산이 커져도 인출률을 0.3%로 고정한다.
            자산이 10억이든 100억이든 매달 0.3%만 꺼낸다. 1971년 이후 전체 기간 중앙값으로
            평생 소비 574억이다. 25% 룰 전략 중 가장 많이 쓸 수 있는 방법이다.
          </li>
          <li>
            <strong>자산을 남기는 것도 중요하다면</strong> — 월 상한 1,500만 원을 둔다.
            인출률 0.3%로 고정하되, 포트폴리오 안의 현금도 재투자한다. 최종 자산 8,103억,
            평생 소비 56억. 생전에 쓰는 돈은 훨씬 적지만 물려줄 자산이 크게 남는다.
          </li>
        </ul>

        <Callout color="blue">
          <strong>주의할 점</strong><br />
          이 수치는 1971~2026년 538개 진입 시점의 중앙값이다.
          실제 겪는 결과는 이보다 크게 다를 수 있다. 특히 &lsquo;평생 소비&rsquo;는 시뮬레이션 전체 기간(최장 55년)의 합산이다.
          20~30년 시점에서 비교하면 격차가 다르게 나온다.
          원리를 참고할 뿐, 개별 상황에 맞게 판단해야 한다.
        </Callout>

        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <Link
            href="/posts/withdrawal-guide"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                인출식 방법론
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                25% 룰 전략 전체 설명
              </div>
            </div>
          </Link>
          <Link
            href="/posts/living-stability"
            className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-5 py-3.5 transition-colors group"
          >
            <span className="text-blue-400 dark:text-blue-500 text-sm mt-0.5 shrink-0">→</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                생활비가 반토막 나는 걸 막을 수 있나
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                생활비 변동 줄이는 방법들
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
