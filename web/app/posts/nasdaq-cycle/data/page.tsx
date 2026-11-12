'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { BUCKETS, buildRows, fmt, type Synthetic, type CycleRow } from '../cycle'

function DataView() {
  const sp = useSearchParams()
  const [b, setB] = useState(sp.get('b') ?? '18-22')
  const [rows, setRows] = useState<CycleRow[] | null>(null)
  useEffect(() => {
    fetch('/data/synthetic_daily.json').then(r => r.json()).then((s: Synthetic) => setRows(buildRows(s))).catch(() => setRows([]))
  }, [])
  const bucket = BUCKETS.find(x => x.key === b) ?? BUCKETS[4]
  const list = useMemo(() => (rows ?? []).filter(r => r.month >= '1985-01' && r.nextNdx != null && r.past >= bucket.lo && r.past < bucket.hi), [rows, bucket])
  const worst = list.length ? list.reduce((w, r) => (r.nextTqqq! < w.nextTqqq! ? r : w), list[0]) : null
  const th = 'py-2 px-2 text-xs font-medium text-gray-400 dark:text-gray-500 text-right whitespace-nowrap'
  const td = 'py-1.5 px-2 text-sm tabular-nums text-right'
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/posts/nasdaq-cycle" className="text-sm text-blue-500 hover:underline">← 나스닥 사이클 글로</Link>
      <h1 className="text-2xl font-bold mt-3 mb-2">시작 시점별 데이터 — 지난 10년 → 다음 10년</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">매월 첫 거래일에 시작했다고 본 경우(1985년~). 지난 10년 구간을 고르면 그 구간의 시작 시점을 전부 보여 준다. 다음 10년 TQQQ가 가장 나빴던 시작 시점은 빨간색.</p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {BUCKETS.map(x => (
          <button key={x.key} type="button" onClick={() => { setB(x.key); history.replaceState(null, '', `?b=${x.key}`) }}
            className={`px-3 py-1 rounded-full text-sm ${x.key === b ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            지난 10년 {x.label}
          </button>
        ))}
      </div>
      {!rows ? <p className="text-sm text-gray-400">불러오는 중…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-200 dark:border-gray-800">
              <th className={`${th} text-left`}>시작 시점</th><th className={th}>지난 10년</th><th className={th}>다음 10년 나스닥100</th><th className={th}>다음 10년 TQQQ</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {list.map(r => (
                <tr key={r.month} className={worst && r.month === worst.month ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}>
                  <td className={`${td} text-left`}>{r.month}</td>
                  <td className={td}>{fmt(r.past)}</td>
                  <td className={td}>{fmt(r.nextNdx)}</td>
                  <td className={`${td} ${(r.nextTqqq ?? 0) < 0 ? 'text-red-500' : ''}`}>{fmt(r.nextTqqq)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">{list.length}개 시작 시점. 연평균 수익률, 나스닥100 지수 가격 기준(배당 제외). TQQQ는 운용보수·차입 비용을 반영한 합성 가격.</p>
        </div>
      )}
    </main>
  )
}

export default function NasdaqCycleDataPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />
      <Suspense fallback={null}><DataView /></Suspense>
    </div>
  )
}
