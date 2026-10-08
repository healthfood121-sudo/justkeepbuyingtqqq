'use client'

import type { TooltipItem, ScriptableLineSegmentContext } from 'chart.js'
import { useEffect, useState, Suspense } from 'react'
import CostToggle from '@/components/CostToggle'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler)

// ─── 타입 ───────────────────────────────────────────────────

interface CohortStat {
  final: number
  withdrawn: number
  min: number
  bankrupt: boolean
  cagr: number
}

interface CohortSummary {
  start: string
  a: CohortStat
  b: CohortStat
}

// monthly: a = [[value, state(0W/1H/2HD)], ...], b = [[value, inv(0/1)], ...]
interface MonthlyData {
  a: [number, number][]
  b: [number, number][]
}

// ─── 유틸 ───────────────────────────────────────────────────

function fmt억(v: number, digits = 1) {
  return `${v.toFixed(digits)}억`
}

function addMonths(startYM: string, n: number): string {
  const [y, m] = startYM.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function stateLabel(s: number) {
  if (s === 1) return 'HOLD'
  if (s === 2) return 'HOLD_DEEP'
  return 'WITHDRAW'
}

// ─── 통계 비교 카드 ──────────────────────────────────────────

function StatCompareBadge({
  label, va, vb, better,
}: {
  label: string
  va: string
  vb: string
  better: 'a' | 'b' | 'none'
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{label}</p>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">A안</p>
          <p className={`text-sm font-bold ${better === 'a' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {va}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">B안</p>
          <p className={`text-sm font-bold ${better === 'b' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {vb}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── 차트 ───────────────────────────────────────────────────

function CohortChart({ start, monthly }: { start: string; monthly: MonthlyData }) {
  const labels = monthly.a.map((_, i) => {
    if (i % 12 === 0) return `${i / 12}년`
    return ''
  })

  const aValues = monthly.a.map(row => row[0])
  const bValues = monthly.b.map(row => row[0])

  // B안 투자/현금 구간 배경 계산
  const bInvested = monthly.b.map(row => row[1] === 1)


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        ticks: {
          color: '#6b7280',
          font: { size: 10 },
          maxRotation: 0,
        },
        grid: { color: '#e5e7eb' },
      },
      y: {
        type: 'linear' as const,
        title: {
          display: true,
          text: '억원',
          color: '#9ca3af',
          font: { size: 11 },
        },
        ticks: { color: '#6b7280', font: { size: 11 } },
        grid: { color: '#e5e7eb' },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#6b7280',
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<'line'>[]) => {
            const idx = items[0]?.dataIndex ?? 0
            return addMonths(start, idx)
          },
          afterBody: (items: TooltipItem<'line'>[]) => {
            const idx = items[0]?.dataIndex ?? 0
            const aState = stateLabel(monthly.a[idx]?.[1] ?? 0)
            const bInv = monthly.b[idx]?.[1] === 1 ? '투자중' : '현금보유'
            return [`A상태: ${aState}`, `B상태: ${bInv}`]
          },
        },
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        titleColor: '#374151',
        bodyColor: '#374151',
        padding: 10,
      },
    },
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'A안 (SP500기반)',
        data: aValues,
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
      },
      {
        label: 'B안 (MA200기반)',
        data: bValues,
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        segment: {
          borderColor: (ctx: ScriptableLineSegmentContext) => {
            const inv = bInvested[ctx.p0DataIndex]
            return inv ? '#3b82f6' : '#f97316'
          },
        },
      },
    ],
  }

  return (
    <div style={{ height: 360 }}>
      <Line data={data} options={options} />
    </div>
  )
}

// ─── 월별 상태 테이블 ─────────────────────────────────────────

