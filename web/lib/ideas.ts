// 종목 아이디어 공통: 데이터 타입·분류 규칙 (/private, /private/ideas 공용)

export type Metrics = {
  key: string; ticker: string; name: string
  price: number | null; ttmEps: number | null; pe: number | null; divYield: number | null
  peMed10: number | null; peVsMed: number | null
  epsCagr10: number | null; epsCagr5: number | null; epsDownYears10: number
  epsVsPeak: number | null; lastFy: number
  fromHigh3y: number | null; chg1y: number | null; chg3y: number | null
  roll10Median: number | null; roll10Min: number | null; roll10N: number | null
  roll10Over10: number | null; beatBench: number | null; beatTotal: number | null
  expRet10: number | null
  stale?: boolean   // 공시 EPS가 오래돼 숫자 비교 제외
}

export type Quality = {
  moat: number; pricing: number; profit: number; growth: number; durability: number
  grade: 'A' | 'B' | 'C' | 'D'
  business: string; strength: string; risk: string
}

export type GroupKey = 'pause' | 'stumble' | 'steady' | 'pricey'

export const GROUPS: Record<GroupKey, { label: string; short: string; desc: string; color: string }> = {
  pause: {
    label: '위대한 기업, 주가만 쉬는 중',
    short: '주가만 쉬는 중',
    desc: '이익은 고점 근처를 유지하는데 PER이 10년 중간값보다 낮아졌거나 주가가 3년 고점보다 20% 이상 빠진 경우 (에르메스형)',
    color: 'emerald',
  },
  stumble: {
    label: '위대한 기업, 이익이 주춤',
    short: '이익 주춤',
    desc: '경쟁우위는 있지만 최근 1년 이익이 10년 내 고점보다 15% 이상 줄어든 경우. 이익 회복 확인이 필요 (나이키형)',
    color: 'amber',
  },
  steady: {
    label: '꾸준히 좋고 값도 적당',
    short: '꾸준·적당',
    desc: '위대한 기업 중 이익이 계속 늘고(5년 연 5% 이상) PER이 10년 중간값 수준 이하인 경우',
    color: 'blue',
  },
  pricey: {
    label: '좋지만 지금은 비쌈',
    short: '지금은 비쌈',
    desc: '위대한 기업이지만 PER이 10년 중간값보다 30% 이상 높은 경우. 관심 목록에 두고 기다릴 만함',
    color: 'gray',
  },
}

export const qualityScore = (q?: Quality) =>
  q ? q.moat + q.pricing + q.profit + q.growth + q.durability : 0

// 경쟁우위가 확실한 기업: A등급 또는 해자 4점 이상 B등급
export const isGreat = (q?: Quality) => !!q && (q.grade === 'A' || (q.grade === 'B' && q.moat >= 4))

export function classify(m: Metrics, q?: Quality): GroupKey | null {
  if (!q) return null
  const great = isGreat(q)
  const epsOk = m.epsVsPeak != null && m.epsVsPeak >= 0.9
  const cheap = m.peVsMed != null && m.peVsMed <= 0.85
  const down = m.fromHigh3y != null && m.fromHigh3y <= -20
  if (great && epsOk && (cheap || down) && (m.epsCagr5 ?? -1) > 0) return 'pause'
  if (great && m.epsVsPeak != null && m.epsVsPeak < 0.85) return 'stumble'
  if (q.grade === 'A' && epsOk && m.peVsMed != null && m.peVsMed <= 1.1 && (m.epsCagr5 ?? 0) >= 5) return 'steady'
  if (q.grade === 'A' && m.peVsMed != null && m.peVsMed >= 1.3) return 'pricey'
  return null
}

export const GRADE_LABEL: Record<Quality['grade'], string> = {
  A: '위대한 기업', B: '좋은 기업', C: '보통', D: '주의',
}

export const gradeColor = (g?: Quality['grade']) =>
  g === 'A' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  : g === 'B' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  : g === 'C' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'

export const groupColor = (g: GroupKey | null) =>
  g === 'pause' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
  : g === 'stumble' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
  : g === 'steady' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
  : g === 'pricey' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
  : ''

export const fmt = (v: number | null | undefined, d = 1, suffix = '') =>
  v == null ? '—' : `${v.toFixed(d)}${suffix}`
export const fmtSgn = (v: number | null | undefined, d = 1, suffix = '%') =>
  v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(d)}${suffix}`
