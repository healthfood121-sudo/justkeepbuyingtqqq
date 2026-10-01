'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

// ── 타입 ─────────────────────────────────────────────────

type CohortRow = {
  s: string
  y: number
  bubble: boolean
  aFin: number
  aMin: number
  aOut: number
  bFin: number
  bMin: number
  bOut: number
}

type JsonData = {
  params: { buffer_ref: number; daily: number; lump: number; target: number }
  total: number
  bubble_total: number
  cohorts: CohortRow[]
}

// ── 유틸 ─────────────────────────────────────────────────

function fmtBillion(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}억`
  if (v >= 100_000_000)   return `${(v / 100_000_000).toFixed(0)}천만`
  if (v >= 10_000_000)    return `${(v / 10_000_000).toFixed(0)}백만`
  return `${(v / 10_000).toFixed(0)}만`
}

// ── 통계 배너 ─────────────────────────────────────────────

function StatsBanner({
  cohorts, method,
}: {
  cohorts: CohortRow[]
  method: 'A' | 'B'
}) {
  const fins = cohorts.map(r => method === 'A' ? r.aFin : r.bFin)
  const mins = cohorts.map(r => method === 'A' ? r.aMin : r.bMin)
  const outs = cohorts.map(r => method === 'A' ? r.aOut : r.bOut)

  const avgFin = fins.reduce((a, b) => a + b, 0) / fins.length
  const avgMin = Math.min(...mins)
  const avgOut = outs.reduce((a, b) => a + b, 0) / outs.length
  const worstFin = Math.min(...fins)

  const items = [
    { label: '총 경우',    value: `${cohorts.length}가지` },
    { label: '평균 최종값', value: fmtBillion(avgFin) },
    { label: '평균 인출액', value: fmtBillion(avgOut) },
    { label: '최악 최종값', value: <strong className="text-red-500 dark:text-red-400">{fmtBillion(worstFin)}</strong> },
    { label: '전기간 최소잔고', value: <strong className="text-orange-500 dark:text-orange-400">{fmtBillion(avgMin)}</strong> },
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

function CohortTable({
  cohorts, method,
}: {
  cohorts: CohortRow[]
  method: 'A' | 'B'
}) {
  const fins = cohorts.map(r => method === 'A' ? r.aFin : r.bFin)
  const worstFin = Math.min(...fins)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-950">
            <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium">진입</th>
            <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium">소요</th>
            <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium">버블</th>
            <th className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium">40년 후 최종값</th>
            <th className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium">기간 최소잔고</th>
            <th className="py-2 px-3 text-right text-gray-500 dark:text-gray-400 font-medium">누적 인출액</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {cohorts.map((r, i) => {
            const fin = method === 'A' ? r.aFin : r.bFin
            const min = method === 'A' ? r.aMin : r.bMin
            const out = method === 'A' ? r.aOut : r.bOut
            const isWorst = fin === worstFin
            return (
              <tr
                key={i}
                className={
                  isWorst
                    ? 'bg-red-50 dark:bg-red-500/10'
                    : r.bubble
                    ? 'bg-yellow-50/50 dark:bg-yellow-500/5'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }
              >
                <td className="py-2 px-3 font-mono text-gray-600 dark:text-gray-300">{r.s}</td>
                <td className={`py-2 px-3 font-mono ${isWorst ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {r.y.toFixed(2)}년
                </td>
                <td className="py-2 px-3">
                  {r.bubble
                    ? <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">버블</span>
                    : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                  }
                </td>
                <td className={`py-2 px-3 text-right font-mono ${isWorst ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {fmtBillion(fin)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-gray-500 dark:text-gray-400">
                  {fmtBillion(min)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-gray-500 dark:text-gray-400">
                  {fmtBillion(out)}
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

export default function WithdrawalDataPage() {
  const searchParams = useSearchParams()
  const initMethod = (searchParams.get('method') ?? 'A').toUpperCase() as 'A' | 'B'
  const initBubble = searchParams.get('bubble') === '1'

  const [data,     setData]     = useState<JsonData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [method,   setMethod]   = useState<'A' | 'B'>(initMethod)
  const [bubbleOnly, setBubbleOnly] = useState(initBubble)

  useEffect(() => {
    fetch('/data/withdrawal_cohorts.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  const cohorts = useMemo(() => {
    if (!data) return []
    return bubbleOnly
      ? data.cohorts.filter(r => r.bubble)
      : data.cohorts
  }, [data, bubbleOnly])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-5xl" />

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/posts/withdrawal-strategy"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-4 inline-block"
          >
            ← 분석 글로 돌아가기
          </Link>
          <h1 className="text-2xl font-black mb-2">백테스트 데이터 — 인출 전략 Method A vs B</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            NDX 3x B전략 · 거치 2.5억 + 일 적립 20만원 · 목표 10억 달성 후 40년 인출 시뮬레이션
          </p>
        </div>

        {/* 컨트롤 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Method 선택 */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
            {(['A', 'B'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  method === m
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Method {m}
              </button>
            ))}
          </div>

          {/* 버블 필터 */}
          <button
            onClick={() => setBubbleOnly(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              bubbleOnly
                ? 'bg-yellow-500 border-yellow-500 text-white'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-yellow-400'
            }`}
          >
            버블 케이스만 ({data?.bubble_total ?? '…'}가지)
          </button>
        </div>

        {/* Method 설명 */}
        <div className="text-xs text-gray-400 dark:text-gray-500 mb-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
          {method === 'A'
            ? '▸ Method A: 버블 케이스 → 2년 대기 후 buffer_years 동안 DCA 재진입'
            : '▸ Method B: 버블 케이스 → 즉시 buffer_years 동안 DCA 재진입'}
          <span className="ml-3 text-gray-300 dark:text-gray-600">|</span>
          <span className="ml-3">버블 = 소요기간 1.5년 미만 · buffer_years = max(0, 13 − 소요기간)</span>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            데이터 로딩 중...
          </div>
        )}

        {/* 통계 + 테이블 */}
        {!loading && data && (
          <>
            <StatsBanner cohorts={cohorts} method={method} />

            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold">
                Method {method} — {bubbleOnly ? `버블 케이스 ${cohorts.length}가지` : `전체 ${cohorts.length}가지`}
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                빨간 행 = 최악의 최종값 · 노란 배경 = 버블 케이스
              </span>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="max-h-[60vh] overflow-y-auto">
                <CohortTable cohorts={cohorts} method={method} />
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              총 {data.total}가지 경우 · 버블 케이스 {data.bubble_total}가지 (소요기간 1.5년 미만)
            </p>
          </>
        )}

      </main>
    </div>
  )
}
