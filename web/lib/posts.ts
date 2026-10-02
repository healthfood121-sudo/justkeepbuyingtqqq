export type Category = '적립식' | '인출식'

export type PostMeta = {
  slug: string
  title: string
  date: string
  tags: string[]
  summary: string
  pinned?: boolean
  category: Category
}

export const posts: PostMeta[] = [
  {
    slug: 'accumulation-guide',
    title: '적립식 방법론: 어떤 종목을, 얼마씩, 어떤 전략으로',
    date: '2026-10-01',
    tags: ['적립식', 'A전략', 'B전략', 'C전략', 'TQQQ', '방법론'],
    summary:
      'TQQQ 장기 적립의 전체 설계도. 종목 선택(QQQ/QLD/TQQQ), 세 가지 전략(A/B/C), 거치금이 있을 때 분할 진입, 합성가격의 의미까지—방법론의 처음과 끝을 정리한다.',
    pinned: true,
    category: '적립식',
  },
  {
    slug: 'withdrawal-guide',
    title: '인출식 방법론: 10억 달성 후 어떻게 꺼내 쓰나',
    date: '2026-10-02',
    tags: ['인출식', 'EMA200', 'RSI', 'Guyton-Klinger', 'FIRE', 'TQQQ', '방법론'],
    summary:
      '목표 달성 후 FIRE 단계의 인출 설계 허브. 권장 전략: EMA200 15일 연속(S0) + 동적인출률. 668가지 시작 시점 생존율 100%, 중간값 1,109억. 수익 극대화 옵션: D10GK(중간값 3,741억, 단 장기 하락 시 잦은 재매도 주의).',
    pinned: true,
    category: '인출식',
  },
  {
    slug: 'synthetic-ndx-1929',
    title: '1929년 대공황 시나리오는 TQQQ에서 얼마나 걸릴까',
    date: '2026-10-01',
    tags: ['A전략', '1929', '가상데이터', '베타', '백테스트'],
    summary:
      'NDX 데이터는 1971년부터만 존재한다. SP500과 NDX의 베타 회귀로 가상 pre-1971 NDX를 합성해 1929년 대공황을 테스트했다. 최근 베타(β=1.14~1.24) 기준, 1929 진입은 오히려 7~8년에 끝나고 전체 worst는 닷컴버블(13.74년)이다.',
    category: '적립식',
  },
  {
    slug: 'strategy-abc',
    title: 'A·B·C 전략 비교: 계속적립 vs 매입액한도 vs 분할거치',
    date: '2026-10-01',
    tags: ['A전략', 'B전략', 'C전략', 'TQQQ', '비교', '백테스트'],
    summary:
      '세 가지 적립 전략을 668코호트로 비교. A(계속적립)와 B(매입액한도)는 완료율·소요기간 거의 동일하지만 VOO에서 B전략 최장 31년이 특이 케이스. C(분할거치)는 TQQQ에서 worst-case를 8.82년으로 단축.',
    category: '적립식',
  },
  {
    slug: 'lump-sum-vs-split',
    title: '거치금 2.5억, 한번에 넣을까 vs 3년에 나눠 넣을까',
    date: '2026-10-01',
    tags: ['C전략', '거치', '분할매수', 'TQQQ', '백테스트'],
    summary:
      '668가지 경우를 백테스트한 결과, TQQQ(3배)에서 3년 시간 분할이 최악의 소요기간을 12.24년 → 8.82년으로 3.4년 단축했다. 하락 대기형은 오히려 역효과. QLD·QQQ에서는 즉시 거치가 더 낫다.',
    category: '적립식',
  },
  {
    slug: 'withdrawal-strategy-design',
    title: '인출 전략 설계기: 버블 케이스 재진입 방법 비교 (A vs B)',
    date: '2026-10-01',
    tags: ['인출식', '백테스트', 'TQQQ', '닷컴버블'],
    summary:
      '10억 목표 달성 후 인출 단계로 넘어갈 때, 너무 빠르게 목표를 달성한 "버블 케이스"를 어떻게 처리할지 백테스트로 비교했습니다. 2년 대기 후 DCA(Method A) vs 즉시 DCA(Method B).',
    category: '인출식',
  },
  {
    slug: 'withdrawal-new-ideas',
    title: '인출 전략 새 아이디어 8가지를 테스트해봤다',
    date: '2026-10-01',
    tags: ['인출식', 'RSI', 'EMA200', 'Guyton-Klinger', 'DCA', '백테스트'],
    summary:
      '골든크로스, 분할재진입, Guyton-Klinger, 변동성 조정, 동적레버리지, RSI 조기재진입, Floor 보장형 등 8가지 아이디어를 418가지 시작 시점으로 테스트. RSI<30 조기재진입이 중간값 3,231억으로 현재 최선(1,176억) 대비 2.75배 우세.',
    category: '인출식',
  },
  {
    slug: 'withdrawal-new-ideas2',
    title: '더 나을 줄 알았던 전략 3가지를 테스트해봤다',
    date: '2026-10-02',
    tags: ['인출식', '트레일링스탑', 'EMA200', '레버리지', '백테스트'],
    summary:
      '트레일링 스탑(52주 고점 대비 하락), 단계적 현금화(이격도별 비율 조정), 자산 규모별 레버리지 하향 3가지를 668가지 진입 시점으로 테스트. 세 가지 모두 기준선(D10GK 3,741억)을 넘지 못했고 단계적 현금화는 131억으로 최하위. T25는 12회로 가장 단순한 전략.',
    category: '인출식',
  },
  {
    slug: 'withdrawal-signal-test',
    title: '10억 달성 후 바로 꺼낼까, 1~2년 더 기다릴까',
    date: '2026-10-03',
    tags: ['인출식', 'EMA200', '인출지연', 'FIRE', 'TQQQ', '백테스트'],
    summary:
      'TQQQ 자체 가격 기준 EMA200 신호와 인출 시작 지연(1년/2년) 두 가지를 418가지 시작 시점으로 검증. TQQQ EMA200 신호는 중앙값 276억으로 기준(1,176억)의 1/4 수준으로 열등. 인출 2년 지연은 +13%(1,333억) 개선 — 단, 지연 기간 중 다른 수입원이 있는 경우에만 유효.',
    category: '인출식',
  },
  {
    slug: 'withdrawal-comparison',
    title: '인출 전략 비교: SP500 드로다운 기반 vs NDX 200MA 기반',
    date: '2026-10-01',
    tags: ['인출식', '백테스트', 'TQQQ', '200MA', '비교'],
    summary:
      '두 인출 전략을 418가지 시작 시점으로 비교. SP500 드로다운 기반(A안)은 하락장에서 주식을 보유하고 인출만 중단, NDX MA200 기반(B안)은 전량 현금 전환 후 이자로 생활. 중간값 기준 B안이 203억 vs 12.7억으로 압도적 우세.',
    category: '인출식',
  },
]
