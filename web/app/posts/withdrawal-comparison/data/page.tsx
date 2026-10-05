'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import CostToggle from '@/components/CostToggle'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

// ─── 타입 ───────────────────────────────────────────────────

interface CohortStat {
  final: number
  withdrawn: number
  min: number
  bankrupt: boolean
  cagr: number
}

interface Cohort {
  start: string
  a: CohortStat
  b: CohortStat
}

interface Summary {
  total: number
  bankrupt: number
  survival_rate: number
  avg_final: number
  med_final: number
  avg_withdrawn: number
  avg_min: number
  min_of_min: number
  avg_cagr: number
}

interface CompData {
  summary: { a: Summary; b: Summary }
  cohorts: Cohort[]
}

// ─── 유틸 ───────────────────────────────────────────────────

function fmt억(v: number | null | undefined, digits = 1) {
  if (v === null || v === undefined) return '–'
  return `${v.toFixed(digits)}억`
}

function fmtPct(v: number | null | undefined) {
  if (v === null || v === undefined) return '–'
  return `${v.toFixed(1)}%`
}

// ─── 통계 배너 ───────────────────────────────────────────────

function SummaryBanner({ s, label }: { s: Summary; label: string }) {
  const items = [
    { label: '생존율',      value: `${s.survival_rate}%` },
    { label: '평균 최종값', value: fmt억(s.avg_final) },
    { label: '중앙 최종값', value: fmt억(s.med_final) },
    { label: '평균 인출액', value: fmt억(s.avg_withdrawn) },
    { label: '평균 연평균 수익률',  value: fmtPct(s.avg_cagr) },
  ]
  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">{label}</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
        {items.map(it => (
          <div
            key={it.label}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-center"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{it.label}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{it.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 메인 테이블 ─────────────────────────────────────────────

function DataTable({ cohorts, highlightStart }: { cohorts: Cohort[]; highlightStart?: string }) {
  const [sortKey, setSortKey] = useState<'start' | 'a_final' | 'b_final' | 'a_cagr' | 'b_cagr'>('start')
  const [asc, setAsc] = useState(true)

  const sorted = useMemo(() => {
    const cp = [...cohorts]
    cp.sort((x, y) => {
      let va: number, vb: number
      if (sortKey === 'start') {
        return asc ? x.start.localeCompare(y.start) : y.start.localeCompare(x.start)
      } else if (sortKey === 'a_final') {
        va = x.a.final; vb = y.a.final
      } else if (sortKey === 'b_final') {
        va = x.b.final; vb = y.b.final
      } else if (sortKey === 'a_cagr') {
        va = x.a.cagr; vb = y.a.cagr
      } else {
        va = x.b.cagr; vb = y.b.cagr
      }
      return asc ? va - vb : vb - va
    })
    return cp
  }, [cohorts, sortKey, asc])

  const toggle = (key: typeof sortKey) => {
    if (sortKey === key) setAsc(a => !a)
    else { setSortKey(key); setAsc(false) }
  }

  const Th = ({ k, children }: { k: typeof sortKey; children: React.ReactNode }) => (
    <th
      onClick={() => toggle(k)}
      className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
    >
      {children} {sortKey === k ? (asc ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-xs">
            <Th k="start">시작</Th>
            <Th k="a_final">A안 최종(억)</Th>
            <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium text-xs">A안 인출(억)</th>
            <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium text-xs">A안 최솟값(억)</th>
            <Th k="a_cagr">A안 연평균 수익률</Th>
            <Th k="b_final">B안 최종(억)</Th>
            <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium text-xs">B안 인출(억)</th>
            <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium text-xs">B안 최솟값(억)</th>
            <Th k="b_cagr">B안 연평균 수익률</Th>
            <th className="py-2 px-3 text-gray-500 dark:text-gray-400 font-medium text-xs"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.map((c) => {
            const isWorst = c.a.final < 1 || c.b.final < 1 || c.a.bankrupt || c.b.bankrupt
            const isHighlight = c.start === highlightStart
            const rowClass = isHighlight
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : isWorst
              ? 'bg-red-50/50 dark:bg-red-900/10'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'

            return (
              <tr key={c.start} className={`${rowClass} transition-colors`}>
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{c.start}</td>
                <td className={`py-2 px-3 text-xs ${c.a.bankrupt ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {c.a.bankrupt ? '파산' : fmt억(c.a.final, 1)}
                </td>
                <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-400">{fmt억(c.a.withdrawn, 1)}</td>
                <td className={`py-2 px-3 text-xs ${c.a.min < 1 ? 'text-orange-500 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {fmt억(c.a.min, 2)}
                </td>
                <td className={`py-2 px-3 text-xs ${c.a.cagr < 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {fmtPct(c.a.cagr)}
                </td>
                <td className={`py-2 px-3 text-xs ${c.b.bankrupt ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {c.b.bankrupt ? '파산' : fmt억(c.b.final, 1)}
                </td>
                <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-400">{fmt억(c.b.withdrawn, 1)}</td>
                <td className={`py-2 px-3 text-xs ${c.b.min < 1 ? 'text-orange-500 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {fmt억(c.b.min, 2)}
                </td>
                <td className={`py-2 px-3 text-xs ${c.b.cagr < 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {fmtPct(c.b.cagr)}
                </td>
                <td className="py-2 px-3 text-xs">
                  <Link
                    href={`/posts/withdrawal-comparison/data/cohort?start=${c.start}`}
                    className="text-blue-500 dark:text-blue-400 hover:underline"
                  >
                    상세 →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── 본체 ───────────────────────────────────────────────────

function DataPageInner() {
  const params = useSearchParams()
  const highlightStart = params.get('start') ?? undefined

  const [data, setData] = useState<CompData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'bad_a' | 'bad_b' | 'bankrupt'>('all')

  const [withCosts, setWithCosts] = useState(true)
  useEffect(() => {
    fetch(`/data/withdrawal_comparison${withCosts ? '_v2' : ''}.json`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [withCosts])

  const filtered = useMemo(() => {
    if (!data) return []
    const c = data.cohorts
    if (filter === 'bad_a')   return c.filter(x => x.a.final < 10)
    if (filter === 'bad_b')   return c.filter(x => x.b.final < 10)
    if (filter === 'bankrupt') return c.filter(x => x.a.bankrupt || x.b.bankrupt)
    return c
  }, [data, filter])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">데이터 로딩 중…</p>
      </div>
    )
  }
  if (!data) return null

  const filterBtns: { key: typeof filter; label: string }[] = [
    { key: 'all',     label: `전체 (${data.cohorts.length})` },
    { key: 'bad_a',   label: `A안 10억↓ (${data.cohorts.filter(c => c.a.final < 10).length})` },
    { key: 'bad_b',   label: `B안 10억↓ (${data.cohorts.filter(c => c.b.final < 10).length})` },
    { key: 'bankrupt', label: `파산 포함 (${data.cohorts.filter(c => c.a.bankrupt || c.b.bankrupt).length})` },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-6xl" />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href="/posts/withdrawal-comparison"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-4 inline-block"
          >
            ← 분석 글로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            인출 전략 비교 — 전체 시작 시점 데이터
          </h1>
          <CostToggle withCosts={withCosts} onChange={setWithCosts} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            초기 10억, 월 1% 인출, 20년 시뮬레이션 · A안=SP500기반 / B안=MA200기반
          </p>
        </div>

        <SummaryBanner s={data.summary.a} label="A안 (SP500 드로다운 기반)" />
        <SummaryBanner s={data.summary.b} label="B안 (NDX MA200 기반)" />

        {/* 필터 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterBtns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filter === key
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-transparent'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          헤더 클릭 → 정렬. 빨간 행 = 두 전략 중 하나가 최종값 1억 미만. 파란 행 = URL에서 선택된 시작 시점.
        </div>

        <DataTable cohorts={filtered} highlightStart={highlightStart} />
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
