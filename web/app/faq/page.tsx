import Header from '@/components/Header'
import Link from 'next/link'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata(
  '/faq',
  '자주 묻는 질문',
  'TQQQ 장기투자, 적립식·인출식 방법론에 대해 자주 나오는 질문과 답변 모음.',
)

const SECTIONS = [
  {
    title: '시작하기',
    color: 'border-blue-200 dark:border-blue-500/30',
    titleColor: 'text-blue-700 dark:text-blue-400',
    items: [
      {
        q: '지금 시작해도 괜찮나요?',
        a: '언제든 최선입니다. 백테스트는 1971년부터 모든 시작 시점을 계산하는데, "이미 많이 올랐다"고 느낄 때 시작한 경우도 10~14년 안에 거의 다 목표에 도달했습니다. 최악의 시작점은 언제나 "지금이 버블이다"라고 느낄 때입니다. 가장 좋은 시작 시점은 지금이고, 두 번째로 좋은 시작 시점도 지금입니다.',
        link: { href: '/simulator/custom', label: '내 시작 시점으로 시뮬레이션 →' },
      },
      {
        q: '얼마부터 시작해야 하나요?',
        a: '금액은 중요하지 않습니다. 매달 1만원도 시작이고, 1억도 시작입니다. 중요한 건 자동으로, 계속, 멈추지 않는 것입니다. 증권사 자동매수 기능을 쓰면 매일 매수가 일어나고 신경 쓸 일이 없습니다.',
      },
      {
        q: 'TQQQ 말고 VOO나 QQQ도 괜찮은가요?',
        a: '괜찮습니다. VOO(S&P500)는 변동성이 훨씬 낮고 10억 달성 기간도 더 길지만, 하락폭이 작아 심리적으로 버티기 쉽습니다. QLD(2배)는 TQQQ와 VOO 중간입니다. 어느 것이든 방법론을 꾸준히 지키는 쪽이 이깁니다. 시뮬레이터에서 직접 비교할 수 있습니다.',
        link: { href: '/simulator/custom', label: '종목별 비교 →' },
      },
      {
        q: '미국 주식은 어떻게 사나요?',
        a: '국내 증권사 계좌에서 해외 주식 거래를 신청하면 됩니다. 키움·삼성·미래에셋·NH 등 대부분의 증권사가 지원합니다. 원화를 달러로 환전한 뒤 TQQQ 티커로 주문하면 됩니다. 자동매수 기능을 지원하는 증권사를 고르면 더 편합니다.',
      },
    ],
  },
  {
    title: '적립식',
    color: 'border-blue-200 dark:border-blue-500/30',
    titleColor: 'text-blue-700 dark:text-blue-400',
    items: [
      {
        q: '목돈이 있으면 한꺼번에 넣어야 하나요?',
        a: 'TQQQ(3배)는 한꺼번에 넣는 것보다 5년에 걸쳐 나눠 넣는 것(C전략)이 최악의 경우를 크게 줄입니다. 나스닥100(1배)이나 VOO는 즉시 거치가 더 낫습니다. 목돈을 5년 분할 거치하면 최악 소요 기간이 약 3~4년 줄어듭니다.',
        link: { href: '/posts/lump-sum-vs-split', label: '목돈 분할 거치 분석 →' },
      },
      {
        q: '하락할 때 더 사야 하나요?',
        a: '아닙니다. 매일 같은 금액을 자동 매수하면 하락할 때 자연스럽게 더 많은 주식을 삽니다(달러코스트평균). 별도로 더 사거나, 하락했다고 팔거나, 타이밍을 잡으려 하면 오히려 성과가 나빠집니다.',
      },
      {
        q: '하락장이 오면 어떻게 해야 하나요?',
        a: '아무것도 하지 않습니다. 자동매수가 계속 돌아가면 됩니다. 백테스트 안에는 오일쇼크, 블랙먼데이, 닷컴버블, 금융위기, 코로나, 금리인상이 전부 들어있습니다. 그 모든 것을 겪고도 TQQQ는 우상향했습니다.',
        link: { href: '/posts/trust-the-method', label: '뉴스를 보지 말고 방법론을 지켜라 →' },
      },
      {
        q: '매달 얼마를 넣으면 10억에 도달하나요?',
        a: '역방향 계산기에서 확인할 수 있습니다. 예: TQQQ, 10억 목표, 10년 이내 80% 확률 → 월 약 120만원 수준입니다. 거치금이 있으면 훨씬 줄어듭니다.',
        link: { href: '/simulator/reverse', label: '역방향 계산기 →' },
      },
    ],
  },
  {
    title: '인출식',
    color: 'border-purple-200 dark:border-purple-500/30',
    titleColor: 'text-purple-700 dark:text-purple-400',
    items: [
      {
        q: '10억이 됐습니다. 이제 어떻게 하나요?',
        a: '25% 룰로 전환합니다. 세 가지 규칙: ① 나스닥100이 52주 최고 종가보다 25% 낮게 끝나면 다음날 TQQQ 전량 매도 → 현금(외화RP). ② 200일 평균선 위 15일 연속이면 전액 재매수. ③ 매달 총자산의 0.3~0.7% 인출해서 생활비로 사용. 홈 화면에서 오늘의 신호를 일주일에 한 번만 확인합니다.',
        link: { href: '/posts/withdrawal-guide', label: '인출식 방법론 전체 →' },
      },
      {
        q: '언제 팔아야 하나요?',
        a: '25% 룰 신호가 나올 때만 팝니다. 나스닥100이 52주 최고 종가보다 25% 이상 낮게 마감하는 날입니다. 홈 화면에서 "오늘의 신호"를 확인하면 됩니다. 뉴스나 감에 따라 팔지 않습니다.',
        link: { href: '/', label: '오늘의 신호 →' },
      },
      {
        q: '생활비를 매달 얼마나 꺼낼 수 있나요?',
        a: '자산의 0.3~0.7%입니다. 10억이면 월 300~700만원, 50억이면 월 1,500~3,500만원. 자산이 10억 이하이면 0.3%, 10~20억이면 0.5%, 20억 이상이면 0.7%가 권장 상한입니다. 자산이 줄면 인출금도 줄어듭니다.',
      },
      {
        q: '현금으로 있는 동안 이자가 붙나요?',
        a: '외화RP(증권사 달러 단기 상품)에 넣어두면 기준금리 근처의 이자를 받습니다. 백테스트 결과에 이미 반영되어 있습니다.',
      },
      {
        q: '하락장이 얼마나 심할 수 있나요?',
        a: '최대 낙폭은 −96%입니다. 100억이 4억까지 줄어들 수 있습니다. 25% 룰은 이 하락의 상당 부분을 피하지만, 신호가 발동하기 전에 이미 상당히 빠져있을 수 있습니다. 이 경험을 한 달씩 직접 체험해볼 수 있습니다.',
        link: { href: '/posts/experience-1990', label: '1990년 은퇴자 체험 →' },
      },
    ],
  },
  {
    title: '세금',
    color: 'border-gray-200 dark:border-gray-700',
    titleColor: 'text-gray-700 dark:text-gray-300',
    items: [
      {
        q: '세금은 얼마나 내나요?',
        a: '해외 ETF 매도 차익에서 연 250만원 공제 후 22%입니다. 25% 룰로 전량 매도할 때 이익이 한꺼번에 실현됩니다. 백테스트 결과에 양도세가 전부 반영되어 있습니다.',
        link: { href: '/posts/withdrawal-tax', label: '세금 상세 분석 →' },
      },
      {
        q: '세금 신고는 언제 하나요?',
        a: '다음 해 5월에 종합소득세 신고를 합니다. 매도한 해의 차익을 계산해서 신고하면 됩니다. 25% 룰로 매도하면 그 해의 양도 차익이 매우 크므로, 재매수 시 세금 몫을 현금으로 남겨두어야 합니다.',
        link: { href: '/posts/withdrawal-tax', label: '세금 납부 타이밍 분석 →' },
      },
      {
        q: '환율 영향이 있나요?',
        a: '달러로 투자하므로 환율 영향이 있습니다. 단, 1990년 이후 441개 시작 시점을 분석하면 98.7%에서 원화·달러 차이가 1년 미만입니다. 1998년 외환위기 고점(1,553원)에서 시작한 경우만 원화 기준이 13년 더 걸렸습니다.',
        link: { href: '/posts/krw-exchange-rate', label: '원화 영향 분석 →' },
      },
    ],
  },
  {
    title: '백테스트 · 데이터',
    color: 'border-gray-200 dark:border-gray-700',
    titleColor: 'text-gray-700 dark:text-gray-300',
    items: [
      {
        q: 'TQQQ는 2010년에 상장됐는데 1971년 데이터는 어디서 나오나요?',
        a: '나스닥100 일별 수익률에 3배를 곱해 합성한 이론값입니다. 실제 TQQQ보다 보수적으로 나옵니다(배당 미반영). 2010년 이후 실제 TQQQ와 비교하면 최대 낙폭은 동일하고 수익률만 연 2.2%p 정도 낮습니다.',
        link: { href: '/posts/real-vs-synthetic', label: '합성 가격 검증 →' },
      },
      {
        q: '합성 가격에 비용이 반영되어 있나요?',
        a: '운용보수(연 0.88%)와 스왑금리 비용((기준금리 + 0.5%) × 2)이 기본으로 반영됩니다. 시뮬레이터에서 "운용보수만" 버튼을 누르면 스왑금리를 뺀 이론치도 볼 수 있습니다.',
        link: { href: '/posts/tqqq-cost', label: 'TQQQ 비용 분석 →' },
      },
      {
        q: '결과를 믿어도 되나요?',
        a: '과거 데이터 기반이며 미래를 보장하지 않습니다. 단 닷컴버블(−78% NDX)은 이 백테스트에서 실제로 일어난 사건으로, 최악의 경우가 실제로 반영되어 있습니다. 2026년 10월부터는 실제 신호를 따른 실제 수익률을 공개하고 있습니다.',
        link: { href: '/live', label: '실제 운용 성적표 →' },
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black leading-tight mb-3">자주 묻는 질문</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
          처음 오셨거나, 특정 부분이 궁금할 때 찾아보세요.
          더 자세한 내용은 각 항목의 링크를 따라가면 됩니다.
        </p>

        <div className="space-y-8">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h2 className={`text-xs font-bold tracking-widest uppercase mb-4 ${section.titleColor}`}>
                {section.title}
              </h2>
              <div className={`border rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 ${section.color}`}>
                {section.items.map((item, i) => (
                  <div key={i} className="px-5 py-4">
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{item.q}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.a}</p>
                    {item.link && (
                      <Link
                        href={item.link.href}
                        className="inline-block mt-2 text-xs text-blue-500 dark:text-blue-400 hover:underline"
                      >
                        {item.link.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl px-5 py-4 text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
          모든 결과는 과거 데이터 기반이며 미래 수익을 보장하지 않습니다.
          TQQQ/QLD는 자산이 한때 90% 이상 줄어드는 시기를 견뎌야 하는 상품입니다.
          투자 결정은 본인의 판단과 책임 아래 하세요.
        </div>

        <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-wrap gap-4 text-sm">
          {[
            { href: '/start', label: '처음 오셨나요 — 순서대로 읽는 법' },
            { href: '/posts', label: '방법론 & 분석 글 전체 목록' },
            { href: '/simulator/reverse', label: '역방향 계산기 — 매달 얼마 필요한가' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="text-blue-500 dark:text-blue-400 hover:underline">
              {l.label} →
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
