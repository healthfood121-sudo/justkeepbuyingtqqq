'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { makeDistribution } from '@/lib/backtest'
import type { CohortResult } from '@/lib/types'
import { useTheme } from '@/components/ThemeProvider'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Props {
  resultsA: CohortResult[]
  resultsB: CohortResult[]
  resultsC: CohortResult[]
  showA?: boolean
  showB?: boolean
  showC?: boolean
}

export default function DistributionChart({ resultsA, resultsB, resultsC, showA = true, showB = true, showC = true }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const chartRef = useRef<ChartJS<'bar'> | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)

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

  const distA = makeDistribution(resultsA)
  const distB = makeDistribution(resultsB)
  const distC = makeDistribution(resultsC)

  const maxBin = Math.max(
    distA.at(-1)?.yearsBin ?? 0,
    distB.at(-1)?.yearsBin ?? 0,
    distC.at(-1)?.yearsBin ?? 0,
  )

  const bins: { bin: string; A: number; B: number; C: number }[] = []
  for (let b = 0; b <= maxBin + 0.5; b += 0.5) {
    const key = Math.round(b * 10) / 10
    bins.push({
      bin: key.toFixed(1),
      A: distA.find(d => d.yearsBin === key)?.pct ?? 0,
      B: distB.find(d => d.yearsBin === key)?.pct ?? 0,
      C: distC.find(d => d.yearsBin === key)?.pct ?? 0,
    })
  }

  const labels = bins.map(b => b.bin)
  const datasets = [
    ...(showA ? [{
      label: 'A전략',
      data: bins.map(b => b.A),
      backgroundColor: '#10b981cc',
      borderWidth: 0,
    }] : []),
    ...(showB ? [{
      label: 'B전략',
      data: bins.map(b => b.B),
      backgroundColor: '#f59e0bcc',
      borderWidth: 0,
    }] : []),
    ...(showC ? [{
      label: 'C전략',
      data: bins.map(b => b.C),
      backgroundColor: '#3b82f6cc',
      borderWidth: 0,
    }] : []),
  ]

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    scales: {
      x: {
        ticks: {
          color: tickColor,
          font: { size: 10 },
          maxTicksLimit: 20,
        },
        grid: { color: gridColor },
        border: { color: gridColor },
        title: {
          display: true,
          text: '소요기간(년)',
          color: axisColor,
          font: { size: 12 },
          padding: { top: 8 },
        },
      },
      y: {
        ticks: {
          color: tickColor,
          font: { size: 11 },
          callback: (v: number | string) => `${v}%`,
        },
        grid: { color: gridColor },
        border: { display: false },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: tickColor,
          font: { size: 11 },
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
        callbacks: {
          title: (items: Array<{ label: string }>) => `${items[0]?.label ?? ''}년 구간`,
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`,
        },
      },
      ...(pluginLoaded ? {
        zoom: {
          pan: { enabled: true, mode: 'x' as const },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x' as const,
          },
        },
      } : {}),
    },
  }

  return (
    <div className="relative">
      <button
        onClick={() => chartRef.current?.resetZoom()}
        className="absolute top-0 right-0 z-10 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        줌 초기화
      </button>
      <div style={{ height: 280 }}>
        <Bar
          ref={chartRef}
          data={{ labels, datasets }}
          options={options as Parameters<typeof Bar>[0]['options']}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
        휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
      </p>
    </div>
  )
}
