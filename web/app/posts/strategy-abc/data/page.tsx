'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

// ─── 타입 ───────────────────────────────────────────────────

interface CohortJsonRow {
  s: string
  sA: string; yA: number | null; eA: string | null; iA: number | null
  sB: string; yB: number | null; eB: string | null; iB: number | null
  sC: string; yC: number | null; eC: string | null; iC: number | null
}
interface JsonFile {
  meta: { params: { dailyInvest: number; lumpSum: number; target: number }; total: number }
  rows: CohortJsonRow[]
}

// ─── 상수 ───────────────────────────────────────────────────

const INSTRUMENTS = [
  { key: 'ndx3x', label: 'TQQQ (NDX 3x)' },
  { key: 'ndx2x', label: 'QLD (NDX 2x)' },
  { key: 'ndx1x', label: 'QQQ (NDX 1x)' },
  { key: 'sp500',  label: 'VOO (SP500)' },
]

const JSON_MAP_STANDARD: Record<string, string> = {
  ndx3x: '/data/cohorts_ndx3x_10b.json',
  ndx2x: '/data/cohorts_ndx2x_10b.json',
  ndx1x: '/data/cohorts_ndx1x_10b.json',
  sp500:  '/data/cohorts_sp500_10b.json',
}
const JSON_MAP_COSTS: Record<string, string> = {
  ndx3x: '/data/cohorts_ndx3x_10b_v2.json',
  ndx2x: '/data/cohorts_ndx2x_10b_v2.json',
  ndx1x: '/data/cohorts_ndx1x_10b_v2.json',
  sp500:  '/data/cohorts_sp500_10b.json',
}

const S_COLOR: Record<'A' | 'B' | 'C', string> = {
  A: 'text-emerald-600 dark:text-emerald-400',
  B: 'text-yellow-500 dark:text-yellow-400',
  C: 'text-blue-500 dark:text-blue-400',
}

// ─── 유틸 ───────────────────────────────────────────────────

function calcStats(rows: CohortJsonRow[], s: 'A' | 'B' | 'C') {
  const comp = rows.filter(r => r[`s${s}`] === 'completed')
  const years = comp.map(r => r[`y${s}`] as number).filter(y => y != null).sort((a, b) => a - b)
  const n = years.length
  return {
    total: rows.length,
    completed: n,
    pct: rows.length > 0 ? (n / rows.length * 100) : 0,
    avg:    n > 0 ? years.reduce((a, b) => a + b, 0) / n : null,
    median: n > 0 ? years[Math.floor(n / 2)] : null,
    max:    n > 0 ? years[n - 1] : null,
  }
}

// ─── 요약 배너 ───────────────────────────────────────────────

