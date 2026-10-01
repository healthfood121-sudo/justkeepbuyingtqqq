export type PostMeta = {
  slug: string
  title: string
  date: string
  tags: string[]
  summary: string
  pinned?: boolean
}

export const posts: PostMeta[] = [
  {
    slug: 'accumulation-guide',
    title: '적립식 방법론: 어떤 종목을, 얼마씩, 어떤 전략으로',
    date: '2026-10-01',
    tags: ['적립식', 'A전략', 'B전략', 'C전략', 'TQQQ', '방법론'],  // A=계속적립, B=한도후중단, C=거치+계속
    summary:
      'TQQQ 장기 적립의 전체 설계도. 종목 선택(QQQ/QLD/TQQQ), 세 가지 전략(A/B/C), 거치금이 있을 때 분할 진입, 합성가격의 의미까지—방법론의 처음과 끝을 정리한다.',
    pinned: true,
  },
  {
    slug: 'withdrawal-guide',
    title: '인출식 방법론: 10억 달성 후 어떻게 꺼내 쓰나',
    date: '2026-10-01',
    tags: ['인출식', '버퍼', 'FIRE', 'TQQQ', '방법론'],
    summary:
      '10억을 달성했다면 다음이 더 중요하다. 버블 점검, 버퍼 계산, 월 1% 인출, SP500 −20%·−50% 각각 대응까지—인출 단계 전체 방법론을 설명한다.',
    pinned: true,
  },
  {
    slug: 'synthetic-ndx-1929',
    title: '1929년 대공황 시나리오는 TQQQ에서 얼마나 걸릴까',
    date: '2026-10-01',
    tags: ['A전략', '1929', '가상데이터', '베타', '백테스트'],
    summary:
      'NDX 데이터는 1971년부터만 존재한다. SP500과 NDX의 베타 회귀로 가상 pre-1971 NDX를 합성해 1929년 대공황을 테스트했다. 최근 베타(β=1.14~1.24) 기준, 1929 진입은 오히려 7~8년에 끝나고 전체 worst는 닷컴버블(13.74년)이다.',
  },
  {
    slug: 'lump-sum-vs-split',
    title: '거치금 2.5억, 한번에 넣을까 vs 3년에 나눠 넣을까',
    date: '2026-10-01',
    tags: ['C전략', '거치', '분할매수', 'TQQQ', '백테스트'],
    summary:
      '668가지 경우를 백테스트한 결과, TQQQ(3배)에서 3년 시간 분할이 최악의 소요기간을 12.24년 → 8.82년으로 3.4년 단축했다. 하락 대기형은 오히려 역효과. QLD·QQQ에서는 즉시 거치가 더 낫다.',
  },
  {
    slug: 'withdrawal-strategy-design',
    title: '인출 전략 설계기: 버블 케이스 재진입 방법 비교 (A vs B)',
    date: '2026-10-01',
    tags: ['인출', '백테스트', 'TQQQ', '닷컴버블'],
    summary:
      '10억 목표 달성 후 인출 단계로 넘어갈 때, 너무 빠르게 목표를 달성한 "버블 케이스"를 어떻게 처리할지 백테스트로 비교했습니다. 2년 대기 후 DCA(Method A) vs 즉시 DCA(Method B).',
  },
  {
    slug: 'withdrawal-comparison',
    title: '인출 전략 비교: SP500 드로다운 기반 vs NDX 200MA 기반',
    date: '2026-10-01',
    tags: ['인출', '백테스트', 'TQQQ', '200MA', '비교'],
    summary:
      '두 인출 전략을 418가지 코호트로 비교. SP500 드로다운 기반(A안)은 하락장에서 주식을 보유하고 인출만 중단, NDX MA200 기반(B안)은 전량 현금 전환 후 이자로 생활. 중앙값 기준 B안이 203억 vs 12.7억으로 압도적 우세.',
  },
]
