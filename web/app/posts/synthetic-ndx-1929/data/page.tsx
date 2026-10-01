'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

// ── 타입 ─────────────────────────────────────────────────

type CohortRow = { s: string; y: number | null }

type CohortJson = {
  note: string
  betas: Record<string, number>
  real: { '1x': CohortRow[]; '3x': CohortRow[] }
  synth: Record<string, { '1x': CohortRow[]; '3x': CohortRow[] }>
}

type Stats = {
  total: number; completed: number; pct: number
  avg: number | null; median: number | null; min: number | null; max: number | null
}

// ── 상수 ─────────────────────────────────────────────────

const LEVERAGES = [
  { key: '1x' as const, label: 'NDX 1x (QQQ)' },
  { key: '3x' as const, label: 'NDX 3x (TQQQ)' },
]

const BETAS = [
  { key: 'pre-tech', label: 'β=0.767  pre-tech (1971~1990)', color: '#9ca3af' },
  { key: 'recent',   label: 'β=1.138  recent (2011~2026)',   color: '#3b82f6' },
  { key: 'tech-era', label: 'β=1.244  tech-era (1991~2026)', color: '#10b981' },
  { key: 'latest',   label: 'β=1.294  latest (2021~2026)',   color: '#a855f7' },
  { key: 'real',     label: '실제 NDX (1971~ 실측)',          color: '#f59e0b' },
]

// ── 유틸 ─────────────────────────────────────────────────

function calcStats(rows: CohortRow[]): Stats {
  const completed = rows.filter(r => r.y !== null)
  const years = completed.map(r => r.y as number).sort((a, b) => a - b)
  const n = years.length
  return {
    total:     rows.length,
    completed: n,
    pct:       rows.length > 0 ? Math.round(100 * n / rows.length) : 0,
    avg:       n > 0 ? Math.round(years.reduce((a, b) => a + b, 0) / n * 100) / 100 : null,
    median:    n > 0 ? (n % 2 === 0 ? (years[n / 2 - 1] + years[n / 2]) / 2 : years[Math.floor(n / 2)]) : null,
    min:       n > 0 ? years[0] : null,
    max:       n > 0 ? years[n - 1] : null,
  }
}

function fmtYears(y: number | null) {
  if (y === null) return <span className="text-gray-400">미완료</span>
  return `${y.toFixed(2)}년`
}

// ── 통계 배너 ─────────────────────────────────────────────

function StatsBanner({ stats }: { stats: Stats }) {
  const items = [
    { label: '완료율',   value: `${stats.completed}/${stats.total} (${stats.pct}%)` },
    { label: '평균',     value: stats.avg    != null ? `${stats.avg}년`    : '—' },
    { label: '중앙값',   value: stats.median != null ? `${stats.median}년` : '—' },
    { label: '최단',     value: stats.min    != null ? `${stats.min}년`    : '—' },
    { label: '최장 (worst)', value: stats.max != null
      ? <strong className="text-red-500 dark:text-red-400">{stats.max}년</strong>
      : '—' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {items.map(it => (
        <div key={it.label} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{it.label}</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{it.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── 코호트 테이블 ─────────────────────────────────────────

function CohortTable({ cohorts, worstY }: { cohorts: CohortRow[]; worstY: number | null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-950">
            <th className="py-2 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">진입 시점</th>
            <th className="py-2 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">완료여부</th>
            <th className="py-2 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">소요기간</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {cohorts.map((r, i) => {
            const isWorst = r.y !== null && worstY !== null && r.y === worstY
            const isIncomplete = r.y === null
            return (
              <tr
                key={i}
                className={
                  isWorst
                    ? 'bg-red-50 dark:bg-red-500/10'
                    : isIncomplete
                    ? 'bg-gray-50/50 dark:bg-gray-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }
              >
                <td className="py-2 px-4 font-mono text-gray-600 dark:text-gray-300">{r.s}</td>
                <td className="py-2 px-4">
                  {r.y !== null
                    ? <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">완료</span>
                    : <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">진행중</span>
                  }
                </td>
                <td className={`py-2 px-4 font-mono ${isWorst ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {fmtYears(r.y)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────

function SyntheticDataContent() {
  const searchParams = useSearchParams()

  const initLev  = (searchParams.get('lev') ?? '3x') as '1x' | '3x'
  const initBeta = searchParams.get('beta') ?? 'recent'

  const [lev,      setLev]      = useState<'1x' | '3x'>(initLev)
  const [betaKey,  setBetaKey]  = useState(initBeta)
  const [jsonData, setJsonData] = useState<CohortJson | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch('/data/synthetic_ndx_cohorts.json')
      .then(r => r.json())
      .then(d => { setJsonData(d); setLoading(false) })
  }, [])

  const cohorts = useMemo<CohortRow[]>(() => {
    if (!jsonData) return []
    if (betaKey === 'real') return jsonData.real[lev]
    return jsonData.synth[betaKey]?.[lev] ?? []
  }, [jsonData, betaKey, lev])

  const stats   = useMemo(() => calcStats(cohorts), [cohorts])
  const worstY  = stats.max

  const betaInfo = BETAS.find(b => b.key === betaKey)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-5xl" />

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/posts/synthetic-ndx-1929"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-4 inline-block"
          >
            ← 분석 글로 돌아가기
          </Link>
          <h1 className="text-2xl font-black mb-2">백테스트 데이터 — 합성 NDX 1929 시나리오</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            C전략 · 일 적립 20만원 · 목표 10억 · 1927~2026 (합성) / 1971~2026 (실측)
          </p>
        </div>

        {/* 레버리지 탭 */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          {LEVERAGES.map(l => (
            <button
              key={l.key}
              onClick={() => setLev(l.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                lev === l.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* 베타 선택 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {BETAS.map(b => {
            const isActive = betaKey === b.key
            const isRealOnly = b.key === 'real'
            return (
              <button
                key={b.key}
                onClick={() => setBetaKey(b.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isActive
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
                style={isActive ? { backgroundColor: b.color, borderColor: b.color } : {}}
              >
                {b.label}
                {isRealOnly && <span className="ml-1 opacity-70">(1971~)</span>}
              </button>
            )
          })}
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            데이터 로딩 중...
          </div>
        )}

        {/* 통계 + 테이블 */}
        {!loading && jsonData && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {LEVERAGES.find(l => l.key === lev)?.label} — {betaInfo?.label}
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                빨간 행 = worst-case ({worstY}년)
              </span>
            </div>

            <StatsBanner stats={stats} />

            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="max-h-[60vh] overflow-y-auto">
                <CohortTable cohorts={cohorts} worstY={worstY} />
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              총 {stats.total}가지 경우 · 완료 {stats.completed}가지 ·
              미완료 {stats.total - stats.completed}가지
              {betaKey === 'real' ? ' (실측 데이터 1971~2026)' : ' (합성 데이터 1927~2026)'}
            </p>
          </>
        )}

      </main>
    </div>
  )
}

export default function SyntheticDataPage() {
  return (
    <Suspense>
      <SyntheticDataContent />
    </Suspense>
  )
}
