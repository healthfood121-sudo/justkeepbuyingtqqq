// 종목별 비용 안내 문구 — 계산(lib/dataLoader.ts)과 같은 값
// 운용보수: TQQQ 0.88% · QLD 0.95% · QQQ·S&P500 0.20% / 스왑금리: 3배 기준금리×2 · 2배 ×1 · 1배 없음
type Inst = 'ndx3x' | 'ndx2x' | 'ndx1x' | 'sp500' | string

const INFO: Record<string, { name: string; fee: string; swap: string | null }> = {
  ndx3x: { name: 'TQQQ', fee: '0.88%', swap: '기준금리×2' },
  ndx2x: { name: 'QLD',  fee: '0.95%', swap: '기준금리×1' },
  ndx1x: { name: 'QQQ',  fee: '0.20%', swap: null },
  sp500: { name: 'S&P500', fee: '0.20%', swap: null },
}

// 토글 옆 한 줄 설명
export function costLabel(inst: Inst, withCosts: boolean): string {
  const i = INFO[inst] ?? INFO.ndx3x
  if (!i.swap) return `운용보수 ${i.fee}/년 반영 · 1배라 스왑금리 없음 (두 버튼 결과 같음)`
  return withCosts
    ? `운용보수 ${i.fee}/년 + 스왑금리(${i.swap}) 반영`
    : `운용보수 ${i.fee}/년만 반영 · 스왑금리 미반영 (이론치)`
}

// 하단 주의문 한 문장
export function costNote(inst: Inst, withCosts: boolean): string {
  const i = INFO[inst] ?? INFO.ndx3x
  if (!i.swap) return `${i.name} 운용보수 ${i.fee}/년을 반영했습니다. 1배라 스왑금리 비용은 없습니다.`
  return withCosts
    ? `${i.name} 운용보수 ${i.fee}/년과 스왑금리 비용(${i.swap})을 반영했습니다.`
    : `${i.name} 운용보수 ${i.fee}/년만 반영했고 스왑금리 비용(${i.swap})은 빠져 있습니다. [+ 스왑금리] 버튼으로 반영할 수 있습니다.`
}
