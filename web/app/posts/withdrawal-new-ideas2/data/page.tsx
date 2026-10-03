'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import CostToggle from '@/components/CostToggle'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

// ─── 타입 ────────────────────────────────────────────────────

interface StrategyResult {
  final: number
  cagr: number
  min: number
  bankrupt: boolean
  trades: number
  ongoing: boolean
  actual_yr: number
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
  avg_trades: number
  n_completed: number
  n_ongoing: number
}

interface StrategyMeta {
  name: string
  desc: string
}

interface NewIdeas2Data {
  meta: { generated: string; sim_years: number; n_cohorts: number; strategies: StrategyMeta[] }
  summary: SummaryRow[]
  cohorts: CohortRow[]
}

// ─── 유틸 ────────────────────────────────────────────────────

function fmt억(v: number, d = 1) {
  return v < 0 ? '파산' : `${v.toFixed(d)}`
}

function fmtPct(v: number) { return `${v.toFixed(1)}%` }

// ─── 전략 색상 ────────────────────────────────────────────────

const COLORS: Record<string, string> = {
  S0:    'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  D10GK: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  T15:   'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  T20:   'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  T25:   'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  GRAD:  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  DLEV:  'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
}

const DEFAULT_COLOR = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'

// ─── 요약 카드 ────────────────────────────────────────────────

function SummaryCard({ row }: { row: SummaryRow }) {
  const color = COLORS[row.name] ?? DEFAULT_COLOR
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${color}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-bold font-mono">{row.name}</span>
        <span className="text-xs opacity-70">{row.survival_rate}% 생존</span>
      </div>
      <p className="text-xs opacity-80 mb-2 line-clamp-1">{row.desc}</p>
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div><span className="opacity-60">중앙</span> <span className="font-semibold">{fmt억(row.med_final)}억</span></div>
        <div><span className="opacity-60">CAGR</span> <span className="font-semibold">{fmtPct(row.avg_cagr)}</span></div>
        <div><span className="opacity-60">거래</span> <span className="font-semibold">{row.avg_trades.toFixed(0)}회</span></div>
      </div>
      <div className="text-xs opacity-50 mt-1">완료 {row.n_completed}개 · 진행중 {row.n_ongoing}개</div>
    </div>
  )
}

// ─── 메인 테이블 ─────────────────────────────────────────────

type SortKey = 'start' | string