function StatBanner({ label, rows, color }: { label: string; rows: CohortJsonRow[]; color: string }) {
  const st = (['A', 'B', 'C'] as const).map(s => ({ s, ...calcStats(rows, s) }))
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {st.map(({ s, pct, median, avg, max }) => (
        <div
          key={s}
          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-center"
        >
          <p className={`text-sm font-bold mb-2 ${S_COLOR[s]}`}>{s}전략</p>
          {[
            { label: '완료율', value: `${pct.toFixed(1)}%` },
            { label: '중간값', value: median ? `${median.toFixed(2)}년` : '—' },
            { label: '평균',   value: avg    ? `${avg.toFixed(2)}년`    : '—' },
            { label: '최장',   value: max    ? `${max.toFixed(2)}년`    : '—' },
          ].map(({ label: l, value: v }) => (
            <div key={l} className="flex justify-between text-xs py-0.5">
              <span className="text-gray-400 dark:text-gray-500">{l}</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── 테이블 ─────────────────────────────────────────────────

type SortCol = 'start' | 'yA' | 'yB' | 'yC'

function calcCagr(target: number, invested: number | null, years: number | null): number | null {
  if (!invested || !years || invested <= 0 || years <= 0) return null
  return (Math.pow(target / invested, 1 / years) - 1) * 100
}

function DataTable({ rows, target }: { rows: CohortJsonRow[]; target: number }) {
  const [sort, setSort] = useState<{ col: SortCol; dir: 1 | -1 }>({ col: 'start', dir: 1 })

  const sorted = useMemo(() => {
    return [...rows].sort((x, y) => {
      if (sort.col === 'start') return sort.dir * x.s.localeCompare(y.s)
      const va = (sort.col === 'yA' ? x.yA : sort.col === 'yB' ? x.yB : x.yC) ?? 9999
      const vb = (sort.col === 'yA' ? y.yA : sort.col === 'yB' ? y.yB : y.yC) ?? 9999
      return sort.dir * (va - vb)
    })
  }, [rows, sort])

  const toggle = (col: SortCol) =>
    setSort(s => ({ col, dir: s.col === col ? (-s.dir as 1 | -1) : 1 }))

  const Th = ({ col, children }: { col: SortCol; children: React.ReactNode }) => (
    <th
      onClick={() => toggle(col)}
      className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 text-xs whitespace-nowrap"
    >
      {children}{sort.col === col ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
    </th>
  )

  const fmtY = (y: number | null) =>
    y == null ? <span className="text-gray-300 dark:text-gray-600">진행중</span> : <span>{y.toFixed(2)}년</span>

  const fmtD = (d: string | null) =>
    d ? d.slice(0, 7) : <span className="text-gray-300 dark:text-gray-600">—</span>

  const fmtInv = (n: number | null) =>
    n == null ? '—' : n >= 1e8 ? `${(n / 1e8).toFixed(1)}억` : `${Math.round(n / 1e4).toLocaleString()}만`

  const fmtCagr = (invested: number | null, years: number | null) => {
    const r = calcCagr(target, invested, years)
    if (r == null) return null
    return `연 ${r.toFixed(1)}%`
  }

  return (
    <div className="overflow-auto max-h-[540px]">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-white dark:bg-gray-950 z-10">
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <Th col="start">시작일</Th>
            {(['A', 'B', 'C'] as const).map(s => (
              <Th key={s} col={`y${s}` as SortCol}>
                <span className={S_COLOR[s]}>{s}</span> 달성일
              </Th>
            ))}
            {(['A', 'B', 'C'] as const).map(s => (
              <Th key={s} col={`y${s}` as SortCol}>
                <span className={S_COLOR[s]}>{s}</span> 소요
              </Th>
            ))}
            {(['A', 'B', 'C'] as const).map(s => (
              <th key={s} className="py-2 px-3 text-xs text-gray-400 dark:text-gray-500 text-left whitespace-nowrap">
                <span className={S_COLOR[s]}>{s}</span> 투입 · 수익률
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.map(r => {
            const isWorstB = r.yB != null && r.yA != null && r.yB > r.yA + 1
            return (
              <tr key={r.s} className={`transition-colors ${isWorstB ? 'bg-yellow-50/40 dark:bg-yellow-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                <td className="py-2 px-3 font-mono text-gray-600 dark:text-gray-300">{r.s.slice(0, 7)}</td>
                {(['A', 'B', 'C'] as const).map(s => (
                  <td key={s} className={`py-2 px-3 font-mono ${r[`s${s}`] === 'completed' ? S_COLOR[s] : 'text-gray-300 dark:text-gray-600'}`}>
                    {fmtD(r[`e${s}`])}
                  </td>
                ))}
                {(['A', 'B', 'C'] as const).map(s => (
                  <td key={s} className={`py-2 px-3 font-mono ${r[`s${s}`] === 'completed' ? S_COLOR[s] + '/80' : 'text-gray-300 dark:text-gray-600'}`}>
                    {fmtY(r[`y${s}`])}
                  </td>
                ))}
                {(['A', 'B', 'C'] as const).map(s => {
                  const inv = r[`i${s}`] as number | null
                  const yr  = r[`y${s}`] as number | null
                  const cagr = fmtCagr(inv, yr)
                  return (
                    <td key={s} className="py-2 px-3 font-mono">
                      <span className="text-gray-400">{fmtInv(inv)}</span>
                      {cagr && <span className="block text-emerald-500 dark:text-emerald-400 text-[10px]">{cagr}</span>}
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

// ─── 본체 ───────────────────────────────────────────────────

function DataPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const inst = params.get('inst') ?? 'ndx3x'

  const [data,      setData]      = useState<JsonFile | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [withCosts, setWithCosts] = useState(true)

  const jsonMap = withCosts ? JSON_MAP_COSTS : JSON_MAP_STANDARD

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(jsonMap[inst] ?? jsonMap['ndx3x'])
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [inst, withCosts])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-6xl" />
      <main className="max-w-6xl mx-auto px-6 py-12">

        <div className="mb-8">
          <Link href="/posts/strategy-abc" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-block">
            ← 분석 글로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">A·B·C 전략 비교 — 전체 진입 시점 데이터</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            일 20만원 · 거치/한도 2.5억 · 목표 10억 · 1971~현재
          </p>
        </div>

        {/* 종목 탭 + 비용 모드 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {INSTRUMENTS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => router.push(`?inst=${key}`)}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
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
              className={`px-3 py-1.5 transition-colors ${
                !withCosts
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              운용보수만
            </button>
            <button
              onClick={() => setWithCosts(true)}
              className={`px-3 py-1.5 transition-colors ${
                withCosts
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              + 스왑금리
            </button>
          </div>
          {withCosts && inst === 'sp500' && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">SP500은 레버리지 없음 — standard와 동일</span>
          )}
        </div>

        {loading && <div className="flex items-center justify-center h-40 text-gray-400">로딩 중…</div>}

        {!loading && data && (
          <>
            <StatBanner label={inst} rows={data.rows} color="" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              헤더 클릭 → 정렬 · 노란 행 = B전략이 A전략보다 1년 이상 더 걸린 진입 시점
            </p>
            <DataTable rows={data.rows} target={data.meta.params.target} />
          </>
        )}
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
