'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useTheme } from '@/components/ThemeProvider'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

interface CohortStat { final: number; withdrawn: number; min: number; bankrupt: boolean; cagr: number }
interface CohortPoint { start: string; a: CohortStat; b: CohortStat }
interface MonthPoint { date: string; value: number; state?: string; is_invested?: boolean }
interface ComparisonData {
  cohorts: CohortPoint[]
  monthly_detail: Record<string, { a: MonthPoint[]; b: MonthPoint[] }>
}

const COHORT_LABELS: Record<string, string> = {
  '2000-03': '닷컴버블 정점 (2000-03)',
  '1996-10': '닷컴버블 직전 (1996-10)',
  '1999-03': '버블 상승 중 (1999-03)',
  '2003-03': '버블 바닥 이후 (2003-03)',
  '1989-05': '일본버블 직전 (1989-05)',
}

export default function WithdrawalComparisonChart({ data }: { data: ComparisonData }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [pluginLoaded, setPluginLoaded] = useState(false)
  const [tab, setTab] = useState<'monthly' | 'all'>('monthly')
  const monthlyRef = useRef<ChartJS<'line'> | null>(null)
  const allRef = useRef<ChartJS<'line'> | null>(null)

  const availableCohorts = Object.keys(data.monthly_detail).sort()
  const [selectedCohort, setSelectedCohort] = useState(availableCohorts[3] ?? availableCohorts[0])

  useEffect(() => {
    if (typeof window === 'undefined') return
    import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
      ChartJS.register(zoomPlugin)
      setPluginLoaded(true)
    })
  }, [])

  const gridColor = isDark ? '#374151' : '#e5e7eb'
  const tickColor = isDark ? '#9ca3af' : '#6b7280'
  const axisColor = isDark ? '#6b7280' : '#9ca3af'
  const refLineColor = isDark ? '#4b5563' : '#d1d5db'

  // ── 월별 추이 데이터 ──
  const monthlyA = data.monthly_detail[selectedCohort]?.a ?? []
  const monthlyB = data.monthly_detail[selectedCohort]?.b ?? []
  const dateSet = new Set([...monthlyA.map(d => d.date), ...monthlyB.map(d => d.date)])
  const aMap = Object.fromEntries(monthlyA.map(d => [d.date, d.value]))
  const bMap = Object.fromEntries(monthlyB.map(d => [d.date, d.value]))
  const monthlyDates = Array.from(dateSet).sort()

  const monthlyDatasets = [
    {
      label: 'A안 (SP500기반)',
      data: monthlyDates.map(date => aMap[date] ?? null),
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      borderWidth: 2,
      pointRadius: 0,
      spanGaps: true,
      tension: 0,
    },
    {
      label: 'B안 (MA200기반)',
      data: monthlyDates.map(date => bMap[date] ?? null),
      borderColor: '#10b981',
      backgroundColor: '#10b981',
      borderWidth: 2,
      pointRadius: 0,
      spanGaps: true,
      tension: 0,
    },
  ]

  // ── 전체 진입 시점 최종값 데이터 ──
  const allDates = data.cohorts.map(c => c.start)
  const allDatasets = [
    {
      label: 'A안 (SP500기반)',
      data: data.cohorts.map(c => c.a.bankrupt ? null : Math.min(c.a.final, 400)),
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      borderWidth: 1.5,
      pointRadius: 0,
      spanGaps: true,
      tension: 0,
    },
    {
      label: 'B안 (MA200기반)',
      data: data.cohorts.map(c => c.b.bankrupt ? null : Math.min(c.b.final, 400)),
      borderColor: '#10b981',
      backgroundColor: '#10b981',
      borderWidth: 1.5,
      pointRadius: 0,
      spanGaps: true,
      tension: 0,
    },
  ]

  // y=10 기준선 플러그인
  const makeRefLinePlugin = (label: string) => ({
    id: 'refLine10',
    afterDraw(chart: ChartJS) {
      const ctx = chart.ctx
      const yScale = chart.scales.y
      const xScale = chart.scales.x
      if (!yScale || !xScale) return
      const yPos = yScale.getPixelForValue(10)
      if (yPos < chart.chartArea.top || yPos > chart.chartArea.bottom) return
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(xScale.left, yPos)
      ctx.lineTo(xScale.right, yPos)
      ctx.strokeStyle = refLineColor
      ctx.setLineDash([4, 2])
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = axisColor
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(label, xScale.right - 4, yPos - 2)
      ctx.restore()
    },
  })

  const zoomOptions = pluginLoaded ? {
    zoom: {
      pan: { enabled: true, mode: 'x' as const },
      zoom: {
        wheel: { enabled: true },
        pinch: { enabled: true },
        mode: 'x' as const,
      },
    },
  } : {}

  const commonScales = {
    x: {
      ticks: { color: tickColor, font: { size: 10 } },
      grid: { color: gridColor },
      border: { color: gridColor },
    },
    y: {
      ticks: {
        color: tickColor,
        font: { size: 10 },
        callback: (v: number | string) => `${v}억`,
      },
      grid: { color: gridColor },
      border: { display: false },
    },
  }

  const commonPlugins = {
    legend: {
      labels: {
        color: tickColor,
        font: { size: 12 },
        usePointStyle: true,
        pointStyleWidth: 8,
        boxHeight: 8,
      },
    },
    tooltip: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      titleColor: tickColor,
      bodyColor: isDark ? '#f9fafb' : '#111827',
      padding: 8,
    },
    ...zoomOptions,
  }

  const monthlyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    scales: {
      ...commonScales,
      x: {
        ...commonScales.x,
        ticks: { ...commonScales.x.ticks, maxTicksLimit: 12 },
      },
    },
    plugins: {
      ...commonPlugins,
      tooltip: {
        ...commonPlugins.tooltip,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}억`,
        },
      },
    },
  }

  const allOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    scales: {
      ...commonScales,
      x: {
        ...commonScales.x,
        ticks: {
          ...commonScales.x.ticks,
          maxTicksLimit: 10,
          callback: (_: unknown, i: number) => allDates[i]?.slice(0, 4) ?? '',
        },
      },
    },
    plugins: {
      ...commonPlugins,
      tooltip: {
        ...commonPlugins.tooltip,
        callbacks: {
          title: (items: Array<{ label: string }>) => `${items[0]?.label ?? ''} 진입`,
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}억`,
        },
      },
    },
  }

  const tabClass = (t: string) =>
    `px-4 py-1.5 text-sm rounded-full transition-colors ${
      tab === t
        ? 'bg-blue-500 text-white'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-2 mb-5">
        <button className={tabClass('monthly')} onClick={() => setTab('monthly')}>주요 시작 시점 월별 추이</button>
        <button className={tabClass('all')} onClick={() => setTab('all')}>전체 시작 시점 최종값</button>
      </div>

      {/* ── 탭 1: 월별 추이 ── */}
      {tab === 'monthly' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableCohorts.map(k => (
              <button
                key={k}
                onClick={() => setSelectedCohort(k)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedCohort === k
                    ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-transparent'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-500'
                }`}
              >
                {COHORT_LABELS[k] ?? k}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            초기 10억에서 인출 시작. 세로 기준선 = 초기 투자액.
          </div>
          <div className="relative">
            <button
              onClick={() => monthlyRef.current?.resetZoom()}
              className="absolute top-0 right-0 z-10 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              줌 초기화
            </button>
            <div style={{ height: 300 }}>
              <Line
                ref={monthlyRef}
                data={{ labels: monthlyDates, datasets: monthlyDatasets }}
                options={monthlyOptions as Parameters<typeof Line>[0]['options']}
                plugins={[makeRefLinePlugin('10억')]}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
              휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
            </p>
          </div>
        </>
      )}

      {/* ── 탭 2: 전체 진입 시점 최종값 ── */}
      {tab === 'all' && (
        <>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            각 진입 시점별 20년 후 잔여 자산(억). 400억 초과값은 400억으로 캡 처리.
          </div>
          <div className="relative">
            <button
              onClick={() => allRef.current?.resetZoom()}
              className="absolute top-0 right-0 z-10 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              줌 초기화
            </button>
            <div style={{ height: 300 }}>
              <Line
                ref={allRef}
                data={{ labels: allDates, datasets: allDatasets }}
                options={allOptions as Parameters<typeof Line>[0]['options']}
                plugins={[makeRefLinePlugin('원금 10억')]}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
              휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
            </p>
          </div>
        </>
      )}
    </div>
  )
}
