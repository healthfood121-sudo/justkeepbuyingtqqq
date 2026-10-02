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
    title: '적립식 방법론: 어떤 종목을, 얼마씩, 어떻게 매수하나',
    date: '2026-10-01',
    tags: ['적립식', 'TQQQ', '방법론', '자동적립'],
    summary:
      'TQQQ 장기 적립의 전체 설계도. 매일 자동 적립이 핵심 — 시장 방향에 관계없이 멈추지 않는다. 종목 선택(QQQ/QLD/TQQQ), 목돈 분할 거치 방법, 합성가격의 의미까지 정리한다.',
    pinned: true,
    category: '적립식',
  },
  {
    slug: 'withdrawal-guide',
    title: '인출식 방법론: 10억 달성 후 어떻게 꺼내 쓰나',
    date: '2026-10-02',
    tags: ['인출식', 'EMA200', 'S0', 'FIRE', 'TQQQ', '방법론'],
    summary:
      '권장 전략: S0 — 나스닥100이 EMA200 아래 15거래일 연속이면 전량 현금, 위 15일 연속이면 재매수. 668가지 시작 시점 생존율 100%, 중간값 1,109억. 매수 후 1일 재매도 사례 없음. 수익 극대화가 목표라면 D10GK(중간값 3,741억).',
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
      '10억 달성 직후 인출 단계 진입 시 "버블 케이스" 처리 방법 비교. 2년 대기 후 DCA(Method A) vs 즉시 DCA(Method B). S0 전략 채택 전 초기 설계 기록.',
    category: '인출식',
  },
  {
    slug: 'withdrawal-new-ideas',
    title: '인출 전략 새 아이디어 8가지를 테스트해봤다',
    date: '2026-10-01',
    tags: ['인출식', 'RSI', 'EMA200', 'S0', 'D10GK', '백테스트'],
    summary:
      'S0(EMA200 15일 기준선, 중간값 1,109억)을 기준으로 골든크로스·분할재진입·RSI 조기재진입 등 8가지를 비교. RSI 조기재진입(S7)이 3,231억으로 S0 대비 2.9배 우세. D10GK는 이를 발전시킨 수익 극대화 옵션.',
    category: '인출식',
  },
  {
    slug: 'withdrawal-new-ideas2',
    title: '더 나을 줄 알았던 전략 3가지를 테스트해봤다',
    date: '2026-10-02',
    tags: ['인출식', '트레일링스탑', 'EMA200', '레버리지', '백테스트'],
    summary:
      '트레일링 스탑(T25), 단계적 현금화(GRAD), 자산 규모별 레버리지 하향(DLEV) 3가지를 668가지 시작 시점으로 검증. 모두 S0(1,109억)를 넘지 못했다. T25는 20년에 12번으로 거래가 가장 적지만 매수 다음날 재매도가 27.6%.',
    category: '인출식',
  },
  {
    slug: 'withdrawal-signal-test',
    title: '10억 달성 후 바로 꺼낼까, 1~2년 더 기다릴까',
    date: '2026-10-03',
    tags: ['인출식', 'EMA200', '인출지연', 'FIRE', 'TQQQ', '백테스트'],
    summary:
      'S0 신호를 NDX 기준이 아닌 TQQQ 가격 기준으로 적용하면 어떻게 되나. 결과: 중앙값 276억으로 NDX 기준(1,109억)의 1/4 수준. 신호는 반드시 원지수(NDX) 기준으로 판단해야 한다. 인출 2년 지연도 검증.',
    category: '인출식',
  },
  {
    slug: 'withdrawal-comparison',
    title: '인출 전략 비교: SP500 드로다운 기반 vs NDX 200MA 기반',
    date: '2026-10-01',
    tags: ['인출식', '백테스트', 'TQQQ', '200MA', '비교'],
    summary:
      'S0 전략의 핵심 근거. SP500 드로다운 기반(하락 중 보유)과 NDX EMA200 기반(전량 현금 전환)을 418가지 시작 시점으로 비교. EMA200 현금 전환이 203억 vs 12.7억으로 압도적 우세 — 하락장에서 팔지 않는 것이 핵심.',
    category: '인출식',
  },
]
