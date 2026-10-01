export type PostMeta = {
  slug: string
  title: string
  date: string
  tags: string[]
  summary: string
}

export const posts: PostMeta[] = [
  {
    slug: 'lump-sum-vs-split',
    title: '거치금 2.5억, 한번에 넣을까 vs 3년에 나눠 넣을까',
    date: '2026-10-01',
    tags: ['B전략', '거치', '분할매수', 'TQQQ', '백테스트'],
    summary:
      '668개 코호트 백테스트 결과, TQQQ(3배)에서 3년 시간 분할이 최악의 소요기간을 12.24년 → 8.82년으로 3.4년 단축했다. 하락 대기형은 오히려 역효과. QLD·QQQ에서는 즉시 거치가 더 낫다.',
  },
  {
    slug: 'withdrawal-strategy-design',
    title: '인출 전략 설계기: 버블 케이스 재진입 방법 비교 (A vs B)',
    date: '2026-10-01',
    tags: ['인출', '백테스트', 'TQQQ', '닷컴버블'],
    summary:
      '10억 목표 달성 후 인출 단계로 넘어갈 때, 너무 빠르게 목표를 달성한 "버블 케이스"를 어떻게 처리할지 백테스트로 비교했습니다. 2년 대기 후 DCA(Method A) vs 즉시 DCA(Method B).',
  },
]