function DataTable({
  cohorts, strategies, sortKey, asc, onSort,
}: {
  cohorts: CohortRow[]
  strategies: StrategyMeta[]
  sortKey: SortKey
  asc: boolean
  onSort: (k: SortKey) => void
}) {
  const Th = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      onClick={() => onSort(k)}
      className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap text-xs"
    >
      {children}{sortKey === k ? (asc ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <Th k="start">시작</Th>
            {strategies.map(s => (
              <Th key={s.name} k={s.name}>{s.name} (억)</Th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {cohorts.map(row => {
            const finals = strategies.map(s => {
              const r = row[s.name] as StrategyResult | undefined
              return r ? (r.bankrupt ? -1 : r.final) : 0
            })
            const maxFinal = Math.max(...finals.filter(v => v >= 0))

            return (
              <tr key={row.start} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {(() => {
                  const anyOngoing = strategies.some(s => (row[s.name] as StrategyResult | undefined)?.ongoing)
                  return (
                    <td className={`py-1.5 px-2 font-mono ${anyOngoing ? 'text-blue-400 dark:text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {row.start}{anyOngoing ? ' ↗' : ''}
                    </td>
                  )
                })()}
                {strategies.map((s, i) => {
                  const r = row[s.name] as StrategyResult | undefined
                  const val = finals[i]
                  const isBest = val > 0 && val === maxFinal
                  const isBankrupt = r?.bankrupt
                  const isOngoing = r?.ongoing
                  return (
                    <td
                      key={s.name}
                      className={`py-1.5 px-2 text-right font-mono ${
                        isBankrupt ? 'text-red-500' :
                        isOngoing  ? 'text-blue-400 dark:text-blue-500 italic' :
                        isBest     ? 'font-bold text-green-600 dark:text-green-400' :
                                     'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {isBankrupt ? '파산' : isOngoing ? `${val.toFixed(1)}~` : val.toFixed(1)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── 본체 ────────────────────────────────────────────────────

function DataPageInner() {
  const params    = useSearchParams()
  const highlight = params.get('start')
  const [data, setData]   = useState<NewIdeas2Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('start')
  const [asc, setAsc]     = useState(true)

  const allNames = ['S0', 'D10GK', 'T15', 'T20', 'T25', 'GRAD', 'DLEV']
  const [selected, setSelected] = useState<Set<string>>(new Set(allNames))

  const [withCosts, setWithCosts] = useState(true)
  useEffect(() => {
    fetch(`/data/withdrawal_new_ideas2${withCosts ? '_v2' : ''}.json`)
      .then(r => r.json())
      .then((d: NewIdeas2Data) => { setData(d); setLoading(false) })
  }, [withCosts])

  const activeStrategies = useMemo(
    () => data?.meta.strategies.filter(s => selected.has(s.name)) ?? [],
    [data, selected]
  )

  const sorted = useMemo(() => {
    if (!data) return []
    const cp = [...data.cohorts]
    if (sortKey === 'start') {
      cp.sort((a, b) => asc
        ? a.start.localeCompare(b.start)
        : b.start.localeCompare(a.start))
    } else {
      cp.sort((a, b) => {
        const ra = (a[sortKey] as StrategyResult | undefined)?.final ?? 0
        const rb = (b[sortKey] as StrategyResult | undefined)?.final ?? 0
        return asc ? ra - rb : rb - ra
      })
    }
    return cp
  }, [data, sortKey, asc])

  const handleSort = (k: SortKey) => {
    if (k === sortKey) setAsc(v => !v)
    else { setSortKey(k); setAsc(false) }
  }

  const toggleStrategy = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) { if (next.size > 1) next.delete(name) }
      else next.add(name)
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">데이터 로딩 중…</p>
      </div>
    )
  }
  if (!data) return null

  const baselineRow = data.summary.find(r => r.name === 'S0')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-7xl" />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/posts/withdrawal-new-ideas2"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-block"
          >
            ← 분석 글로
          </Link>
          <h1 className="text-2xl font-bold">새 아이디어 2차 실험 — 전체 진입 시점별 데이터</h1>
          <CostToggle withCosts={withCosts} onChange={setWithCosts} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            초기 10억 · NDX 3x · 최대 20년 시뮬레이션 · {data.meta.n_cohorts}가지 진입 시점
            · 기준선(S0) 중앙값 {fmt억(baselineRow?.med_final ?? 0)}억
            (20년 완료 {baselineRow?.n_completed ?? 0}개 기준)
          </p>
        </div>

        {/* 요약 카드 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 mb-6">
          {data.summary.map(row => <SummaryCard key={row.name} row={row} />)}
        </div>

        {/* 전략 선택 토글 */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {data.meta.strategies.map(s => (
            <button
              key={s.name}
              onClick={() => toggleStrategy(s.name)}
              title={s.desc}
              className={`px-2.5 py-1 text-xs rounded-full border font-mono transition-colors ${
                selected.has(s.name)
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-transparent'
                  : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          헤더 클릭 → 정렬 · 굵은 녹색 = 해당 진입 시점 1위 · 파란색 숫자(↗~) = 20년 미완료(진행 중)
          {highlight ? ` · 선택 진입 시점: ${highlight}` : ''}
        </p>

        <DataTable
          cohorts={sorted}
          strategies={activeStrategies}
          sortKey={sortKey}
          asc={asc}
          onSort={handleSort}
        />
      </main>
    </div>
  )
}

export default function DataPage() {
  return (
    <Suspense>
      <DataPageInner />
    </Suspense>
  )
}
