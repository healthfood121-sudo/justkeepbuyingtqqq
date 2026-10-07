'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

// ── 타입 ─────────────────────────────────────────────────

type CohortRow = { s: string; y: number | null; e: string | null }
type Stats = {
  total: number; completed: number; pct: number
  avg: number | null; median: number | null; min: number | null; max: number | null
}
type MethodData = { label: string; stats: Stats; cohorts: CohortRow[] }
type JsonFile = {
  instrument: string
  params: { lump: number; daily: number; target: number }
  methods: Record<string, MethodData>
}

// ── 상수 ─────────────────────────────────────────────────

const INSTRUMENTS = [
  { key: 'ndx3x', label: 'TQQQ (NDX 3x)' },
  { key: 'ndx2x', label: 'QLD (NDX 2x)' },
  { key: 'ndx1x', label: '나스닥100 (1x)' },
]

const METHOD_KEYS = [
  'instant', 'dip15', 'dip20', 'dip30',
  'monthly3y', 'monthly4y', 'monthly5y',
  'daily1y', 'daily2y', 'daily3y',
]

// ── 유틸 ─────────────────────────────────────────────────

function fmtYears(y: number | null) {
  if (y === null) return <span className="text-gray-400">미완료</span>
  return `${y.toFixed(2)}년`
}

// ── 통계 요약 배너 ────────────────────────────────────────

function StatsBanner({ stats }: { stats: Stats }) {
  const items = [
    { label: '완료율', value: `${stats.completed}/${stats.total} (${stats.pct}%)` },
    { label: '평균',   value: stats.avg    != null ? `${stats.avg}년`    : '—' },
    { label: '중앙값', value: stats.median != null ? `${stats.median}년` : '—' },
    { label: '최단',   value: stats.min    != null ? `${stats.min}년`    : '—' },
    { label: '최장',   value: stats.max    != null ? <strong className="text-red-500 dark:text-red-400">{stats.max}년</strong> : '—' },
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
            <th className="py-2 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">달성 시점</th>
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
                <td className="py-2 px-4 font-mono text-gray-500 dark:text-gray-400">
                  {r.e ?? '—'}
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

function LumpSumDataContent() {
  const searchParams = useSearchParams()

  const initInst   = searchParams.get('inst')   ?? 'ndx3x'
  const initMethod = searchParams.get('m')      ?? 'instant'

  const [instKey,   setInstKey]   = useState(initInst)
  const [methodKey, setMethodKey] = useState(initMethod)
  const [fileData,  setFileData]  = useState<JsonFile | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [withCosts, setWithCosts] = useState(true)

  // 종목/비용모드 변경 시 JSON 로드
  useEffect(() => {
    setLoading(true)
    setFileData(null)
    const suffix = withCosts ? '_v2' : ''
    fetch(`/data/split_entry_${instKey}${suffix}.json`)
      .then(r => r.json())
      .then(d => { setFileData(d); setLoading(false) })
  }, [instKey, withCosts])

  // 유효한 methodKey 보장
  useEffect(() => {
    if (fileData && !fileData.methods[methodKey]) {
      setMethodKey('instant')
    }
  }, [fileData, methodKey])

  const currentMethod = fileData?.methods[methodKey] ?? null

  const worstY = useMemo(() =>
    currentMethod?.stats.max ?? null
  , [currentMethod])

  const methodKeys = useMemo(() =>
    fileData ? METHOD_KEYS.filter(k => fileData.methods[k]) : []
  , [fileData])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-5xl" />

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/posts/lump-sum-vs-split"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-4 inline-block"
          >
            ← 분석 글로 돌아가기
          </Link>
          <h1 className="text-2xl font-black mb-2">백테스트 데이터 — 거치금 분할 진입</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            거치 2.5억 · 일 적립 20만원 · 목표 10억 · 1971~2026 모든 진입 시점
          </p>
        </div>

        {/* 종목 탭 + 비용 모드 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {INSTRUMENTS.map(inst => (
              <button
                key={inst.key}
                onClick={() => setInstKey(inst.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  instKey === inst.key
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {inst.label}
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
        </div>

        {/* 방식 선택 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {methodKeys.map(k => {
            const label = fileData?.methods[k]?.label ?? k
            const isActive = methodKey === k
            return (
              <button
                key={k}
                onClick={() => setMethodKey(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                {label}
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
        {!loading && currentMethod && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {INSTRUMENTS.find(i => i.key === instKey)?.label} — {currentMethod.label}
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                빨간 행 = 최장 소요기간 ({worstY}년)
              </span>
            </div>

            <StatsBanner stats={currentMethod.stats} />

            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="max-h-[60vh] overflow-y-auto">
                <CohortTable cohorts={currentMethod.cohorts} worstY={worstY} />
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              총 {currentMethod.stats.total}가지 경우 · 완료 {currentMethod.stats.completed}가지 ·
              미완료 {currentMethod.stats.total - currentMethod.stats.completed}가지 (2026-09 현재 진행중)
            </p>
          </>
        )}

      </main>
    </div>
  )
}

export default function LumpSumDataPage() {
  return (
    <Suspense>
      <LumpSumDataContent />
    </Suspense>
  )
}
