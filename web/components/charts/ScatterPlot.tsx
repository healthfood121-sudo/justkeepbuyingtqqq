'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import type { CohortResult } from '@/lib/types'
import { useTheme } from '@/components/ThemeProvider'

ChartJS.register(LinearScale, PointElement, Tooltip, Legend)

interface Props {
  resultsA: CohortResult[]
  resultsB: CohortResult[]
  resultsC: CohortResult[]
  showA?: boolean
  showB?: boolean
  showC?: boolean
}

const COLORS = { A: '#10b981', B: '#f59e0b', C: '#3b82f6' }
const LABELS = { A: 'A전략(계속적립)', B: 'B전략(한도후중단)', C: 'C전략(거치+계속)' }

function toPoints(results: CohortResult[]) {
  return results
    .filter(r => r.status === 'completed' && r.yearsToTarget !== null)
    .map(r => ({
      x: r.startDate.getFullYear() + r.startDate.getMonth() / 12,
      y: Math.round(r.yearsToTarget! * 100) / 100,
    }))
}

export default function ScatterPlot({ resultsA, resultsB, resultsC, showA = true, showB = true, showC = true }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const chartRef = useRef<ChartJS<'scatter'> | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)

  // chartjs-plugin-zoom 동적 로드 (SSR 방지)
  useEffect(() => {
    if (typeof window === 'undefined') return
    import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
      ChartJS.register(zoomPlugin)
      setPluginLoaded(true)
    })
  }, [])

  const gridColor = isDark ? '#374151' : '#e5e7eb'
  const tickColor = isDark ? '#9ca3af' : '#6b7280'
  const labelColor = isDark ? '#6b7280' : '#9ca3af'

  const datasets = [
    showA && {
      label: LABELS.A,
      data: toPoints(resultsA),
      backgroundColor: COLORS.A + 'b3',  // 70% opacity
      pointRadius: 2,
      pointHoverRadius: 4,
    },
    showB && {
      label: LABELS.B,
      data: toPoints(resultsB),
      backgroundColor: COLORS.B + 'b3',
      pointRadius: 2,
      pointHoverRadius: 4,
    },
    showC && {
      label: LABELS.C,
      data: toPoints(resultsC),
      backgroundColor: COLORS.C + 'b3',
      pointRadius: 2,
      pointHoverRadius: 4,
    },
  ].filter(Boolean) as ChartJS<'scatter'>['data']['datasets']

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    scales: {
      x: {
        type: 'linear' as const,
        title: {
          display: true,
          text: '투자 시작 연도',
          color: labelColor,
          font: { size: 11 },
        },
        ticks: {
          color: tickColor,
          font: { size: 11 },
          callback: (v: number | string) => `${Math.floor(Number(v))}`,
        },
        grid: { color: gridColor },
      },
      y: {
        type: 'linear' as const,
        title: {
          display: true,
          text: '소요기간(년)',
          color: labelColor,
          font: { size: 11 },
        },
        ticks: { color: tickColor, font: { size: 11 } },
        grid: { color: gridColor },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: tickColor,
          font: { size: 12 },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const x = ctx.parsed.x
            const yr = Math.floor(x)
            const mo = Math.round((x - yr) * 12) + 1
            return `시작: ${yr}년 ${mo}월 / 소요: ${ctx.parsed.y}년`
          },
          title: () => '',
        },
        backgroundColor: isDark ? '#111827' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        titleColor: tickColor,
        bodyColor: isDark ? '#f9fafb' : '#111827',
        padding: 8,
      },
      ...(pluginLoaded ? {
        zoom: {
          pan: { enabled: true, mode: 'xy' as const },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'xy' as const,
          },
        },
      } : {}),
    },
  }

  const resetZoom = () => chartRef.current?.resetZoom()

  return (
    <div className="relative">
      <button
        onClick={resetZoom}
        className="absolute top-0 right-0 z-10 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        줌 초기화
      </button>
      <div style={{ height: 320 }}>
        <Scatter ref={chartRef} data={{ datasets }} options={options} />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
        휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
      </p>
    </div>
  )
}
