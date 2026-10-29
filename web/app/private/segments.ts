// 종목별 사업부·지역별 매출 해설 — /data/segments/{KEY}.json(자동 수집)에 붙이는 사람이 쓴 분석.
// 텍스트 안의 **굵게** 는 굵은 글씨로 보인다. 금지 표현(코호트·CAGR·OOS 등)은 쓰지 않는다.
export type SegNote = {
  asOf: string
  axis?: string                    // 기본으로 보여줄 축(axis 이름 끝부분, 예: 'StatementGeographicalAxis'). 없으면 자동(지역 우선)
  labels?: Record<string, string>  // 멤버 id(끝부분) → 한글 이름
  title: string                    // "1-1. 지역별 매출 — " 뒤에 붙는 한 줄 결론
  intro?: string
  good: string[]; bad: string[]
  goodLab?: string; badLab?: string
  verdict: string                  // 판정
  next: string                     // 다음에 볼 숫자
}

export const SEG_NOTES: Record<string, SegNote> = {
}
