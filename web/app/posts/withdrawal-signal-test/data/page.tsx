'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

interface StrategyResult {
  final: number
  cagr: number
  min: number
  bankrupt: boolean
}

interface CohortRow {
  start: string
  [key: string]: StrategyResult | string
}

interface SummaryRow {
  name: string
  desc: string
  survival_rate: number
  med_final: number
  avg_final: number
  p25_final: number
  p75_final: number
  avg_withdrawn: number
  min_of_min: number
  avg_cagr: number
}

interface SignalTestData {
  meta: { generated: string; sim_years: number; n_cohorts: number; strategies: { name: string; desc: string }[] }
  summary: SummaryRow[]
  cohorts: CohortRow[]
}

const STRATEGIES = ['S0', 'TQQQ_EMA', 'DELAY12', 'DELAY24']

const COLORS: Record<string, string> = {
  S0:       'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  TQQQ_EMA: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  DELAY12:  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  DELAY24:  'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
}

function fmt억(v: number) {
  return v < 0 ? '파산' : `${v.toFixed(1)}억`
}

function DataViewerContent() {
  const searchParams = useSearchParams()
  const initM = searchParams.get('m') ?? 'S0'

  const [data, setData] = useState<SignalTestData | null>(null)
  const [selected, setSelected] = useState<string>(STRATEGIES.includes(initM) ? initM : 'S0')
  const [sortKey, setSortKey] = useState<'start' | 'final' | 'cagr'>('start')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    fetch('/data/withdrawal_signal_test.json')
      .then(r => r.json())
      .then(setData)
  }, [])

  const summary = useMemo(() => data?.summary.find(s => s.name === selected), [data, selected])

  const rows = useMemo(() => {
    if (!data) return []
    const cohorts = data.cohorts
    const sorted = [...cohorts].sort((a, b) => {
      const ra = (a[selected] as StrategyResult)
      const rb = (b[selected] as StrategyResult)
      if (sortKey === 'start') return sortAsc ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start)
      if (sortKey === 'final') return sortAsc ? ra.final - rb.final : rb.final - ra.final
      if (sortKey === 'cagr')  return sortAsc ? ra.cagr  - rb.cagr  : rb.cagr  - ra.cagr
      return 0
    })
    return sorted
  }, [data, selected, sortKey, sortAsc])

  const worstFinal = useMemo(() => {
    if (!rows.length) return null
    return rows.reduce((w, r) => {
      const v = (r[selected] as StrategyResult).final
      return v < (w[selected] as StrategyResult).final ? r : w
    })
  }, [rows, selected])

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sortIcon = (key: typeof sortKey) =>
    sortKey !== key ? ' ↕' : sortAsc ? ' ↑' : ' ↓'

  if (!data) return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">데이터 로딩 중…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">

        <div className="mb-2">
          <Link href="/posts/withdrawal-signal-test" className="text-xs text-blue-500 dark:text-blue-400 hover:underline">
            ← 포스트로 돌아가기
          </Link>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">데이터 뷰어: 신호 변형 테스트</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          {data.meta.n_cohorts}개 진입 시점 · {data.meta.sim_years}년 시뮬레이션 · 생성: {data.meta.generated}
        </p>

        {/* 전략 탭 */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STRATEGIES.map(name => {
            const s = data.summary.find(r => r.name === name)
            return (
              <button
                key={name}
                onClick={() => setSelected(name)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  selected === name
                    ? (COLORS[name] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200') + ' border-transparent'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                {name}
                {s && <span className="ml-1.5 text-xs opacity-70">{s.med_final.toFixed(0)}억</span>}
              </button>
            )
          })}
        </div>

        {/* 요약 카드 */}
        {summary && (
          <div className={`rounded-xl border px-5 py-4 mb-6 text-sm ${COLORS[selected] ?? ''}`}>
            <p className="font-semibold mb-2">{summary.name} — {summary.desc}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><p className="opacity-60 mb-0.5">중앙값</p><p className="font-bold text-base">{summary.med_final.toFixed(1)}억</p></div>
              <div><p className="opacity-60 mb-0.5">연평균 수익률</p><p className="font-bold text-base">{summary.avg_cagr.toFixed(1)}%</p></div>
              <div><p className="opacity-60 mb-0.5">생존율</p><p className="font-bold text-base">{summary.survival_rate.toFixed(1)}%</p></div>
              <div><p className="opacity-60 mb-0.5">평균 총 인출</p><p className="font-bold text-base">{summary.avg_withdrawn.toFixed(1)}억</p></div>
              <div><p className="opacity-60 mb-0.5">25분위</p><p className="font-semibold">{summary.p25_final.toFixed(1)}억</p></div>
              <div><p className="opacity-60 mb-0.5">75분위</p><p className="font-semibold">{summary.p75_final.toFixed(1)}억</p></div>
              <div><p className="opacity-60 mb-0.5">최솟값</p><p className="font-semibold">{summary.min_of_min.toFixed(2)}억</p></div>
            </div>
          </div>
        )}

        {/* 진입 시점별 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th
                  className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  onClick={() => toggleSort('start')}
                >
                  진입 시점{sortIcon('start')}
                </th>
                <th
                  className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  onClick={() => toggleSort('final')}
                >
                  20년 후 자산{sortIcon('final')}
                </th>
                <th
                  className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  onClick={() => toggleSort('cagr')}
                >
                  연평균 수익률{sortIcon('cagr')}
                </th>
                <th className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium">최솟값</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map(row => {
                const r = row[selected] as StrategyResult
                const isWorst = row === worstFinal
                return (
                  <tr
                    key={row.start}
                    className={`transition-colors ${
                      isWorst
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <td className="py-1.5 px-3 font-mono text-gray-600 dark:text-gray-400">
                      {row.start}
                      {isWorst && <span className="ml-1.5 text-xs text-red-500 dark:text-red-400">최악</span>}
                    </td>
                    <td className={`py-1.5 px-3 text-right font-mono font-semibold ${
                      r.bankrupt ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {fmt억(r.final)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                      {r.cagr.toFixed(1)}%
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono text-gray-500 dark:text-gray-500 text-xs">
                      {r.min.toFixed(2)}억
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}

export default function WithdrawalSignalTestDataPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">로딩 중…</p>
      </div>
    }>
      <DataViewerContent />
    </Suspense>
  )
}
