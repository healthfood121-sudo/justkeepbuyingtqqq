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
import { makeCdf } from '@/lib/backtest'
import type { CohortResult, CdfPoint } from '@/lib/types'
import { useTheme } from '@/components/ThemeProvider'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

interface Props {
  resultsA: CohortResult[]
  resultsB: CohortResult[]
  resultsC: CohortResult[]
  showA?: boolean
  showB?: boolean
  showC?: boolean
}

export default function CdfChart({ resultsA, resultsB, resultsC, showA = true, showB = true, showC = true }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const chartRef = useRef<ChartJS<'line'> | null>(null)
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
  const refLineColor = isDark ? '#4b5563' : '#d1d5db'

  const cdfA = makeCdf(resultsA)
  const cdfB = makeCdf(resultsB)
  const cdfC = makeCdf(resultsC)

  const maxYr = Math.max(
    cdfA.at(-1)?.year ?? 0,
    cdfB.at(-1)?.year ?? 0,
    cdfC.at(-1)?.year ?? 0,
  )

  const getVal = (cdf: CdfPoint[], yr: number) => {
    const p = cdf.find(p => p.year === yr)
    if (p) return p.pct
    const last = cdf.at(-1)
    if (last && yr > last.year) return last.pct
    return 0
  }

  const labels = Array.from({ length: maxYr }, (_, i) => String(i + 1))
  const datasets = [
    ...(showA ? [{
      label: 'A전략',
      data: Array.from({ length: maxYr }, (_, i) => getVal(cdfA, i + 1)),
      borderColor: '#10b981',
      backgroundColor: '#10b981',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0,
    }] : []),
    ...(showB ? [{
      label: 'B전략',
      data: Array.from({ length: maxYr }, (_, i) => getVal(cdfB, i + 1)),
      borderColor: '#f59e0b',
      backgroundColor: '#f59e0b',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0,
    }] : []),
    ...(showC ? [{
      label: 'C전략',
      data: Array.from({ length: maxYr }, (_, i) => getVal(cdfC, i + 1)),
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0,
    }] : []),
  ]

  // y=50%, y=80% 기준선 플러그인
  const refLinesPlugin = {
    id: 'cdfRefLines',
    afterDraw(chart: ChartJS) {
      const ctx = chart.ctx
      const yScale = chart.scales.y
      const xScale = chart.scales.x
      if (!yScale || !xScale) return
      ;([{ y: 50, label: '50%' }, { y: 80, label: '80%' }] as { y: number; label: string }[]).forEach(({ y, label }) => {
        const yPos = yScale.getPixelForValue(y)
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
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(label, xScale.right - 4, yPos - 2)
        ctx.restore()
      })
    },
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    scales: {
      x: {
        ticks: {
          color: tickColor,
          font: { size: 11 },
          maxTicksLimit: 15,
        },
        grid: { color: gridColor },
        border: { color: gridColor },
        title: {
          display: true,
          text: '경과 년수',
          color: axisColor,
          font: { size: 12 },
          padding: { top: 8 },
        },
      },
      y: {
        min: 0,
        max: 100,
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
          title: (items: Array<{ label: string }>) => `${items[0]?.label ?? ''}년 이내`,
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
        <Line
          ref={chartRef}
          data={{ labels, datasets }}
          options={options as Parameters<typeof Line>[0]['options']}
          plugins={[refLinesPlugin]}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
        휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
      </p>
    </div>
  )
}
