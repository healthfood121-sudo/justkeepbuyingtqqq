// 전략 코드 → 화면 이름. 고점 대비 하락 매도 전략은 'N% 룰'로 부른다 (RULE25 = 권장 전략 25% 룰).
export function stratName(code: string): string {
  const m = /^RULE(\d+)(C50)?$/.exec(code)
  if (m) return m[2] ? `${m[1]}% 룰 + 자산별 현금` : `${m[1]}% 룰`
  return code
}

// 예전 주소의 코드(T25, T25C50 …)를 새 코드(RULE25, RULE25C50 …)로
export function legacyCode(code: string): string {
  return code.replace(/^T(15|20|25|30)/, 'RULE$1')
}