function MonthlyTable({ start, monthly }: { start: string; monthly: MonthlyData }) {
  const [show, setShow] = useState(false)

  const rows = monthly.a.map((aRow, i) => ({
    date: addMonths(start, i),
    year: (i / 12).toFixed(1),
    aVal: aRow[0],
    aState: stateLabel(aRow[1]),
    bVal: monthly.b[i]?.[0] ?? 0,
    bInv: monthly.b[i]?.[1] === 1,
  }))

  return (
    <div className="mt-8">
      <button
        onClick={() => setShow(v => !v)}
        className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
      >
        {show ? '월별 데이터 접기 ↑' : '월별 데이터 펼치기 ↓'} ({rows.length}개월)
      </button>
      {show && (
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {['날짜', '경과(년)', 'A 평가액', 'A 상태', 'B 평가액', 'B 상태'].map(h => (
                  <th key={h} className="py-2 px-3 text-left text-gray-400 dark:text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((r) => (
                <tr key={r.date} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-1.5 px-3 font-mono text-gray-600 dark:text-gray-400">{r.date}</td>
                  <td className="py-1.5 px-3 text-gray-500 dark:text-gray-400">{r.year}</td>
                  <td className={`py-1.5 px-3 font-semibold ${r.aVal < 1 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {fmt억(r.aVal, 2)}
                  </td>
                  <td className={`py-1.5 px-3 ${r.aState !== 'WITHDRAW' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {r.aState}
                  </td>
                  <td className={`py-1.5 px-3 font-semibold ${r.bVal < 1 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {fmt억(r.bVal, 2)}
                  </td>
                  <td className={`py-1.5 px-3 ${!r.bInv ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {r.bInv ? '투자중' : '현금보유'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── 본체 ───────────────────────────────────────────────────

function CohortPageInner() {
  const params = useSearchParams()
  const start = params.get('start') ?? ''

  const [monthly, setMonthly] = useState<MonthlyData | null>(null)
  const [stat, setStat] = useState<CohortSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [withCosts, setWithCosts] = useState(true)
  useEffect(() => {
    if (!start) { setError('시작 시점이 지정되지 않았습니다.'); setLoading(false); return }

    Promise.all([
      fetch(`/data/withdrawal_monthly${withCosts ? '_v2' : ''}.json`).then(r => r.json()),
      fetch(`/data/withdrawal_comparison${withCosts ? '_v2' : ''}.json`).then(r => r.json()),
    ]).then(([monthly_all, comp]) => {
      const m = monthly_all[start]
      if (!m) { setError(`${start} 시작 데이터 없음`); setLoading(false); return }
      const s = comp.cohorts.find((c: CohortSummary) => c.start === start)
      if (!s) { setError(`${start} 요약 데이터 없음`); setLoading(false); return }
      setMonthly(m)
      setStat(s)
      setLoading(false)
    }).catch(() => {
      setError('withdrawal_monthly.json 파일이 없습니다. Python 스크립트를 재실행해주세요.')
      setLoading(false)
    })
  }, [start, withCosts])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">로딩 중…</p>
      </div>
    )
  }

  if (error || !monthly || !stat) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Header activePage="posts" maxWidth="max-w-4xl" />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <Link href="/posts/withdrawal-comparison/data" className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block">
            ← 목록으로
          </Link>
          <p className="text-red-500">{error || '데이터 없음'}</p>
        </main>
      </div>
    )
  }

  const endDate = addMonths(start, monthly.a.length - 1)
  const nMonths = monthly.a.length

  // 최솟값 달성 시점
  const aMinIdx = stat.a.bankrupt ? -1 : stat.a.min === stat.a.final
    ? nMonths - 1
    : monthly.a.reduce((mi, row, i) => row[0] < monthly.a[mi][0] ? i : mi, 0)
  const bMinIdx = monthly.b.reduce((mi, row, i) => row[0] < monthly.b[mi][0] ? i : mi, 0)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/posts/withdrawal-comparison/data"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-4 inline-block"
          >
            ← 전체 시작 시점 목록
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            시작 시점 상세 — {start} 시작
          </h1>
          <CostToggle withCosts={withCosts} onChange={setWithCosts} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            초기 10억 · 20년 시뮬레이션 ({start} ~ {endDate})
          </p>
        </div>

        {/* 정보 배지 */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: '시작일', value: start },
            { label: '종료일', value: endDate },
            { label: '총 기간', value: `${Math.round(nMonths / 12)}년 (${nMonths}개월)` },
            { label: '원금', value: '10억' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
          ))}
        </div>

        {/* 통계 비교 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCompareBadge
            label="최종 자산"
            va={stat.a.bankrupt ? '파산' : fmt억(stat.a.final)}
            vb={stat.b.bankrupt ? '파산' : fmt억(stat.b.final)}
            better={
              stat.a.bankrupt && !stat.b.bankrupt ? 'b'
              : !stat.a.bankrupt && stat.b.bankrupt ? 'a'
              : stat.b.final > stat.a.final ? 'b' : 'a'
            }
          />
          <StatCompareBadge
            label="연평균 수익률"
            va={`${stat.a.cagr.toFixed(1)}%`}
            vb={`${stat.b.cagr.toFixed(1)}%`}
            better={stat.b.cagr > stat.a.cagr ? 'b' : 'a'}
          />
          <StatCompareBadge
            label="총 인출액"
            va={fmt억(stat.a.withdrawn)}
            vb={fmt억(stat.b.withdrawn)}
            better="none"
          />
          <StatCompareBadge
            label="최솟값"
            va={fmt억(stat.a.min, 2)}
            vb={fmt억(stat.b.min, 2)}
            better={stat.b.min > stat.a.min ? 'b' : 'a'}
          />
        </div>

        {/* 차트 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">자산 추이</p>
            <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-0.5 bg-blue-400"></span> B안 투자중
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-0.5 bg-orange-400"></span> B안 현금보유
              </span>
            </div>
          </div>
          <CohortChart start={start} monthly={monthly} />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600 text-right mb-8">
          X축: 투자 경과 기간 (0~20년) · Y축: 총자산 (억원)
        </p>

        {/* 최솟값 시점 정보 */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl px-4 py-3">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">A안 최솟값 시점</p>
            {aMinIdx >= 0 ? (
              <>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{addMonths(start, aMinIdx)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {fmt억(monthly.a[aMinIdx][0], 3)} · 경과 {(aMinIdx / 12).toFixed(1)}년
                </p>
              </>
            ) : <p className="text-sm text-red-500">파산</p>}
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl px-4 py-3">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">B안 최솟값 시점</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{addMonths(start, bMinIdx)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {fmt억(monthly.b[bMinIdx][0], 3)} · 경과 {(bMinIdx / 12).toFixed(1)}년
            </p>
          </div>
        </div>

        {/* 월별 테이블 (접기/펼치기) */}
        <MonthlyTable start={start} monthly={monthly} />
      </main>
    </div>
  )
}

export default function CohortPage() {
  return (
    <Suspense>
      <CohortPageInner />
    </Suspense>
  )
}
