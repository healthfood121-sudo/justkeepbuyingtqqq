// 나스닥 사이클 글·데이터 페이지 공통 계산.
// synthetic_daily.json(나스닥100·TQQQ 합성가격, 비용 반영)으로 매월 첫 거래일마다
// "지난 10년 연평균 수익률"과 "다음 10년 연평균 수익률"을 계산한다.

export type Synthetic = { d: string[]; ndx: number[]; tqqq: number[]; qqq: number[] }
export type CycleRow = { month: string; past: number; nextNdx: number | null; nextTqqq: number | null }

export const BUCKETS: { key: string; label: string; lo: number; hi: number }[] = [
  { key: 'lt5', label: '5% 미만', lo: -100, hi: 5 },
  { key: '5-10', label: '5~10%', lo: 5, hi: 10 },
  { key: '10-15', label: '10~15%', lo: 10, hi: 15 },
  { key: '15-18', label: '15~18%', lo: 15, hi: 18 },
  { key: '18-22', label: '18~22%', lo: 18, hi: 22 },
  { key: 'ge22', label: '22% 이상', lo: 22, hi: 1000 },
]
export const bucketOf = (v: number) => BUCKETS.find(b => v >= b.lo && v < b.hi) ?? BUCKETS[BUCKETS.length - 1]

export function buildRows(s: Synthetic): CycleRow[] {
  const mi: number[] = [0]
  for (let i = 1; i < s.d.length; i++) if (s.d[i].slice(0, 7) !== s.d[i - 1].slice(0, 7)) mi.push(i)
  const c = (S: number[], a: number, b: number) => (Math.pow(S[mi[b]] / S[mi[a]], 1 / 10) - 1) * 100
  const rows: CycleRow[] = []
  for (let k = 120; k < mi.length; k++) {
    rows.push({
      month: s.d[mi[k]].slice(0, 7),
      past: c(s.qqq, k - 120, k),
      nextNdx: k + 120 < mi.length ? c(s.qqq, k, k + 120) : null,
      nextTqqq: k + 120 < mi.length ? c(s.tqqq, k, k + 120) : null,
    })
  }
  return rows
}

export function bucketStats(rows: CycleRow[]) {
  const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null }
  return BUCKETS.map(b => {
    const g = rows.filter(r => r.month >= '1985-01' && r.nextNdx != null && r.past >= b.lo && r.past < b.hi)
    const n = g.map(r => r.nextNdx!), t = g.map(r => r.nextTqqq!)
    const years = [...new Set(g.map(r => r.month.slice(0, 4)))]
    return {
      ...b, count: g.length,
      ndxMed: med(n), ndxMin: n.length ? Math.min(...n) : null, ndxMax: n.length ? Math.max(...n) : null, ndxLoss: n.filter(v => v < 0).length,
      tqqqMed: med(t), tqqqLoss: t.filter(v => v < 0).length,
      years: years.length > 4 ? `${years.slice(0, 2).join('·')} … ${years.slice(-2).join('·')}` : years.join('·'),
    }
  })
}

export const fmt = (v: number | null | undefined) => v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
