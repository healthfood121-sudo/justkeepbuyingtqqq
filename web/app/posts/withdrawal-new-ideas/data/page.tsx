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
}

interface NewIdeasData {
  meta: { generated: string; sim_years: number; n_cohorts: number; strategies: { name: string; desc: string }[] }
  summary: SummaryRow[]
  cohorts: CohortRow[]
}

// ─── 전략 한글 이름 ───────────────────────────────────────────

const LABEL: Record<string, { short: string; full: string; color: string }> = {
  S0: { short: 'S0 기준선',       full: 'EMA200 15일 연속 + 동적 인출 (현재 권장)',          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700' },
  S1: { short: 'S1 골든크로스',   full: 'EMA50 × EMA200 교차 신호',                          color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
  S2: { short: 'S2 분할 3개월',   full: '분할 재진입 3개월 — 신호 후 3개월에 걸쳐 매수',      color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
  S3: { short: 'S3 분할 6개월',   full: '분할 재진입 6개월 — 신호 후 6개월에 걸쳐 매수',      color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
  S4: { short: 'S4 G-K 인출',     full: 'Guyton-Klinger — 인출률 120% 초과 시 감액',          color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' },
  S5: { short: 'S5 변동성 조정',  full: '변동성 조정 인출 — 30일 변동성 높으면 인출 30% 감소', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
  S6: { short: 'S6 동적 레버리지',full: '동적 레버리지 — EMA200±5% 기준 TQQQ↔QQQ 전환',      color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
  S7: { short: 'S7 RSI 조기 재진입', full: 'RSI<30 즉시 재매수 (D10GK의 핵심 아이디어)',       color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700' },
  S8: { short: 'S8 최소 보장형',  full: 'Floor 보장형 — 최소 500만/월 보장 (파산 위험 감수)', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700' },
}

function fmt억(v: number) {
  return v < 0 ? '파산' : `${v.toFixed(1)}`
}
function fmtPct(v: number) { return `${v.toFixed(1)}%` }

// ─── 요약 카드 ────────────────────────────────────────────────

function SummaryCard({ row }: { row: SummaryRow }) {
  const info = LABEL[row.name]
  const isS7 = row.name === 'S7'
  const isS0 = row.name === 'S0'
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${info?.color ?? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200'}`}>
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div>
          <span className="font-bold text-sm">{info?.short ?? row.name}</span>
          {isS7 && <span className="ml-1.5 text-xs font-semibold opacity-80">★ 최고</span>}
          {isS0 && <span className="ml-1.5 text-xs font-semibold opacity-80">권장</span>}
        </div>
        <span className="text-xs opacity-60 shrink-0">{row.survival_rate}% 생존</span>
      </div>
      <p className="text-xs opacity-70 mb-2 leading-relaxed">{info?.full ?? row.desc}</p>
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div><span className="opacity-60">중간값</span><br /><span className="font-semibold">{fmt억(row.med_final)}억</span></div>
        <div><span className="opacity-60">연평균</span><br /><span className="font-semibold">{fmtPct(row.avg_cagr)}</span></div>
        <div><span className="opacity-60">거래</span><br /><span className="font-semibold">{row.avg_trades.toFixed(0)}회</span></div>
      </div>
    </div>
  )
}

// ─── 전략 선택 토글 ───────────────────────────────────────────

function StrategyToggle({
  strategies, selected, onToggle,
}: {
  strategies: { name: string; desc: string }[]
  selected: Set<string>
  onToggle: (name: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {strategies.map(s => {
        const info = LABEL[s.name]
        const on   = selected.has(s.name)
        return (
          <button
            key={s.name}
            onClick={() => onToggle(s.name)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              on
                ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent font-semibold'
                : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
            }`}
          >
            {info?.short ?? s.name}
          </button>
        )
      })}
    </div>
  )
}

// ─── 메인 테이블 ─────────────────────────────────────────────

type SortKey = 'start' | string

function DataTable({
  cohorts, strategies, sortKey, asc, onSort,
}: {
  cohorts: CohortRow[]
  strategies: { name: string; desc: string }[]
  sortKey: SortKey
  asc: boolean
  onSort: (k: SortKey) => void
}) {
  const Th = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      onClick={() => onSort(k)}
      className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 text-xs"
    >
      <span className="whitespace-nowrap">{children}{sortKey === k ? (asc ? ' ↑' : ' ↓') : ''}</span>
    </th>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <Th k="start">시작</Th>
            {strategies.map(s => (
              <Th key={s.name} k={s.name}>
                {LABEL[s.name]?.short ?? s.name}
              </Th>
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
                <td className="py-1.5 px-2 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.start}</td>
                {strategies.map((s, i) => {
                  const r = row[s.name] as StrategyResult | undefined
                  const val = finals[i]
                  const isBest = val > 0 && val === maxFinal
                  const isBankrupt = r?.bankrupt
                  return (
                    <td
                      key={s.name}
                      className={`py-1.5 px-2 text-right font-mono whitespace-nowrap ${
                        isBankrupt ? 'text-red-500' :
                        isBest     ? 'font-bold text-green-600 dark:text-green-400' :
                                     'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {isBankrupt ? '파산' : val.toFixed(1)}억
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

const ALL_STRATEGIES = ['S0','S1','S2','S3','S4','S5','S6','S7','S8']

function DataPageInner() {
  const params    = useSearchParams()
  const highlight = params.get('start')

  const [data, setData]       = useState<NewIdeasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('start')
  const [asc, setAsc]         = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set(ALL_STRATEGIES))

  const [withCosts, setWithCosts] = useState(true)
  useEffect(() => {
    fetch(`/data/withdrawal_new_ideas${withCosts ? '_v2' : ''}.json`)
      .then(r => r.json())
      .then((d: NewIdeasData) => { setData(d); setLoading(false) })
  }, [withCosts])

  const activeStrategies = useMemo(
    () => data?.meta.strategies.filter(s => selected.has(s.name)) ?? [],
    [data, selected]
  )

  const sorted = useMemo(() => {
    if (!data) return []
    const cp = [...data.cohorts]
    if (sortKey === 'start') {
      cp.sort((a, b) => asc ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start))
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

  const s7row = data.summary.find(r => r.name === 'S7')
  const s0row = data.summary.find(r => r.name === 'S0')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-7xl" />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/posts/withdrawal-new-ideas"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-block"
          >
            ← 분석 글로
          </Link>
          <h1 className="text-2xl font-bold mb-1">인출 아이디어 8가지 — 전체 시뮬레이션 결과</h1>
          <CostToggle withCosts={withCosts} onChange={setWithCosts} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            초기 10억 · 나스닥100 3배 · 20년 시뮬레이션 · {data.meta.n_cohorts}가지 시작 시점
          </p>
        </div>

        {/* 전략 요약 */}
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">전략별 요약 ({data.meta.n_cohorts}가지 시작 시점 기준)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
          {data.summary.map(row => <SummaryCard key={row.name} row={row} />)}
        </div>

        {/* 핵심 수치 */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-5 py-4 mb-8 text-sm">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">핵심 비교</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div>S7 RSI 조기 재진입 중간값 <strong className="text-purple-600 dark:text-purple-400">{fmt억(s7row?.med_final ?? 0)}억</strong></div>
            <div>S0 기준선 중간값 <strong className="text-blue-600 dark:text-blue-400">{fmt억(s0row?.med_final ?? 0)}억</strong></div>
            <div>S7이 S0보다 <strong>{s0row && s7row ? `${(s7row.med_final / s0row.med_final).toFixed(1)}배` : '—'}</strong> 우세</div>
          </div>
        </div>

        {/* 전략 선택 */}
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">표시할 전략 선택</h2>
        <StrategyToggle strategies={data.meta.strategies} selected={selected} onToggle={toggleStrategy} />

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          헤더 클릭 → 정렬. <span className="text-green-600 dark:text-green-400 font-semibold">굵은 초록</span> = 해당 시작 시점에서 1위.
          {highlight ? ` 선택 시작 시점: ${highlight}` : ''}
        </p>

        {/* 전체 데이터 테이블 */}
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
