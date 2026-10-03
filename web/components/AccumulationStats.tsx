'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Inst = 'ndx3x' | 'ndx2x' | 'ndx1x' | 'sp500'

interface CohortRow {
  sA: string; yA: number | null
  sB: string; yB: number | null
  sC: string; yC: number | null
}

const INSTRUMENTS: { key: Inst; label: string }[] = [
  { key: 'ndx3x', label: 'TQQQ (3×)' },
  { key: 'ndx2x', label: 'QLD (2×)' },
  { key: 'ndx1x', label: 'QQQ (1×)' },
  { key: 'sp500', label: 'VOO (S&P500)' },
]

const JSON_STD: Record<Inst, string> = {
  ndx3x: '/data/cohorts_ndx3x_10b.json',
  ndx2x: '/data/cohorts_ndx2x_10b.json',
  ndx1x: '/data/cohorts_ndx1x_10b.json',
  sp500: '/data/cohorts_sp500_10b.json',
}
const JSON_V2: Record<Inst, string> = {
  ndx3x: '/data/cohorts_ndx3x_10b_v2.json',
  ndx2x: '/data/cohorts_ndx2x_10b_v2.json',
  ndx1x: '/data/cohorts_ndx1x_10b_v2.json',
  sp500: '/data/cohorts_sp500_10b.json',
}

function calcStats(rows: CohortRow[], s: 'A' | 'B' | 'C') {
  const yKey = `y${s}` as keyof CohortRow
  const sKey = `s${s}` as keyof CohortRow
  const completed = rows.filter(r => r[sKey] === 'completed')
  const years = completed.map(r => r[yKey] as number).sort((a, b) => a - b)
  const n = years.length
  return {
    pct:    rows.length > 0 ? `${(n / rows.length * 100).toFixed(1)}%` : '—',
    median: n > 0 ? `${years[Math.floor(n / 2)].toFixed(1)}년` : '—',
    worst:  n > 0 ? `${years[n - 1].toFixed(1)}년` : '—',
  }
}

const S_COLOR = {
  A: 'text-emerald-600 dark:text-emerald-400',
  B: 'text-yellow-500 dark:text-yellow-400',
  C: 'text-blue-500 dark:text-blue-400',
}

export default function AccumulationStats() {
  const [inst,      setInst]      = useState<Inst>('ndx3x')
  const [withCosts, setWithCosts] = useState(false)
  const [rows,      setRows]      = useState<CohortRow[] | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(withCosts ? JSON_V2[inst] : JSON_STD[inst])
      .then(r => r.json())
      .then(d => { setRows(d.rows); setLoading(false) })
  }, [inst, withCosts])

  const stats = rows ? {
    A: calcStats(rows, 'A'),
    B: calcStats(rows, 'B'),
    C: calcStats(rows, 'C'),
  } : null

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6">
      {/* 종목 + 비용 토글 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {INSTRUMENTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInst(key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                inst === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
          <button
            onClick={() => setWithCosts(false)}
            className={`px-3 py-1.5 transition-colors ${!withCosts ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            운용보수만
          </button>
          <button
            onClick={() => setWithCosts(true)}
            className={`px-3 py-1.5 transition-colors ${withCosts ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            + 스왑금리
          </button>
        </div>
        {withCosts && inst === 'sp500' && (
          <span className="text-xs text-yellow-600 dark:text-yellow-400">S&P500은 레버리지 없음 — standard와 동일</span>
        )}
      </div>

      {/* 통계 */}
      {loading && <div className="text-xs text-gray-400 py-4 text-center">로딩 중…</div>}
      {!loading && stats && (
        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="py-2 pr-4 text-left text-gray-400 font-medium w-16"></th>
              {(['A', 'B', 'C'] as const).map(s => (
                <th key={s} className={`py-2 px-3 text-left font-bold ${S_COLOR[s]}`}>{s}전략</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {([
              { label: '완료율', key: 'pct'    },
              { label: '중간값', key: 'median' },
              { label: '최악',   key: 'worst'  },
            ] as const).map(({ label, key }) => (
              <tr key={label}>
                <td className="py-2 pr-4 text-gray-400">{label}</td>
                {(['A', 'B', 'C'] as const).map(s => (
                  <td key={s} className="py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 font-mono">
                    {stats[s][key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex gap-4">
        <Link href="/simulator/custom" className="text-xs text-blue-500 hover:underline">내 숫자로 시뮬레이터 →</Link>
        <Link href="/posts/strategy-abc/data" className="text-xs text-blue-500 hover:underline">전체 데이터 →</Link>
      </div>
    </div>
  )
}
