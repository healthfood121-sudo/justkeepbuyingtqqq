// 종목별 최근 실적 발표 컨퍼런스콜 정리 — 경영진(CEO·CFO)이 한 말, 애널리스트 질문과 답, 회사 전망.
// 출처: Motley Fool 녹취록. 원문은 저작권 때문에 저장하지 않고, 한국어 요지와 짧은 인용만 적는다.
// 텍스트 안의 **굵게** 는 굵은 글씨. 금지 표현(코호트·CAGR·OOS·이격도·파라미터 등)은 쓰지 않는다.
export type CallNote = {
  quarter: string                 // 예: '2026년 3분기'
  date: string                    // 콜 날짜
  url: string                     // 녹취록 주소
  people: string[]                // '제리 갈호프 (CEO)'
  headline: string                // 이번 콜 한 줄 요약
  numbers: string[]               // 발표된 핵심 숫자
  said: { who: string; topic: string; text: string }[]   // 경영진이 한 말
  qa: { q: string; a: string }[]  // 애널리스트 질문 → 경영진 답
  guide: string[]                 // 전망·계획
  read: string[]                  // 우리 해석 — 말투·숨은 신호·숫자와 말이 맞는지
}

export const CALLS: Record<string, CallNote> = {
}
